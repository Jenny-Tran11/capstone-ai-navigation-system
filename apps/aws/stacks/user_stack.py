from pathlib import Path

from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_authorizers as apigwv2_auth,
    aws_apigatewayv2_integrations as apigwv2_integ,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_lambda_nodejs as lambda_nodejs,
    aws_logs as logs,
)
from constructs import Construct


def _repo_root() -> Path:
    """apps/aws/stacks/user_stack.py -> parents[3] = monorepo root."""
    return Path(__file__).resolve().parents[3]


class UserApiStack(Stack):
    """
    Cognito + DynamoDB + HTTP API (JWT) + Node Lambda running packages/api.
    Baseline-inspired layout; IaC is CDK (not Serverless Framework).
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        root = _repo_root()
        api_entry = root / "packages" / "api" / "src" / "lambda.ts"
        lockfile = root / "package-lock.json"

        users_table = dynamodb.Table(
            self,
            "UsersTable",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
        )

        user_pool = cognito.UserPool(
            self,
            "BlindNavUserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY,
        )

        user_pool_client = user_pool.add_client(
            "MobileClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
            prevent_user_existence_errors=True,
        )

        user_fn = lambda_nodejs.NodejsFunction(
            self,
            "UserApiFunction",
            runtime=_lambda.Runtime.NODEJS_20_X,
            entry=str(api_entry),
            handler="handler",
            project_root=str(root),
            deps_lock_file_path=str(lockfile),
            environment={"USERS_TABLE": users_table.table_name},
            timeout=Duration.seconds(15),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )
        users_table.grant_read_write_data(user_fn)

        issuer = (
            f"https://cognito-idp.{self.region}.amazonaws.com/"
            f"{user_pool.user_pool_id}"
        )

        jwt_authorizer = apigwv2_auth.HttpJwtAuthorizer(
            "CognitoJwtAuthorizer",
            jwt_audience=[user_pool_client.user_pool_client_id],
            jwt_issuer=issuer,
        )

        http_api = apigwv2.HttpApi(
            self,
            "BlindNavUserHttpApi",
            description="BlindNav user profile API (JWT)",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["authorization", "content-type"],
                max_age=Duration.days(1),
            ),
            default_authorizer=jwt_authorizer,
        )

        integration = apigwv2_integ.HttpLambdaIntegration(
            "UserApiIntegration", user_fn
        )
        http_api.add_routes(
            path="/{proxy+}",
            methods=[apigwv2.HttpMethod.ANY],
            integration=integration,
        )

        CfnOutput(
            self,
            "UserHttpApiUrl",
            value=http_api.api_endpoint,
            description="Base URL for user API (append /me)",
        )
        CfnOutput(
            self,
            "UserPoolId",
            value=user_pool.user_pool_id,
            description="Cognito User Pool ID",
        )
        CfnOutput(
            self,
            "UserPoolClientId",
            value=user_pool_client.user_pool_client_id,
            description="Cognito app client ID (audience for JWT)",
        )
        CfnOutput(
            self,
            "CognitoIssuer",
            value=issuer,
            description="JWT issuer (OpenID)",
        )
        CfnOutput(
            self,
            "UsersTableName",
            value=users_table.table_name,
            description="DynamoDB users table",
        )
