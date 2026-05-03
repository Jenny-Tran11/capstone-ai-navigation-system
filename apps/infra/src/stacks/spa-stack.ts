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

    const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const adminSourceDir = path.join(repoRoot, 'apps', 'admin', '.dist');
    const webSourceDir = path.join(repoRoot, 'apps', 'web', '.dist');

    new BaselineSpaApp(this, 'AdminSpa', {
      config,
      name: 'Admin',
      sourceDir: fs.existsSync(adminSourceDir) ? adminSourceDir : undefined,
    });

    new BaselineSpaApp(this, 'WebSpa', {
      config,
      name: 'Web',
      sourceDir: fs.existsSync(webSourceDir) ? webSourceDir : undefined,
    });
  }
}
