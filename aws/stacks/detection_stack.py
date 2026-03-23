from aws_cdk import (
    CfnTag,
    Duration,
    Stack,
    aws_apigateway as apigw,
    aws_budgets as budgets,
    aws_cloudwatch as cw,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_s3 as s3,
)
from constructs import Construct


class DetectionStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for model artifacts
        models_bucket = s3.Bucket(
            self,
            "ModelsBucket",
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
        )

        # S3 bucket for temporary uploads
        uploads_bucket = s3.Bucket(
            self,
            "UploadsBucket",
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(1),
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
        )

        # Lambda from Docker image (built from aws/lambda/detect)
        detect_fn = _lambda.DockerImageFunction(
            self,
            "DetectFunction",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="lambda/detect"
            ),
            memory_size=2048,
            timeout=Duration.seconds(30),
            log_retention=logs.RetentionDays.ONE_WEEK,
            environment={
                "MODEL_BUCKET": models_bucket.bucket_name,
                "MODEL_KEY": "yolo12n.pt",
                "UPLOADS_BUCKET": uploads_bucket.bucket_name,
            },
        )

        # Allow Lambda to read model and work with uploads bucket
        models_bucket.grant_read(detect_fn)
        uploads_bucket.grant_read_write(detect_fn)

        # API Gateway REST API with POST /detect
        api = apigw.RestApi(
            self,
            "BlindNavApi",
            rest_api_name="BlindNavDetectionApi",
            description="Blind navigation detection API",
            deploy_options=apigw.StageOptions(
                throttling_rate_limit=10,
                throttling_burst_limit=20,
                metrics_enabled=True,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=False,
            ),
        )

        api_key = api.add_api_key("BlindNavApiKey")
        plan = api.add_usage_plan(
            "BlindNavUsagePlan",
            name="BlindNavUsagePlan",
            throttle=apigw.ThrottleSettings(
                rate_limit=10,
                burst_limit=20,
            ),
            quota=apigw.QuotaSettings(
                limit=100000,
                period=apigw.Period.MONTH,
            ),
        )
        plan.add_api_key(api_key)
        plan.add_api_stage(stage=api.deployment_stage)

        detect_integration = apigw.LambdaIntegration(detect_fn)
        detect_resource = api.root.add_resource("detect")
        detect_resource.add_method(
            "POST",
            detect_integration,
            api_key_required=True,
        )

        # CloudWatch Alarms
        errors_metric = detect_fn.metric_errors()
        duration_metric = detect_fn.metric_duration(
            statistic="p95",
        )

        errors_alarm = cw.Alarm(
            self,
            "DetectErrorsAlarm",
            metric=errors_metric,
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        duration_alarm = cw.Alarm(
            self,
            "DetectDurationAlarm",
            metric=duration_metric,
            threshold=2000,
            evaluation_periods=1,
            comparison_operator=cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        # Simple CloudWatch dashboard for the detection Lambda and API
        dashboard = cw.Dashboard(self, "BlindNavDashboard")
        dashboard.add_widgets(
            cw.GraphWidget(
                title="DetectFunction Invocations",
                left=[detect_fn.metric_invocations()],
            ),
            cw.GraphWidget(
                title="DetectFunction Errors",
                left=[errors_metric],
            ),
            cw.GraphWidget(
                title="DetectFunction Duration p95 (ms)",
                left=[duration_metric],
            ),
        )

        # AWS Budget: USD 5/month with notifications at 50/80/100%
        # Note: You must configure the actual notification channels (e.g. email/SNS)
        # in the AWS console after the budget is created.
        budgets.CfnBudget(
            self,
            "BlindNavMonthlyBudget",
            budget=budgets.CfnBudget.BudgetDataProperty(
                budget_type="COST",
                budget_name="BlindNav-Monthly-Budget",
                time_unit="MONTHLY",
                budget_limit=budgets.CfnBudget.SpendProperty(
                    amount=5.0,
                    unit="USD",
                ),
            ),
            notifications_with_subscribers=[
                budgets.CfnBudget.NotificationWithSubscribersProperty(
                    notification=budgets.CfnBudget.NotificationProperty(
                        notification_type="ACTUAL",
                        threshold_type="PERCENTAGE",
                        threshold=50,
                        comparison_operator="GREATER_THAN",
                    ),
                    subscribers=[],
                ),
                budgets.CfnBudget.NotificationWithSubscribersProperty(
                    notification=budgets.CfnBudget.NotificationProperty(
                        notification_type="ACTUAL",
                        threshold_type="PERCENTAGE",
                        threshold=80,
                        comparison_operator="GREATER_THAN",
                    ),
                    subscribers=[],
                ),
                budgets.CfnBudget.NotificationWithSubscribersProperty(
                    notification=budgets.CfnBudget.NotificationProperty(
                        notification_type="ACTUAL",
                        threshold_type="PERCENTAGE",
                        threshold=100,
                        comparison_operator="GREATER_THAN",
                    ),
                    subscribers=[],
                ),
            ],
        )

