# @capstone/api

TypeScript Lambda handler for the **user profile API** (Baseline-style: small HTTP API + DynamoDB), deployed via CDK in [`apps/aws`](../../apps/aws).

## Routes

- `GET /me` — profile for the Cognito user (`sub` from JWT). Returns `profileExists: false` until first `PUT`.
- `PUT /me` — JSON `{ "displayName": "..." }` (optional); creates/updates the DynamoDB row.

## Environment

| Variable       | Description        |
| -------------- | ------------------ |
| `USERS_TABLE`  | DynamoDB table name |

JWT validation is done by **API Gateway HTTP API JWT authorizer**; the Lambda reads `sub` / `email` from `requestContext.authorizer.jwt.claims`.

## Local

```bash
npm run lint -w @capstone/api
```

Local invocation is easiest after deploy (real JWT), or use a mocked API Gateway v2 event in a small script.
