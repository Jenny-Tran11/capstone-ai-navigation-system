import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';

export interface BaselineCognitoProps {
  config: StageConfig;
}

export class BaselineCognito extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props: BaselineCognitoProps) {
    super(scope, id);

    const { config } = props;
    const { appName, stage, removalPolicy } = config;

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${appName}-${stage}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      signInCaseSensitive: false,
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        userId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${appName}-${stage}-user-pool-client`,
      userPool: this.userPool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(365),
    });

    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${appName}-${stage}-identity-pool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    const authenticatedRole = new iam.Role(this, 'CognitoAuthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: this.identityPool.ref,
      roles: { authenticated: authenticatedRole.roleArn },
    });

    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: `${appName}-${stage}-UserPoolId`,
    });
    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: `${appName}-${stage}-UserPoolClientId`,
    });
    new CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      exportName: `${appName}-${stage}-IdentityPoolId`,
    });
  }
}
