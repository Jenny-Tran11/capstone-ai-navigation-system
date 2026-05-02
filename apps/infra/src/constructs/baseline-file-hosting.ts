import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';

export interface BaselineFileHostingProps {
  config: StageConfig;
}

export class BaselineFileHosting extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: BaselineFileHostingProps) {
    super(scope, id);

    const { config } = props;
    const { appName, stage, isProd, removalPolicy } = config;

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${appName}-${stage}-files`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy,
      autoDeleteObjects: !isProd,
      versioned: isProd,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: [config.corsOrigin],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: `${appName}-${stage}-files OAC`,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
      },
      httpVersion: cloudfront.HttpVersion.HTTP2,
    });

    new CfnOutput(this, 'FileBucketName', {
      value: this.bucket.bucketName,
      exportName: `${appName}-${stage}-FileBucketName`,
    });
    new CfnOutput(this, 'FileDistributionUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      exportName: `${appName}-${stage}-FileDistributionUrl`,
    });
  }
}
