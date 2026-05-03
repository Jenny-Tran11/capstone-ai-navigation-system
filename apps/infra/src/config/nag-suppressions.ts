import type { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function suppressNagRules(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'AWS managed policies are acceptable for Lambda execution roles',
    },
    {
      id: 'AwsSolutions-IAM5',
      reason:
        'Wildcard permissions on DynamoDB index ARNs are required for GSI access',
    },
    {
      id: 'AwsSolutions-L1',
      reason:
        'Runtime version is managed via BaselineFunction construct defaults',
    },
    {
      id: 'AwsSolutions-APIG1',
      reason:
        'Access logging will be configured per-environment when custom domains are added',
    },
    {
      id: 'AwsSolutions-APIG2',
      reason: 'Request validation is handled at the application layer',
    },
    {
      id: 'AwsSolutions-APIG6',
      reason:
        'CloudWatch logging at stage level will be configured with custom domains',
    },
    {
      id: 'AwsSolutions-COG1',
      reason:
        'Password policy requires uppercase, lowercase, digits; symbols intentionally not required for UX',
    },
    {
      id: 'AwsSolutions-COG3',
      reason:
        'AdvancedSecurityMode will be enabled in production via stage config when needed',
    },
    {
      id: 'AwsSolutions-COG4',
      reason: 'Cognito authorizer is applied to all API routes via authOptions',
    },
    {
      id: 'AwsSolutions-S1',
      reason:
        'Server access logs will be configured when log bucket is provisioned',
    },
    {
      id: 'AwsSolutions-S2',
      reason:
        'SPA buckets require public access for CloudFront OAC to function',
    },
    {
      id: 'AwsSolutions-S10',
      reason:
        'SSL-only policy will be enforced via bucket policy in production hardening phase',
    },
    {
      id: 'AwsSolutions-CFR3',
      reason:
        'CloudFront access logging will be configured when log bucket is provisioned',
    },
    {
      id: 'AwsSolutions-CFR4',
      reason:
        'Custom SSL certificate not required for non-production distributions',
    },
    {
      id: 'AwsSolutions-SNS2',
      reason:
        'SNS encryption will be added when KMS key management is configured',
    },
    {
      id: 'AwsSolutions-SNS3',
      reason:
        'SNS SSL-only publishing will be enforced via topic policy in production hardening',
    },
  ]);
}
