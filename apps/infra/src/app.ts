#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { suppressNagRules } from './config/nag-suppressions';
import { getStageConfig } from './config/stage-config';
import { ApiStack } from './stacks/api-stack';
import { AuthStack } from './stacks/auth-stack';
import { DataStack } from './stacks/data-stack';
import { SpaStack } from './stacks/spa-stack';
import { StorageStack } from './stacks/storage-stack';

const app = new cdk.App();
const config = getStageConfig(app);
const { appName, stage, account, region } = config;

const env: cdk.Environment = { account, region };
const tags = {
  AppName: appName,
  Stage: stage,
  Product: 'Baseline',
  ManagedBy: 'CDK',
};
const prefix = `${appName}-${stage}`;

const auth = new AuthStack(app, `${prefix}-auth`, {
  config,
  env,
  tags,
  stackName: `${prefix}-auth`,
  description: `${appName} ${stage} — Cognito (User Pool, Client, Identity Pool)`,
});

const data = new DataStack(app, `${prefix}-data`, {
  config,
  env,
  tags,
  stackName: `${prefix}-data`,
  description: `${appName} ${stage} — DynamoDB tables`,
});

const storage = new StorageStack(app, `${prefix}-storage`, {
  config,
  env,
  tags,
  stackName: `${prefix}-storage`,
  description: `${appName} ${stage} — S3 file storage + CloudFront`,
});

const apiStack = new ApiStack(app, `${prefix}-api`, {
  config,
  userPool: auth.userPool,
  tables: data.tables,
  fileBucket: storage.fileBucket,
  env,
  tags,
  stackName: `${prefix}-api`,
  description: `${appName} ${stage} — API (Lambda + API Gateway)`,
});
apiStack.addDependency(auth);
apiStack.addDependency(data);
apiStack.addDependency(storage);

const spaStack = new SpaStack(app, `${prefix}-spa`, {
  config,
  env,
  tags,
  stackName: `${prefix}-spa`,
  description: `${appName} ${stage} — Admin + Web SPAs`,
});

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
for (const stack of [auth, data, storage, apiStack, spaStack]) {
  suppressNagRules(stack);
}
