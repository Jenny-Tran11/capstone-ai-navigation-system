import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ListUserPoolsCommand,
  ListUserPoolClientsCommand,
} from '@aws-sdk/client-cognito-identity-provider';

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

async function createTableIfNotExists(tableName: string, partitionKey: string): Promise<void> {
  const { TableNames } = await dynamo.send(new ListTablesCommand({}));
  if (TableNames?.includes(tableName)) {
    console.log(`  ${tableName} already exists`);
    return;
  }
  await dynamo.send(new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: partitionKey, AttributeType: 'S' }],
    KeySchema: [{ AttributeName: partitionKey, KeyType: 'HASH' }],
    BillingMode: 'PAY_PER_REQUEST',
  }));
  console.log(`  Created ${tableName}`);
}

async function seedAdminTable(tableName: string): Promise<void> {
  const items = [
    { userSub: 'ed805890-d66b-4126-a5d9-0b22e70fce80', userEmail: 'example@devika.com' },
    { userSub: 'ed805890-d66b-4126-a5d9-0b22e70fce81', userEmail: 'example+1@devika.com' },
    { userSub: 'ed805890-d66b-4126-a5d9-0b22e70fce82', userEmail: 'example+2@devika.com' },
  ];
  await dynamo.send(new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: items.map((item) => ({
        PutRequest: {
          Item: {
            userSub: { S: item.userSub },
            userEmail: { S: item.userEmail },
          },
        },
      })),
    },
  }));
  console.log(`  Seeded ${tableName}`);
}

async function getOrCreateUserPool(poolName: string): Promise<string> {
  const { UserPools } = await cognito.send(new ListUserPoolsCommand({ MaxResults: 60 }));
  const found = UserPools?.find((p) => p.Name === poolName);
  if (found?.Id) {
    console.log(`  User pool already exists: ${found.Id}`);
    return found.Id;
  }
  const { UserPool } = await cognito.send(new CreateUserPoolCommand({
    PoolName: poolName,
    UsernameAttributes: ['email'],
    AutoVerifiedAttributes: ['email'],
  }));
  console.log(`  Created user pool: ${UserPool!.Id}`);
  return UserPool!.Id!;
}

async function getOrCreateUserPoolClient(poolId: string, clientName: string): Promise<string> {
  const { UserPoolClients } = await cognito.send(
    new ListUserPoolClientsCommand({ UserPoolId: poolId, MaxResults: 60 }),
  );
  const found = UserPoolClients?.find((c) => c.ClientName === clientName);
  if (found?.ClientId) {
    console.log(`  User pool client already exists: ${found.ClientId}`);
    return found.ClientId;
  }
  const { UserPoolClient } = await cognito.send(new CreateUserPoolClientCommand({
    UserPoolId: poolId,
    ClientName: clientName,
    GenerateSecret: false,
    ExplicitAuthFlows: [
      'ALLOW_USER_PASSWORD_AUTH',
      'ALLOW_REFRESH_TOKEN_AUTH',
      'ALLOW_USER_SRP_AUTH',
    ],
  }));
  console.log(`  Created user pool client: ${UserPoolClient!.ClientId}`);
  return UserPoolClient!.ClientId!;
}

async function seedCognitoUser(poolId: string, email: string, password: string): Promise<void> {
  try {
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: poolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
    }));
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: email,
      Password: password,
      Permanent: true,
    }));
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? '';
    if (!name.includes('UsernameExists')) {
      console.warn(`  Warning: could not create ${email}: ${(err as Error).message}`);
    }
  }
}

async function bootstrap(): Promise<void> {
  const adminTable      = `${APP_NAME}-${STAGE}-admin`;
  const contactTable    = `${APP_NAME}-${STAGE}-contact`;
  const permissionTable = `${APP_NAME}-${STAGE}-permission`;
  const workspaceTable  = `${APP_NAME}-${STAGE}-workspace`;
  const poolName        = `${APP_NAME}-${STAGE}-user-pool`;
  const clientName      = `${APP_NAME}-${STAGE}-client`;

  console.log('Creating DynamoDB tables...');
  await createTableIfNotExists(adminTable,      'userSub');
  await createTableIfNotExists(contactTable,    'id');
  await createTableIfNotExists(permissionTable, 'permissionId');
  await createTableIfNotExists(workspaceTable,  'workspaceId');

  console.log('Seeding admin table...');
  await seedAdminTable(adminTable);

  console.log('Setting up Cognito user pool...');
  const poolId   = await getOrCreateUserPool(poolName);
  const clientId = await getOrCreateUserPoolClient(poolId, clientName);

  console.log('Seeding Cognito users...');
  await seedCognitoUser(poolId, 'example@devika.com',   'Password123');
  await seedCognitoUser(poolId, 'example+1@devika.com', 'Password123');
  await seedCognitoUser(poolId, 'example+2@devika.com', 'Password123');

  // Write .cognito/local-config.json at repo root (four levels up from src/local/)
  const repoRoot  = path.resolve(__dirname, '..', '..', '..', '..');
  const configDir = path.join(repoRoot, '.cognito');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'local-config.json'),
    JSON.stringify(
      { userPoolId: poolId, userPoolClientId: clientId, bucketName: `${APP_NAME}-local-files` },
      null,
      2,
    ),
  );

  // Write apps/api/.env.local for sourcing in run-api-local.sh
  const envLocal = [
    `export COGNITO_USER_POOL_ID=${poolId}`,
    `export COGNITO_CLIENT_ID=${clientId}`,
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
