# Build `apps/infra` — AWS CDK v2 App

Complete, self-contained spec. An agent can create every file from this document alone.

---

## What this replaces

| Old file | Replaced by |
|---|---|
| `packages/api/serverless.yml` | `SharedStack` (Cognito + DynamoDB) + `ApiStack` (Lambda + API Gateway) |
| `packages/admin/serverless.yml` | `SpaStack` via `SpaDeployment` construct |
| `packages/web/serverless.yml` | `SpaStack` via `SpaDeployment` construct |

**Local dev is unchanged.** `serverless-offline` and `serverless-dynamodb` stay in `apps/api/`.
Rename `apps/api/serverless.yml` → `apps/api/serverless.local.yml` and update its start script.

---

## File tree

```
apps/infra/
├── bin/
│   └── infra.ts                    # CDK App entry point
├── src/
│   ├── config/
│   │   ├── stage-config.ts         # StageConfig type + getStageConfig()
│   │   └── tables.ts               # DynamoDB table definitions (shared source of truth)
│   ├── constructs/
│   │   ├── baseline-function.ts    # Lambda construct (Node 20, ARM64, esbuild)
│   │   ├── baseline-spa-app.ts     # SPA hosting (S3 + CloudFront + optional BucketDeployment)
│   │   ├── baseline-alarms.ts      # CloudWatch alarms per Lambda (errors + throttles → SNS)
│   │   └── baseline-dashboard.ts   # CloudWatch dashboard (invocations, errors, duration)
│   └── stacks/
│       ├── shared-stack.ts         # STATEFUL — Cognito + all DynamoDB tables
│       ├── api-stack.ts            # STATELESS — REST API Gateway + Lambdas + alarms + dashboard
│       ├── admin-stack.ts          # STATELESS — admin SPA (S3 + CloudFront)
│       └── web-stack.ts            # STATELESS — web SPA (S3 + CloudFront)
├── cdk.json
├── package.json
└── tsconfig.json
```

---

## `package.json`

```json
{
  "name": "@baseline/infra",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build":           "tsc --noEmit",
    "synth":           "cdk synth --context stage=staging",
    "diff:staging":    "cdk diff --all --context stage=staging",
    "diff:prod":       "cdk diff --all --context stage=prod",
    "deploy:staging":  "cdk deploy --all --context stage=staging --require-approval never",
    "deploy:prod":     "cdk deploy --all --context stage=prod --require-approval broadening",
    "destroy:staging": "cdk destroy --all --context stage=staging --force",
    "bootstrap":       "cdk bootstrap --context stage=staging"
  },
  "dependencies": {
    "aws-cdk-lib":        "2.177.0",
    "constructs":         "10.4.2",
    "source-map-support": "0.5.21"
  },
  "devDependencies": {
    "@types/node": "22.13.10",
    "aws-cdk":     "2.177.0",
    "esbuild":     "0.25.1",
    "ts-node":     "10.9.2",
    "typescript":  "5.7.3"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target":           "ES2022",
    "module":           "commonjs",
    "moduleResolution": "node",
    "lib":              ["es2022"],
    "declaration":      true,
    "strict":           true,
    "noImplicitAny":    true,
    "strictNullChecks": true,
    "noImplicitThis":   true,
    "alwaysStrict":     true,
    "outDir":           ".dist",
    "rootDir":          ".",
    "skipLibCheck":     true,
    "esModuleInterop":  true,
    "resolveJsonModule": true
  },
  "include": ["bin/**/*.ts", "src/**/*.ts"],
  "exclude": ["node_modules", ".dist"]
}
```

---

## `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/infra.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "**/*.d.ts", "**/*.js",
                "tsconfig.json", "package*.json", "node_modules"]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false
  }
}
```

---

## `src/config/stage-config.ts`

```typescript
import type * as cdk from 'aws-cdk-lib';

export type Stage = 'local' | 'staging' | 'prod';

export interface StageConfig {
  appName: string;
  stage: Stage;
  account: string | undefined;
  region: string;
  isProd: boolean;
  /** RemovalPolicy string — callers import RemovalPolicy and use this to pick the right value */
  retain: boolean;
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
    retain: isProd,
    logRetentionDays: isProd ? 90 : 14,
    corsOrigin: isProd ? `https://${appName}.com` : '*',
  };
}

/** Consistent resource naming: `{appName}-{stage}-{suffix}` */
export function n(config: StageConfig, suffix: string): string {
  return `${config.appName}-${config.stage}-${suffix}`;
}
```

---

## `src/config/tables.ts`

Single source of truth for every DynamoDB table. Both the CDK stacks and the local
`serverless.local.yml` seed config should reference these definitions.

```typescript
export interface TableDef {
  /** Full physical table name, e.g. "myapp-staging-admin" */
  tableName: string;
  partitionKeyName: string;
  gsis?: Array<{
    indexName: string;
    partitionKeyName: string;
    sortKeyName: string;
  }>;
  stream?: boolean;
}

export function getTableDefs(appName: string, stage: string): TableDef[] {
  const name = (s: string) => `${appName}-${stage}-${s}`;

  return [
    {
      // Legacy admin table — kept during transition to permission system
      tableName:        name('admin'),
      partitionKeyName: 'userSub',
    },
    {
      tableName:        name('permission'),
      partitionKeyName: 'permissionId',
      gsis: [
        {
          indexName:        'ownerId-compositeKey-index',
          partitionKeyName: 'ownerId',
          sortKeyName:      'compositeKey',
        },
        {
          indexName:        'type-compositeKey-index',
          partitionKeyName: 'type',
          sortKeyName:      'compositeKey',
        },
      ],
    },
    {
      tableName:        name('workspace'),
      partitionKeyName: 'workspaceId',
      stream:           true,
    },
  ];
}
```

---

## `src/constructs/baseline-function.ts`

A `Construct` (not a subclass) that wraps `NodejsFunction`. Exposes `.fn` for IAM grants
and event source mappings. Entry path is relative to `apps/api/src`.

```typescript
import * as path from 'path';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface BaselineFunctionProps extends Omit<NodejsFunctionProps, 'entry' | 'handler'> {
  /** Path to the handler file relative to apps/api/src, e.g. "baseblocks/admin/admin-api.ts" */
  entryPath: string;
  environment?: Record<string, string>;
}

export class BaselineFunction extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: BaselineFunctionProps) {
    super(scope, id);

    const { entryPath, environment, ...rest } = props;

    this.fn = new NodejsFunction(this, 'Fn', {
      // apps/infra/src/constructs/ → ../../../../api/src/{entryPath}
      entry:        path.resolve(__dirname, '..', '..', '..', '..', 'api', 'src', entryPath),
      handler:      'handler',
      runtime:      lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout:      Duration.seconds(30),
      memorySize:   2048,
      bundling: {
        minify:          false,
        sourceMap:       true,
        externalModules: ['@aws-sdk/*'],
        ...rest.bundling,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        ...environment,
      },
      ...rest,
    });
  }
}
```

---

## `src/constructs/baseline-spa-app.ts`

S3 + CloudFront with OAC. `sourceDir` is optional — when provided, CDK uploads the built
assets and invalidates `/*` on every deploy. When omitted (e.g. admin in staging where CI
handles the upload separately), the bucket and distribution are still created.

```typescript
import * as path from 'path';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface BaselineSpaAppProps {
  appName: string;
  stage: string;
  /** Logical name used in resource IDs and output keys, e.g. "Admin" or "Web" */
  name: string;
  /**
   * Absolute path to the built SPA assets directory (.dist/).
   * When provided, assets are uploaded and CloudFront is invalidated on deploy.
   * When omitted, only the bucket and distribution are provisioned.
   */
  sourceDir?: string;
}

export class BaselineSpaApp extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: BaselineSpaAppProps) {
    super(scope, id);

    const { appName, stage, name, sourceDir } = props;
    const lower = name.toLowerCase();
    const isProd = stage === 'prod';

    // ── S3 bucket ────────────────────────────────────
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName:        `${appName}-${stage}-${lower}`,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls:      false,
        blockPublicPolicy:    false,
        ignorePublicAcls:     false,
        restrictPublicBuckets: false,
      }),
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy:   isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
    });

    // ── No-cache response headers ────────────────────
    const noCachePolicy = new cloudfront.ResponseHeadersPolicy(this, 'NoCachePolicy', {
      responseHeadersPolicyName: `${appName}-${stage}-${lower}-no-cache`,
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Cache-Control', value: 'no-cache', override: true },
        ],
      },
    });

    // ── CloudFront distribution with OAC ─────────────
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: `${appName}-${stage}-${lower} OAC`,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy:           cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: noCachePolicy,
        allowedMethods:        cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        compress:              true,
      },
      defaultRootObject: 'index.html',
      httpVersion:       cloudfront.HttpVersion.HTTP2,
      // SPA routing — serve index.html for any 403/404
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    // ── Optional: upload assets + invalidate on deploy ─
    if (sourceDir) {
      new s3deploy.BucketDeployment(this, 'Deploy', {
        sources:           [s3deploy.Source.asset(sourceDir)],
        destinationBucket: this.bucket,
        distribution:      this.distribution,
        distributionPaths: ['/*'],
        prune:             true,
      });
    }

    // ── Outputs ──────────────────────────────────────
    new CfnOutput(this, `${name}Url`, {
      description: `${name} CloudFront URL`,
      value:       `https://${this.distribution.distributionDomainName}`,
      exportName:  `${appName}-${stage}-${name}Url`,
    });
    new CfnOutput(this, `${name}DistributionId`, {
      description: `${name} CloudFront Distribution ID`,
      value:       this.distribution.distributionId,
      exportName:  `${appName}-${stage}-${name}DistributionId`,
    });
    new CfnOutput(this, `${name}BucketName`, {
      description: `${name} S3 Bucket`,
      value:       this.bucket.bucketName,
      exportName:  `${appName}-${stage}-${name}BucketName`,
    });
  }
}
```

---

## `src/constructs/baseline-alarms.ts`

Per-function CloudWatch alarms for errors and throttles, routed to an SNS topic.

```typescript
import { CfnOutput, Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface BaselineAlarmsProps {
  appName: string;
  stage: string;
  functions: lambda.Function[];
  /** Existing SNS topic ARN — if omitted a new topic is created */
  alarmTopicArn?: string;
}

export class BaselineAlarms extends Construct {
  public readonly topic: sns.ITopic;

  constructor(scope: Construct, id: string, props: BaselineAlarmsProps) {
    super(scope, id);
    const { appName, stage, functions, alarmTopicArn } = props;

    this.topic = alarmTopicArn
      ? sns.Topic.fromTopicArn(this, 'Topic', alarmTopicArn)
      : new sns.Topic(this, 'Topic', { topicName: `${appName}-${stage}-alarms` });

    const action = new cloudwatchActions.SnsAction(this.topic as sns.Topic);

    for (const fn of functions) {
      const base = `${appName}-${stage}-${fn.functionName}`;

      const errorAlarm = new cloudwatch.Alarm(this, `${fn.node.id}Errors`, {
        alarmName:          `${base}-errors`,
        metric:             fn.metricErrors({ period: Duration.minutes(5) }),
        threshold:          5,
        evaluationPeriods:  1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData:   cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorAlarm.addAlarmAction(action);

      const throttleAlarm = new cloudwatch.Alarm(this, `${fn.node.id}Throttles`, {
        alarmName:          `${base}-throttles`,
        metric:             fn.metricThrottles({ period: Duration.minutes(5) }),
        threshold:          10,
        evaluationPeriods:  1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData:   cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      throttleAlarm.addAlarmAction(action);
    }

    new CfnOutput(this, 'AlarmTopicArn', { value: this.topic.topicArn });
  }
}
```

---

## `src/constructs/baseline-dashboard.ts`

CloudWatch dashboard — one row per Lambda with invocations, errors, p50 duration, p99 duration.

```typescript
import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface BaselineDashboardProps {
  appName: string;
  stage: string;
  functions: lambda.Function[];
}

export class BaselineDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: BaselineDashboardProps) {
    super(scope, id);
    const { appName, stage, functions } = props;
    const period = Duration.minutes(5);

    const widgets: cloudwatch.IWidget[][] = [
      [new cloudwatch.TextWidget({
        markdown: `## ${appName} · ${stage} — API`,
        width: 24, height: 1,
      })],
    ];

    for (const fn of functions) {
      widgets.push([
        new cloudwatch.GraphWidget({ title: `${fn.functionName} — Invocations`, width: 6, height: 4, left: [fn.metricInvocations({ period })] }),
        new cloudwatch.GraphWidget({ title: `${fn.functionName} — Errors`,      width: 6, height: 4, left: [fn.metricErrors({ period })] }),
        new cloudwatch.GraphWidget({ title: `${fn.functionName} — Duration p50`, width: 6, height: 4, left: [fn.metricDuration({ period, statistic: 'p50' })] }),
        new cloudwatch.GraphWidget({ title: `${fn.functionName} — Duration p99`, width: 6, height: 4, left: [fn.metricDuration({ period, statistic: 'p99' })] }),
      ]);
    }

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${appName}-${stage}-api`,
      widgets,
    });
  }
}
```

---

## `src/stacks/shared-stack.ts`

**Stateful.** Owns Cognito and all DynamoDB tables. Deploy this first.
All outputs use `exportName` so other stacks can reference them without cross-stack props
if needed in future.

```typescript
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { getTableDefs } from '../config/tables';
import type { StageConfig } from '../config/stage-config';

export interface SharedStackProps extends StackProps {
  config: StageConfig;
}

export class SharedStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly adminTable: dynamodb.Table;
  public readonly permissionTable: dynamodb.Table;
  public readonly workspaceTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: SharedStackProps) {
    super(scope, id, props);
    const { config } = props;
    const { appName, stage, retain } = config;
    const removalPolicy = retain ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    // ── Cognito ──────────────────────────────────────
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName:        `${appName}-${stage}-user-pool`,
      selfSignUpEnabled:   false,
      signInAliases:       { email: true },
      autoVerify:          { email: true },
      signInCaseSensitive: false,
      standardAttributes: {
        email:      { required: true,  mutable: true },
        givenName:  { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        userId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength:        8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits:    true,
        requireSymbols:   false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName:          `${appName}-${stage}-user-pool-client`,
      userPool:                    this.userPool,
      generateSecret:              false,
      preventUserExistenceErrors:  true,
      authFlows: {
        userPassword:      true,
        userSrp:           true,
        adminUserPassword: true,
      },
      accessTokenValidity:  cdk.Duration.hours(1),
      idTokenValidity:      cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(365),
    });

    // ── DynamoDB — iterate table definitions ─────────
    const tableDefs = getTableDefs(appName, stage);

    const makeTable = (defIndex: number, constructId: string): dynamodb.Table => {
      const def = tableDefs[defIndex];
      const table = new dynamodb.Table(this, constructId, {
        tableName:        def.tableName,
        partitionKey:     { name: def.partitionKeyName, type: dynamodb.AttributeType.STRING },
        billingMode:      dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: retain,
        removalPolicy,
        stream: def.stream ? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES : undefined,
      });
      for (const gsi of def.gsis ?? []) {
        table.addGlobalSecondaryIndex({
          indexName:    gsi.indexName,
          partitionKey: { name: gsi.partitionKeyName, type: dynamodb.AttributeType.STRING },
          sortKey:      { name: gsi.sortKeyName,      type: dynamodb.AttributeType.STRING },
        });
      }
      return table;
    };

    this.adminTable      = makeTable(0, 'AdminTable');
    this.permissionTable = makeTable(1, 'PermissionTable');
    this.workspaceTable  = makeTable(2, 'WorkspaceTable');

    // ── Outputs ──────────────────────────────────────
    new CfnOutput(this, 'UserPoolId',          { value: this.userPool.userPoolId,              exportName: `${appName}-${stage}-UserPoolId` });
    new CfnOutput(this, 'UserPoolClientId',    { value: this.userPoolClient.userPoolClientId,  exportName: `${appName}-${stage}-UserPoolClientId` });
    new CfnOutput(this, 'AdminTableName',      { value: this.adminTable.tableName,             exportName: `${appName}-${stage}-AdminTableName` });
    new CfnOutput(this, 'PermissionTableName', { value: this.permissionTable.tableName,        exportName: `${appName}-${stage}-PermissionTableName` });
    new CfnOutput(this, 'WorkspaceTableName',  { value: this.workspaceTable.tableName,         exportName: `${appName}-${stage}-WorkspaceTableName` });
  }
}

import * as cdk from 'aws-cdk-lib'; // needed for Duration — add to top of file
```

> **Note:** Move the `import * as cdk` to the top of the file with the other imports.

---

## `src/stacks/api-stack.ts`

**Stateless.** REST API Gateway + one Lambda per baseblock + workspace stream handler
+ OG image Lambda URL + CloudWatch alarms + dashboard.

```typescript
import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BaselineFunction } from '../constructs/baseline-function';
import { BaselineAlarms } from '../constructs/baseline-alarms';
import { BaselineDashboard } from '../constructs/baseline-dashboard';
import type { StageConfig } from '../config/stage-config';

export interface ApiStackProps extends StackProps {
  config: StageConfig;
  userPool: cognito.UserPool;
  adminTable: dynamodb.Table;
  permissionTable: dynamodb.Table;
  workspaceTable: dynamodb.Table;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { config, userPool, adminTable, permissionTable, workspaceTable } = props;
    const { appName, stage, corsOrigin, logRetentionDays } = config;

    const sharedEnv: Record<string, string> = {
      APP_NAME:             appName,
      NODE_ENV:             stage,
      API_CORS_ORIGIN:      corsOrigin,
      COGNITO_USER_POOL_ID: userPool.userPoolId,
    };

    // ── REST API ─────────────────────────────────────
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName:   `${appName}-${stage}-api`,
      deployOptions: { stageName: stage },
      defaultCorsPreflightOptions: {
        allowOrigins:      [corsOrigin],
        allowHeaders:      ['Content-Type', 'X-Amz-Date', 'Authorization',
                            'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials:  false,
      },
      minimumCompressionSize: 1024,
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      authorizerName:    `${appName}-${stage}-authorizer`,
      cognitoUserPools:  [userPool],
    });

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ── Shared IAM policies ──────────────────────────
    const dynamoPolicy = new iam.PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:Scan', 'dynamodb:GetItem',
                'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem',
                'dynamodb:BatchGetItem'],
      resources: [
        adminTable.tableArn,      `${adminTable.tableArn}/index/*`,
        permissionTable.tableArn, `${permissionTable.tableArn}/index/*`,
        workspaceTable.tableArn,  `${workspaceTable.tableArn}/index/*`,
      ],
    });

    const cognitoPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminCreateUser', 'cognito-idp:AdminGetUser',
                'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminResetUserPassword',
                'cognito-idp:ListUsers'],
      resources: [userPool.userPoolArn],
    });

    // Helper: create Lambda, add proxy routes, grant shared policies
    const addRoute = (opts: {
      constructId: string;
      entryPath: string;
      pathSegment: string;
      extraEnv?: Record<string, string>;
    }): BaselineFunction => {
      const wrap = new BaselineFunction(this, opts.constructId, {
        entryPath:   opts.entryPath,
        environment: { ...sharedEnv, ...opts.extraEnv },
        logRetention: logRetentionDays as any,
      });
      wrap.fn.addToRolePolicy(dynamoPolicy);
      wrap.fn.addToRolePolicy(cognitoPolicy);

      const resource   = api.root.addResource(opts.pathSegment);
      const integration = new apigateway.LambdaIntegration(wrap.fn);
      resource.addMethod('ANY', integration, authOptions);
      resource.addProxy({ anyMethod: false, defaultIntegration: integration })
              .addMethod('ANY', integration, authOptions);

      return wrap;
    };

    // ── Lambdas ──────────────────────────────────────
    const adminFn      = addRoute({ constructId: 'AdminLambda',      entryPath: 'baseblocks/admin/admin-api.ts',            pathSegment: 'admin' });
    const permissionFn = addRoute({ constructId: 'PermissionLambda', entryPath: 'baseblocks/permission/permission-api.ts',  pathSegment: 'permission' });
    const workspaceFn  = addRoute({ constructId: 'WorkspaceLambda',  entryPath: 'baseblocks/workspace/workspace-api.ts',    pathSegment: 'workspace' });
    const cognitoFn    = addRoute({ constructId: 'CognitoUserLambda',entryPath: 'baseblocks/cognito-user/cognito-user-api.ts', pathSegment: 'cognito-user' });

    // ── Workspace DynamoDB stream handler ────────────
    const streamFn = new BaselineFunction(this, 'WorkspaceStreamLambda', {
      entryPath:    'baseblocks/workspace/workspace-stream.ts',
      environment:  sharedEnv,
      logRetention: logRetentionDays as any,
    });
    streamFn.fn.addEventSourceMapping('WorkspaceStream', {
      eventSourceArn:      workspaceTable.tableStreamArn!,
      startingPosition:    lambda.StartingPosition.TRIM_HORIZON,
      bisectBatchOnError:  true,
    });
    workspaceTable.grantStreamRead(streamFn.fn);

    // ── OG image Lambda (public Function URL) ────────
    const ogFn = new BaselineFunction(this, 'OgImageLambda', {
      entryPath:   'og/og-handler.ts',
      memorySize:  1024,
      environment: sharedEnv,
      logRetention: logRetentionDays as any,
      bundling: {
        minify:          false,
        sourceMap:       true,
        externalModules: ['@aws-sdk/*'],
        nodeModules:     ['satori', '@resvg/resvg-wasm'],
      },
    });
    const ogUrl = ogFn.fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ['*'], allowedMethods: [lambda.HttpMethod.GET] },
    });
    new CfnOutput(this, 'OgImageUrl', {
      value:      ogUrl.url,
      exportName: `${appName}-${stage}-OgImageUrl`,
    });

    // ── Alarms + Dashboard ───────────────────────────
    const monitoredFns = [adminFn, permissionFn, workspaceFn, cognitoFn]
      .map((w) => w.fn);

    new BaselineAlarms(this, 'Alarms', {
      appName,
      stage,
      functions: monitoredFns,
    });

    new BaselineDashboard(this, 'Dashboard', {
      appName,
      stage,
      functions: monitoredFns,
    });

    new CfnOutput(this, 'ApiUrl', {
      value:      api.url,
      exportName: `${appName}-${stage}-ApiUrl`,
    });
  }
}
```

---

## `src/stacks/admin-stack.ts`

**Stateless.** Provisions the admin SPA bucket and CloudFront distribution.
`sourceDir` is omitted — CI/CD uploads the built admin app separately via the S3 bucket name output.

```typescript
import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaselineSpaApp } from '../constructs/baseline-spa-app';
import type { StageConfig } from '../config/stage-config';

export interface AdminStackProps extends StackProps {
  config: StageConfig;
}

export class AdminStack extends Stack {
  constructor(scope: Construct, id: string, props: AdminStackProps) {
    super(scope, id, props);

    new BaselineSpaApp(this, 'AdminSpa', {
      appName: props.config.appName,
      stage:   props.config.stage,
      name:    'Admin',
      // sourceDir omitted — upload handled by CI after build
    });
  }
}
```

---

## `src/stacks/web-stack.ts`

**Stateless.** Provisions the web SPA bucket and CloudFront distribution.
`sourceDir` is provided so `cdk deploy` uploads and invalidates automatically.

```typescript
import * as path from 'path';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaselineSpaApp } from '../constructs/baseline-spa-app';
import type { StageConfig } from '../config/stage-config';

export interface WebStackProps extends StackProps {
  config: StageConfig;
}

export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    // src/stacks/ → ../../../../web/.dist = apps/web/.dist
    const sourceDir = path.resolve(__dirname, '..', '..', '..', '..', 'web', '.dist');

    new BaselineSpaApp(this, 'WebSpa', {
      appName:   props.config.appName,
      stage:     props.config.stage,
      name:      'Web',
      sourceDir,
    });
  }
}
```

---

## `bin/infra.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getStageConfig } from '../src/config/stage-config';
import { SharedStack } from '../src/stacks/shared-stack';
import { ApiStack }    from '../src/stacks/api-stack';
import { AdminStack }  from '../src/stacks/admin-stack';
import { WebStack }    from '../src/stacks/web-stack';

const app = new cdk.App();
const config = getStageConfig(app);
const { appName, stage, account, region } = config;

const env: cdk.Environment = { account, region };
const tags = { AppName: appName, Stage: stage, Product: 'Baseline', ManagedBy: 'CDK' };
const prefix = `${appName}-${stage}`;

const shared = new SharedStack(app, `${prefix}-shared`, {
  config, env, tags,
  stackName:   `${prefix}-shared`,
  description: `${appName} ${stage} — Cognito + DynamoDB`,
});

new ApiStack(app, `${prefix}-api`, {
  config,
  userPool:        shared.userPool,
  adminTable:      shared.adminTable,
  permissionTable: shared.permissionTable,
  workspaceTable:  shared.workspaceTable,
  env, tags,
  stackName:   `${prefix}-api`,
  description: `${appName} ${stage} — API (Lambda + API Gateway)`,
});

new AdminStack(app, `${prefix}-admin`, {
  config, env, tags,
  stackName:   `${prefix}-admin`,
  description: `${appName} ${stage} — Admin SPA`,
});

new WebStack(app, `${prefix}-web`, {
  config, env, tags,
  stackName:   `${prefix}-web`,
  description: `${appName} ${stage} — Web SPA`,
});
```

---

## Root `package.json` scripts to add

```json
{
  "scripts": {
    "synth":           "pnpm --filter @baseline/infra run synth",
    "deploy:staging":  "pnpm --filter @baseline/admin run build && pnpm --filter @baseline/web run build && pnpm --filter @baseline/infra run deploy:staging",
    "deploy:prod":     "pnpm --filter @baseline/admin run build && pnpm --filter @baseline/web run build && pnpm --filter @baseline/infra run deploy:prod",
    "destroy:staging": "pnpm --filter @baseline/infra run destroy:staging",
    "diff:staging":    "pnpm --filter @baseline/infra run diff:staging",
    "diff:prod":       "pnpm --filter @baseline/infra run diff:prod"
  }
}
```

---

## Stack deploy order

```
shared  ──→  api     (depends on shared for Cognito + tables)
             admin   (independent)
             web     (independent)
```

CDK deploys `admin` and `web` in parallel with `api`. `shared` always deploys first.

---

## Bootstrap (one-time per account + region)

```bash
npm install -g aws-cdk
APP_NAME=myapp cdk bootstrap --context stage=staging aws://ACCOUNT_ID/ap-southeast-2
```

---

## Deployment

```bash
# Preview
APP_NAME=myapp pnpm diff:staging

# Deploy to staging
APP_NAME=myapp AWS_PROFILE=myprofile pnpm deploy:staging

# Deploy to prod
APP_NAME=myapp AWS_PROFILE=myprofile pnpm deploy:prod
```

---

## Key implementation notes

1. **`BaselineFunction` wraps, not extends, `NodejsFunction`.** Access the underlying Lambda via `.fn`. This matches the reference and allows `NodejsFunction` to be versioned independently.

2. **Entry paths** in `BaselineFunction` are relative to `apps/api/src`. The construct resolves the absolute path using `path.resolve(__dirname, ...)`.

3. **`sourceDir` is optional on `BaselineSpaApp`.** The admin stack omits it so CI handles the upload. The web stack provides it for automatic upload on `cdk deploy`.

4. **All DynamoDB tables live in `SharedStack`**, not separate stacks. This avoids cross-stack circular references when the API needs to write to multiple tables simultaneously.

5. **OG image Lambda** uses a public Function URL (no authorizer). It bundles `satori` and `@resvg/resvg-wasm` via `nodeModules` in the esbuild config.

6. **Workspace stream Lambda** subscribes to the DynamoDB stream on `workspaceTable`. It does not have an API Gateway route.

7. **No `cdk-nag`** by default — add it selectively if your organisation requires it.
