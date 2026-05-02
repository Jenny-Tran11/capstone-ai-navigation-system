import * as fs from 'fs';
import * as path from 'path';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaselineSpaApp } from '../constructs/baseline-spa-app';
import type { StageConfig } from '../config/stage-config';

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

    const webSourceDir = path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'web', '.dist');

    new BaselineSpaApp(this, 'WebSpa', {
      config,
      name: 'Web',
      sourceDir: fs.existsSync(webSourceDir) ? webSourceDir : undefined,
    });
  }
}
