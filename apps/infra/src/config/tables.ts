export interface TableDefinition {
  entityName: string;
  partitionKey: { name: string; type: 'S' | 'N' | 'B' };
  sortKey?: { name: string; type: 'S' | 'N' | 'B' };
  stream?: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY';
  gsis?: {
    indexName: string;
    partitionKey: { name: string; type: 'S' | 'N' | 'B' };
    sortKey?: { name: string; type: 'S' | 'N' | 'B' };
  }[];
}

export function getTableDefs(): TableDefinition[] {
  return [
    {
      entityName: 'admin',
      partitionKey: { name: 'userSub', type: 'S' },
    },
    {
      entityName: 'contact',
      partitionKey: { name: 'id', type: 'S' },
    },
    {
      entityName: 'permission',
      partitionKey: { name: 'permissionId', type: 'S' },
      gsis: [
        {
          indexName: 'ownerId-compositeKey-index',
          partitionKey: { name: 'ownerId', type: 'S' },
          sortKey: { name: 'compositeKey', type: 'S' },
        },
        {
          indexName: 'type-compositeKey-index',
          partitionKey: { name: 'type', type: 'S' },
          sortKey: { name: 'compositeKey', type: 'S' },
        },
      ],
    },
    {
      entityName: 'workspace',
      partitionKey: { name: 'workspaceId', type: 'S' },
      stream: 'NEW_AND_OLD_IMAGES',
    },
    {
      entityName: 'detection',
      partitionKey: { name: 'detectionId', type: 'S' },
      gsis: [
        {
          indexName: 'userId-index',
          partitionKey: { name: 'userId', type: 'S' },
        },
      ],
    },
    {
      entityName: 'user-profile',
      partitionKey: { name: 'userId', type: 'S' },
    },
  ];
}
