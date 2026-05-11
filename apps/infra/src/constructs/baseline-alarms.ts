import { CfnOutput, Duration } from 'aws-cdk-lib';
import type * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';

export interface BaselineAlarmsProps {
  config: StageConfig;
  functions: Array<{ alarmKey: string; fn: lambda.Function }>;
  api?: apigateway.RestApi;
  alarmTopicArn?: string;
  alarmEmail?: string;
}

export class BaselineAlarms extends Construct {
  public readonly topic: sns.ITopic;

  constructor(scope: Construct, id: string, props: BaselineAlarmsProps) {
    super(scope, id);
    const { config, functions, api, alarmTopicArn, alarmEmail } = props;
    const { appName, stage } = config;

    this.topic = alarmTopicArn
      ? sns.Topic.fromTopicArn(this, 'Topic', alarmTopicArn)
      : new sns.Topic(this, 'Topic', {
          topicName: `${appName}-${stage}-alarms`,
        });

    if (alarmEmail && !alarmTopicArn) {
      (this.topic as sns.Topic).addSubscription(
        new snsSubscriptions.EmailSubscription(alarmEmail),
      );
    }

    const action = new cloudwatchActions.SnsAction(this.topic as sns.Topic);
    const timeoutSeconds = 29;

    // Use explicit static keys from stack code so logical IDs stay stable.
    for (const { alarmKey, fn } of functions) {
      const id = `Lambda${alarmKey.replace(/[^A-Za-z0-9]/g, '')}`;

      const errorAlarm = new cloudwatch.Alarm(this, `${id}Errors`, {
        metric: fn.metricErrors({ period: Duration.minutes(5) }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorAlarm.addAlarmAction(action);

      const throttleAlarm = new cloudwatch.Alarm(this, `${id}Throttles`, {
        metric: fn.metricThrottles({ period: Duration.minutes(5) }),
        threshold: 10,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      throttleAlarm.addAlarmAction(action);

      const durationAlarm = new cloudwatch.Alarm(this, `${id}Duration`, {
        metric: fn.metricDuration({
          period: Duration.minutes(5),
          statistic: 'p99',
        }),
        threshold: timeoutSeconds * 1000 * 0.8,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      durationAlarm.addAlarmAction(action);
    }

    if (api) {
      const apiAlarm = new cloudwatch.Alarm(this, 'Api5xx', {
        metric: api.metricServerError({ period: Duration.minutes(5) }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      apiAlarm.addAlarmAction(action);
    }

    new CfnOutput(this, 'AlarmTopicArn', { value: this.topic.topicArn });
  }
}
