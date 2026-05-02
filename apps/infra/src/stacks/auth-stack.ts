import { Stack, type StackProps } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { BaselineCognito } from '../constructs/baseline-cognito';
import type { StageConfig } from '../config/stage-config';

export interface AuthStackProps extends StackProps {
  config: StageConfig;
}

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const auth = new BaselineCognito(this, 'Cognito', {
      config: props.config,
    });

    this.userPool = auth.userPool;
    this.userPoolClient = auth.userPoolClient;
    this.identityPool = auth.identityPool;
  }
}
