import { RemovalPolicy } from 'aws-cdk-lib';
import type * as cdk from 'aws-cdk-lib';

export type Stage = 'local' | 'staging' | 'prod';

export interface StageConfig {
  appName: string;
  stage: Stage;
  account: string | undefined;
  region: string;
  isProd: boolean;
  removalPolicy: RemovalPolicy;
  pitrEnabled: boolean;
  logRetentionDays: number;
  corsOrigin: string;
}

export function getStageConfig(app: cdk.App): StageConfig {
  const stage = (app.node.tryGetContext('stage') as string | undefined) as Stage | undefined;
  if (!stage) throw new Error('Missing required context: --context stage=<staging|prod>');

  const appName = process.env['APP_NAME'];
  if (!appName) throw new Error('Missing required environment variable: APP_NAME');

  const region = process.env['AWS_REGION'] ?? process.env['CDK_DEFAULT_REGION'] ?? 'ap-southeast-2';
  const account = process.env['CDK_DEFAULT_ACCOUNT'];
  const isProd = stage === 'prod';

  return {
    appName,
    stage,
    account,
    region,
    isProd,
    removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    pitrEnabled: stage !== 'local',
    logRetentionDays: isProd ? 90 : 14,
    corsOrigin: isProd ? `https://${appName}.com` : '*',
  };
}

export function n(config: StageConfig, suffix: string): string {
  return `${config.appName}-${config.stage}-${suffix}`;
}
