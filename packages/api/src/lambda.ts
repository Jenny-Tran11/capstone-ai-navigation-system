import type { LambdaContext, LambdaEvent } from "hono/aws-lambda";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";

import { getUser, putUser, type UserProfile } from "./lib/dynamo";

type LambdaBindings = {
  event: LambdaEvent;
  requestContext: unknown;
  lambdaContext: LambdaContext;
};

const app = new Hono<{ Bindings: LambdaBindings }>();

function jwtClaims(event: LambdaEvent): Record<string, string> | undefined {
  if (!("requestContext" in event) || !event.requestContext) {
    return undefined;
  }
  const rc = event.requestContext as {
    authorizer?: { jwt?: { claims?: Record<string, string> } };
  };
  return rc.authorizer?.jwt?.claims;
}

function getSub(c: { env: LambdaBindings }): string | undefined {
  return jwtClaims(c.env.event)?.sub;
}

function getEmailFromJwt(c: { env: LambdaBindings }): string | undefined {
  return jwtClaims(c.env.event)?.email;
}

app.get("/me", async (c) => {
  const sub = getSub(c);
  if (!sub) {
    return c.json({ error: "Unauthorized: missing subject claim" }, 401);
  }

  const existing = await getUser(sub);
  if (!existing) {
    return c.json({
      userId: sub,
      email: getEmailFromJwt(c),
      displayName: null,
      createdAt: null,
      updatedAt: null,
      profileExists: false,
    });
  }

  return c.json({
    userId: existing.userId,
    email: existing.email ?? getEmailFromJwt(c),
    displayName: existing.displayName ?? null,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
    profileExists: true,
  });
});

app.put("/me", async (c) => {
  const sub = getSub(c);
  if (!sub) {
    return c.json({ error: "Unauthorized: missing subject claim" }, 401);
  }

  let body: { displayName?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : undefined;
  if (displayName !== undefined && displayName.length > 200) {
    return c.json({ error: "displayName too long (max 200)" }, 400);
  }

  const now = new Date().toISOString();
  const existing = await getUser(sub);

  const profile: UserProfile = {
    userId: sub,
    email: existing?.email ?? getEmailFromJwt(c),
    displayName:
      displayName !== undefined ? displayName : existing?.displayName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await putUser(profile);
  return c.json({
    userId: profile.userId,
    email: profile.email ?? null,
    displayName: profile.displayName ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
});

export const handler = handle(app);
