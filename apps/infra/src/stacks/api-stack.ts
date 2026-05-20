import { CfnOutput, Size, Stack, type StackProps } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';
import { BaselineAlarms } from '../constructs/baseline-alarms';
import { BaselineFunction } from '../constructs/baseline-function';

export interface ApiStackProps extends StackProps {
  config: StageConfig;
  userPool: cognito.UserPool;
  tables: Map<string, dynamodb.Table>;
  fileBucket: s3.Bucket;
}

interface ApiEntity {
  name: string;
  path: string;
  entry: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { config, userPool, tables, fileBucket } = props;
    const { appName, stage, corsOrigin } = config;

    // ── REST API ─────────────────────────────────────
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${appName}-${stage}-api`,
      deployOptions: { stageName: stage },
      minCompressionSize: Size.bytes(1024),
      defaultCorsPreflightOptions: {
        allowOrigins: [corsOrigin],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'Authorizer',
      {
        authorizerName: `${appName}-${stage}-authorizer`,
        cognitoUserPools: [userPool],
      },
    );

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ── Shared IAM policies ──────────────────────────
    const tableArns = Array.from(tables.values()).flatMap((t) => [
      t.tableArn,
      `${t.tableArn}/index/*`,
    ]);

    const dynamoPolicy = new iam.PolicyStatement({
      actions: [
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:BatchGetItem',
      ],
      resources: tableArns,
    });

    const cognitoPolicy = new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminResetUserPassword',
        'cognito-idp:ListUsers',
      ],
      resources: [userPool.userPoolArn],
    });

    const bedrockInvokePolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    });

    const transcribePolicy = new iam.PolicyStatement({
      actions: [
        'transcribe:StartTranscriptionJob',
        'transcribe:GetTranscriptionJob',
        'transcribe:DeleteTranscriptionJob',
      ],
      resources: ['*'],
    });

    // ── API entities ─────────────────────────────────
    const apiEntities: ApiEntity[] = [
      {
        name: 'ApiAppConfig',
        path: 'app-config',
        entry: 'baseblocks/app-config/app-config-api.ts',
      },
      {
        name: 'ApiPermission',
        path: 'permission',
        entry: 'baseblocks/permission/permission-api.ts',
      },
      {
        name: 'ApiWorkspace',
        path: 'workspace',
        entry: 'baseblocks/workspace/workspace-api.ts',
      },
      {
        name: 'ApiDetection',
        path: 'detection',
        entry: 'baseblocks/detection/detection-api.ts',
      },
      {
        name: 'ApiUserProfile',
        path: 'user-profile',
        entry: 'baseblocks/user-profile/user-profile-api.ts',
      },
    ];

    const lambdaFunctions: Array<{ alarmKey: string; fn: BaselineFunction }> = [];

    for (const entity of apiEntities) {
      const fn = new BaselineFunction(this, entity.name, {
        config,
        functionName: entity.name,
        entry: entity.entry,
        environment: {
          COGNITO_USER_POOL_ID: userPool.userPoolId,
        },
      });

      fn.fn.addToRolePolicy(dynamoPolicy);
      fn.fn.addToRolePolicy(cognitoPolicy);
      fileBucket.grantReadWrite(fn.fn);

      const resource = api.root.addResource(entity.path);
      const integration = new apigateway.LambdaIntegration(fn.fn);
      resource.addMethod('ANY', integration, authOptions);
      resource
        .addProxy({ anyMethod: false, defaultIntegration: integration })
        .addMethod('ANY', integration, authOptions);

      lambdaFunctions.push({ alarmKey: entity.name, fn });
    }

    // ── Transit API (Bedrock-powered bus OCR, authenticated) ──────────────────
    const transitFn = new BaselineFunction(this, 'ApiTransit', {
      config,
      functionName: 'ApiTransit',
      entry: 'baseblocks/transit/transit-api.ts',
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        BEDROCK_REGION: process.env.BEDROCK_REGION ?? config.region,
        BEDROCK_MODEL_ID:
          process.env.BEDROCK_MODEL_ID ?? 'apac.amazon.nova-lite-v1:0',
      },
    });
    transitFn.fn.addToRolePolicy(dynamoPolicy);
    transitFn.fn.addToRolePolicy(cognitoPolicy);
    transitFn.fn.addToRolePolicy(bedrockInvokePolicy);

    const transitIntegration = new apigateway.LambdaIntegration(transitFn.fn);
    const transitResource = api.root.addResource('transit');
    transitResource.addMethod('ANY', transitIntegration, authOptions);
    transitResource
      .addProxy({ anyMethod: false, defaultIntegration: transitIntegration })
      .addMethod('ANY', transitIntegration, authOptions);

    lambdaFunctions.push({ alarmKey: 'ApiTransit', fn: transitFn });

    // ── Assistant API (Transcribe + Bedrock FM, authenticated) ────────────────
    const assistantFn = new BaselineFunction(this, 'ApiAssistant', {
      config,
      functionName: 'ApiAssistant',
      entry: 'baseblocks/assistant/assistant-api.ts',
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        FILE_BUCKET_NAME: fileBucket.bucketName,
        BEDROCK_REGION: process.env.BEDROCK_REGION ?? config.region,
        BEDROCK_ASSISTANT_MODEL_ID:
          process.env.BEDROCK_ASSISTANT_MODEL_ID ??
          'apac.amazon.nova-lite-v1:0',
        TRANSCRIBE_REGION: process.env.TRANSCRIBE_REGION ?? config.region,
        TRANSCRIBE_LANGUAGE_CODE:
          process.env.TRANSCRIBE_LANGUAGE_CODE ?? 'en-AU',
      },
    });
    assistantFn.fn.addToRolePolicy(dynamoPolicy);
    assistantFn.fn.addToRolePolicy(cognitoPolicy);
    assistantFn.fn.addToRolePolicy(bedrockInvokePolicy);
    assistantFn.fn.addToRolePolicy(transcribePolicy);
    fileBucket.grantReadWrite(assistantFn.fn);

    const assistantIntegration = new apigateway.LambdaIntegration(
      assistantFn.fn,
    );
    const assistantResource = api.root.addResource('assistant');
    assistantResource.addMethod('ANY', assistantIntegration, authOptions);
    assistantResource
      .addProxy({ anyMethod: false, defaultIntegration: assistantIntegration })
      .addMethod('ANY', assistantIntegration, authOptions);

    lambdaFunctions.push({ alarmKey: 'ApiAssistant', fn: assistantFn });

    // ── Contact API (mixed auth: POST public, GET admin-only) ─────────────────
    const contactFn = new BaselineFunction(this, 'ApiContact', {
      config,
      functionName: 'ApiContact',
      entry: 'baseblocks/contact/contact-api.ts',
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
      },
    });
    contactFn.fn.addToRolePolicy(dynamoPolicy);
    fileBucket.grantReadWrite(contactFn.fn);

    const contactIntegration = new apigateway.LambdaIntegration(contactFn.fn);
    const contactResource = api.root.addResource('contact');

    contactResource.addMethod('POST', contactIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    const contactListResource = contactResource.addResource('list');
    contactListResource.addMethod('GET', contactIntegration, authOptions);

    lambdaFunctions.push({ alarmKey: 'ApiContact', fn: contactFn });

    // ── Alarms ───────────────────────────────────────
    new BaselineAlarms(this, 'Alarms', {
      config,
      functions: lambdaFunctions.map(({ alarmKey, fn }) => ({
        alarmKey,
        fn: fn.fn,
      })),
      api,
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      exportName: `${appName}-${stage}-ApiUrl`,
    });
  }
}
