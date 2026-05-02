import * as path from 'path';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';

export interface BaselineFunctionProps extends Omit<NodejsFunctionProps, 'entry' | 'handler' | 'runtime'> {
  config: StageConfig;
  functionName: string;
  handler?: string;
  entry: string;
  environment?: Record<string, string>;
}

export class BaselineFunction extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: BaselineFunctionProps) {
    super(scope, id);

    const { config, functionName, handler, entry, environment, ...rest } = props;

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: `${config.appName}-${config.stage}-${functionName}`,
      entry: path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'api', 'src', entry),
      handler: handler ?? 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.seconds(29),
      memorySize: 2048,
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        ...rest.bundling,
      },
      environment: {
        APP_NAME: config.appName,
        NODE_ENV: config.stage,
        NODE_OPTIONS: '--enable-source-maps',
        API_REGION: config.region,
        API_CORS_ORIGIN: config.corsOrigin,
        LOG_LEVEL: config.isProd ? 'warn' : 'debug',
        ...environment,
      },
      ...rest,
    });
  }
}
