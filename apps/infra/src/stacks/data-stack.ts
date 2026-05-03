import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';
import type { StageConfig } from '../config/stage-config';
import { getTableDefs } from '../config/tables';
import { BaselineTable } from '../constructs/baseline-table';

export interface DataStackProps extends StackProps {
  config: StageConfig;
}

export class DataStack extends Stack {
  public readonly tables: Map<string, dynamodb.Table> = new Map();

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { config } = props;
    const tableDefs = getTableDefs();

    for (const tableDef of tableDefs) {
      const constructId = `${tableDef.entityName.charAt(0).toUpperCase()}${tableDef.entityName.slice(1)}Table`;
      const baselineTable = new BaselineTable(this, constructId, {
        config,
        tableDef,
      });

      this.tables.set(tableDef.entityName, baselineTable.table);

      new CfnOutput(this, `${constructId}Name`, {
        value: baselineTable.table.tableName,
        exportName: `${config.appName}-${config.stage}-${constructId}Name`,
      });
    }
  }
}
