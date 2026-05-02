import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import type { TableDefinition } from '../config/tables';
import type { StageConfig } from '../config/stage-config';

export interface BaselineTableProps {
  config: StageConfig;
  tableDef: TableDefinition;
}

const ATTRIBUTE_TYPE_MAP: Record<string, dynamodb.AttributeType> = {
  S: dynamodb.AttributeType.STRING,
  N: dynamodb.AttributeType.NUMBER,
  B: dynamodb.AttributeType.BINARY,
};

export class BaselineTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BaselineTableProps) {
    super(scope, id);

    const { config, tableDef } = props;
    const tableName = `${config.appName}-${config.stage}-${tableDef.entityName}`;

    this.table = new dynamodb.Table(this, 'Table', {
      tableName,
      partitionKey: {
        name: tableDef.partitionKey.name,
        type: ATTRIBUTE_TYPE_MAP[tableDef.partitionKey.type],
      },
      ...(tableDef.sortKey && {
        sortKey: {
          name: tableDef.sortKey.name,
          type: ATTRIBUTE_TYPE_MAP[tableDef.sortKey.type],
        },
      }),
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.pitrEnabled,
      removalPolicy: config.removalPolicy,
      stream: tableDef.stream
        ? (dynamodb.StreamViewType[tableDef.stream.replace(/-/g, '_') as keyof typeof dynamodb.StreamViewType] ?? undefined)
        : undefined,
    });

    for (const gsi of tableDef.gsis ?? []) {
      this.table.addGlobalSecondaryIndex({
        indexName: gsi.indexName,
        partitionKey: {
          name: gsi.partitionKey.name,
          type: ATTRIBUTE_TYPE_MAP[gsi.partitionKey.type],
        },
        ...(gsi.sortKey && {
          sortKey: {
            name: gsi.sortKey.name,
            type: ATTRIBUTE_TYPE_MAP[gsi.sortKey.type],
          },
        }),
      });
    }
  }
}
