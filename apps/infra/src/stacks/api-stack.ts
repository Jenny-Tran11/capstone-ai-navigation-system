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

    // ── API entities ─────────────────────────────────
    const apiEntities: ApiEntity[] = [
      {
        name: 'ApiAdmin',
        path: 'admin',
        entry: 'baseblocks/admin/admin-api.ts',
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

    const lambdaFunctions: BaselineFunction[] = [];

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

      lambdaFunctions.push(fn);
    }

    // ── Transit API (Gemini-powered bus OCR, authenticated) ───────────────────
    const transitFn = new BaselineFunction(this, 'ApiTransit', {
      config,
      functionName: 'ApiTransit',
      entry: 'baseblocks/transit/transit-api.ts',
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ?? '',
      },
    });
    transitFn.fn.addToRolePolicy(cognitoPolicy);

    const transitIntegration = new apigateway.LambdaIntegration(transitFn.fn);
    const transitResource = api.root.addResource('transit');
    transitResource.addMethod('ANY', transitIntegration, authOptions);
    transitResource
      .addProxy({ anyMethod: false, defaultIntegration: transitIntegration })
      .addMethod('ANY', transitIntegration, authOptions);

    lambdaFunctions.push(transitFn);

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

    lambdaFunctions.push(contactFn);

    // ── Alarms ───────────────────────────────────────
    new BaselineAlarms(this, 'Alarms', {
      config,
      functions: lambdaFunctions.map((w) => w.fn),
      api,
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      exportName: `${appName}-${stage}-ApiUrl`,
    });
  }
}
