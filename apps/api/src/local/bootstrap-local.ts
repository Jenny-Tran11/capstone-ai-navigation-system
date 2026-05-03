import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  CreateUserPoolClientCommand,
  CreateUserPoolCommand,
  ListUserPoolClientsCommand,
  ListUserPoolsCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BatchWriteItemCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';

const ENDPOINT = 'http://localhost:4566';
const REGION = process.env.API_REGION ?? 'ap-southeast-2';
const APP_NAME = process.env.APP_NAME;
const STAGE = 'local';

if (!APP_NAME) throw new Error('APP_NAME environment variable is required');

const clientConfig = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
};

const dynamo = new DynamoDBClient(clientConfig);
const cognito = new CognitoIdentityProviderClient(clientConfig);

async function dropTableIfExists(tableName: string): Promise<void> {
  const { TableNames } = await dynamo.send(new ListTablesCommand({}));
  if (!TableNames?.includes(tableName)) return;
  await dynamo.send(new DeleteTableCommand({ TableName: tableName }));
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log(`  Dropped ${tableName}`);
}

async function createSimpleTable(
  tableName: string,
  partitionKey: string,
): Promise<void> {
  await dynamo.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: partitionKey, AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: partitionKey, KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );
  console.log(`  Created ${tableName}`);
}

async function createPermissionTable(tableName: string): Promise<void> {
  await dynamo.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: 'permissionId', AttributeType: 'S' },
        { AttributeName: 'ownerId', AttributeType: 'S' },
        { AttributeName: 'compositeKey', AttributeType: 'S' },
        { AttributeName: 'type', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'permissionId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ownerId-compositeKey-index',
          KeySchema: [
            { AttributeName: 'ownerId', KeyType: 'HASH' },
            { AttributeName: 'compositeKey', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'type-compositeKey-index',
          KeySchema: [
            { AttributeName: 'type', KeyType: 'HASH' },
            { AttributeName: 'compositeKey', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    }),
  );
  console.log(`  Created ${tableName} with GSIs`);
}

async function seedSuperPermission(
  tableName: string,
  ownerSub: string,
): Promise<void> {
  const now = new Date().toISOString();
  await dynamo.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: [
          {
            PutRequest: {
              Item: {
                permissionId: { S: `prm_local_super_${ownerSub.slice(0, 8)}` },
                type: { S: 'SUPER' },
                compositeKey: { S: 'SUPER' },
                ownerId: { S: ownerSub },
                createdAt: { S: now },
                updatedAt: { S: now },
              },
            },
          },
        ],
      },
    }),
  );
  console.log(`  Seeded SUPER permission for ${ownerSub}`);
}

async function seedAdminTable(
  tableName: string,
  users: Array<{ userSub: string; userEmail: string }>,
): Promise<void> {
  if (users.length === 0) {
    console.warn('  No users to seed — skipping admin table seed');
    return;
  }
  await dynamo.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: users.map((item) => ({
          PutRequest: {
            Item: {
              userSub: { S: item.userSub },
              userEmail: { S: item.userEmail },
            },
          },
        })),
      },
    }),
  );
  console.log(`  Seeded ${tableName} with ${users.length} admin(s)`);
}

async function getOrCreateUserPool(poolName: string): Promise<string> {
  const { UserPools } = await cognito.send(
    new ListUserPoolsCommand({ MaxResults: 60 }),
  );
  const found = UserPools?.find((p) => p.Name === poolName);
  if (found?.Id) {
    console.log(`  User pool already exists: ${found.Id}`);
    return found.Id;
  }
  const { UserPool } = await cognito.send(
    new CreateUserPoolCommand({
      PoolName: poolName,
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    }),
  );
  console.log(`  Created user pool: ${UserPool?.Id}`);
  const id = UserPool?.Id;
  if (!id) {
    throw new Error('CreateUserPool succeeded but returned no pool Id');
  }
  return id;
}

async function getOrCreateUserPoolClient(
  poolId: string,
  clientName: string,
): Promise<string> {
  const { UserPoolClients } = await cognito.send(
    new ListUserPoolClientsCommand({ UserPoolId: poolId, MaxResults: 60 }),
  );
  const found = UserPoolClients?.find((c) => c.ClientName === clientName);
  if (found?.ClientId) {
    console.log(`  User pool client already exists: ${found.ClientId}`);
    return found.ClientId;
  }
  const { UserPoolClient } = await cognito.send(
    new CreateUserPoolClientCommand({
      UserPoolId: poolId,
      ClientName: clientName,
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH',
      ],
    }),
  );
  console.log(`  Created user pool client: ${UserPoolClient?.ClientId}`);
  const clientId = UserPoolClient?.ClientId;
  if (!clientId) {
    throw new Error('CreateUserPoolClient succeeded but returned no ClientId');
  }
  return clientId;
}

async function cleanCognitoUsers(poolId: string): Promise<void> {
  let paginationToken: string | undefined;
  let deleted = 0;
  do {
    const { Users, PaginationToken } = await cognito.send(
      new ListUsersCommand({
        UserPoolId: poolId,
        PaginationToken: paginationToken,
      }),
    );
    for (const user of Users ?? []) {
      if (!user.Username) continue;
      await cognito.send(
        new AdminDeleteUserCommand({
          UserPoolId: poolId,
          Username: user.Username,
        }),
      );
      deleted++;
    }
    paginationToken = PaginationToken;
  } while (paginationToken);
  console.log(`  Deleted ${deleted} existing Cognito user(s)`);
}

async function getOrCreateCognitoUser(
  poolId: string,
  email: string,
  password: string,
): Promise<string> {
  // Create user, ignoring already-exists errors
  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      }),
    );
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: poolId,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? '';
    if (!name.includes('UsernameExists')) {
      console.warn(
        `  Warning: could not create ${email}: ${(err as Error).message}`,
      );
    }
  }

  // Always fetch the real sub via AdminGetUser — don't rely on create response
  try {
    const { UserAttributes } = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: poolId,
        Username: email,
      }),
    );
    const sub = UserAttributes?.find((a) => a.Name === 'sub')?.Value ?? '';
    console.log(`  ${email} → sub: ${sub}`);
    return sub;
  } catch (err: unknown) {
    console.warn(
      `  Warning: could not get sub for ${email}: ${(err as Error).message}`,
    );
    return '';
  }
}

async function bootstrap(): Promise<void> {
  const adminTable = `${APP_NAME}-${STAGE}-admin`;
  const contactTable = `${APP_NAME}-${STAGE}-contact`;
  const permissionTable = `${APP_NAME}-${STAGE}-permission`;
  const workspaceTable = `${APP_NAME}-${STAGE}-workspace`;
  const poolName = `${APP_NAME}-${STAGE}-user-pool`;
  const clientName = `${APP_NAME}-${STAGE}-client`;

  console.log('Dropping existing DynamoDB tables...');
  await dropTableIfExists(adminTable);
  await dropTableIfExists(contactTable);
  await dropTableIfExists(permissionTable);
  await dropTableIfExists(workspaceTable);

  console.log('Creating DynamoDB tables...');
  await createSimpleTable(adminTable, 'userSub');
  await createSimpleTable(contactTable, 'id');
  await createPermissionTable(permissionTable);
  await createSimpleTable(workspaceTable, 'workspaceId');

  console.log('Setting up Cognito user pool...');
  const poolId = await getOrCreateUserPool(poolName);
  const clientId = await getOrCreateUserPoolClient(poolId, clientName);

  console.log('Cleaning existing Cognito users...');
  await cleanCognitoUsers(poolId);

  console.log('Seeding Cognito users...');
  const primarySub = await getOrCreateCognitoUser(
    poolId,
    'example@devika.com',
    'Password123',
  );
  const sub1 = await getOrCreateCognitoUser(
    poolId,
    'example+1@devika.com',
    'Password123',
  );
  const sub2 = await getOrCreateCognitoUser(
    poolId,
    'example+2@devika.com',
    'Password123',
  );

  const adminUsers = [
    { userSub: primarySub, userEmail: 'example@devika.com' },
    { userSub: sub1, userEmail: 'example+1@devika.com' },
    { userSub: sub2, userEmail: 'example+2@devika.com' },
  ].filter((u) => !!u.userSub);

  console.log('Seeding admin table...');
  await seedAdminTable(adminTable, adminUsers);

  console.log('Seeding SUPER permission...');
  if (primarySub) await seedSuperPermission(permissionTable, primarySub);

  // Write .cognito/local-config.json at repo root (four levels up from src/local/)
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const configDir = path.join(repoRoot, '.cognito');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'local-config.json'),
    JSON.stringify(
      {
        userPoolId: poolId,
        userPoolClientId: clientId,
        bucketName: `${APP_NAME}-local-files`,
      },
      null,
      2,
    ),
  );

  // Write apps/api/.env.local for sourcing in run-api-local.sh
  const envLocal = [
    `export COGNITO_USER_POOL_ID=${poolId}`,
    `export COGNITO_CLIENT_ID=${clientId}`,
    `export PRIMARY_USER_SUB=${primarySub}`,
    `export PRIMARY_USER_EMAIL=example@devika.com`,
    '',
  ].join('\n');
  fs.writeFileSync(path.resolve(__dirname, '..', '..', '.env.local'), envLocal);

  console.log('\nBootstrap complete.');
  console.log('  Sign in: example@devika.com / Password123');
  console.log('  .cognito/local-config.json written');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
