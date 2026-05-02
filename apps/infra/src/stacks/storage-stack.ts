import { Stack, type StackProps } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaselineFileHosting } from '../constructs/baseline-file-hosting';
import type { StageConfig } from '../config/stage-config';

export interface StorageStackProps extends StackProps {
  config: StageConfig;
}

export class StorageStack extends Stack {
  public readonly fileBucket: s3.Bucket;
  public readonly fileDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const hosting = new BaselineFileHosting(this, 'FileHosting', {
      config: props.config,
    });

    this.fileBucket = hosting.bucket;
    this.fileDistribution = hosting.distribution;
  }
}
