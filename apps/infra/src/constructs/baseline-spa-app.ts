import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';

export interface BaselineSpaAppProps {
  config: StageConfig;
  name: string;
  sourceDir?: string;
}

export class BaselineSpaApp extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: BaselineSpaAppProps) {
    super(scope, id);

    const { config, name, sourceDir } = props;
    const { appName, stage, isProd } = config;
    const lower = name.toLowerCase();

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${appName}-${stage}-${lower}`,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
    });

    const noCachePolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'NoCachePolicy',
      {
        responseHeadersPolicyName: `${appName}-${stage}-${lower}-no-cache`,
        customHeadersBehavior: {
          customHeaders: [
            { header: 'Cache-Control', value: 'no-cache', override: true },
          ],
        },
      },
    );

    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: `${appName}-${stage}-${lower} OAC`,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: noCachePolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
      },
      defaultRootObject: 'index.html',
      httpVersion: cloudfront.HttpVersion.HTTP2,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    if (sourceDir) {
      new s3deploy.BucketDeployment(this, 'Deploy', {
        sources: [s3deploy.Source.asset(sourceDir)],
        destinationBucket: this.bucket,
        distribution: this.distribution,
        distributionPaths: ['/*'],
        prune: true,
      });
    }

    new CfnOutput(this, `${name}Url`, {
      value: `https://${this.distribution.distributionDomainName}`,
      exportName: `${appName}-${stage}-${name}Url`,
    });
    new CfnOutput(this, `${name}DistributionId`, {
      value: this.distribution.distributionId,
      exportName: `${appName}-${stage}-${name}DistributionId`,
    });
    new CfnOutput(this, `${name}BucketName`, {
      value: this.bucket.bucketName,
      exportName: `${appName}-${stage}-${name}BucketName`,
    });
  }
}
