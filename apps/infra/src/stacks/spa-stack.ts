import * as fs from 'node:fs';
import * as path from 'node:path';
import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';
import { BaselineSpaApp } from '../constructs/baseline-spa-app';

export interface SpaStackProps extends StackProps {
  config: StageConfig;
}

export class SpaStack extends Stack {
  constructor(scope: Construct, id: string, props: SpaStackProps) {
    super(scope, id, props);

    const { config } = props;

    new BaselineSpaApp(this, 'AdminSpa', {
      config,
      name: 'Admin',
    });

    const webSourceDir = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'apps',
      'web',
      '.dist',
    );

    new BaselineSpaApp(this, 'WebSpa', {
      config,
      name: 'Web',
      sourceDir: fs.existsSync(webSourceDir) ? webSourceDir : undefined,
    });
  }
}
