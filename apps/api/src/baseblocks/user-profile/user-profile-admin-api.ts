import type { UserProfile } from '@baseline/types/user-profile';
import { type Response, Router } from 'express';
import {
  createUser,
  getUserAttributesByEmail,
} from '../cognito/cognito.service';
import { permissionService } from '../permission/permission.service';
import { checkPermission } from '../../middleware/check-permission';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { userProfileService } from './user-profile.service';

export const adminUserProfileRouter = Router();

type PreferencesPatch = Record<string, unknown>;
type InvitePayload = {
  email?: string;
  grantSuper?: boolean;
  workspaceIds?: string[];
};
type UserSummary = {
  userId: string;
  displayName: string;
  preferences: Record<string, unknown>;
  permissionTypes: string[];
  permissions: Array<{ permissionId: string; type: string; value?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

async function mapUserSummary(
  userId: string,
  profile?: UserProfile,
  allPermissions?: Awaited<ReturnType<typeof permissionService.getAll>>,
): Promise<UserSummary> {
  const safeProfile =
    profile ?? (await userProfileService.get(userId).catch(() => undefined));
  const permissions = (
    allPermissions ?? (await permissionService.getAll())
  ).filter((item) => item.ownerId === userId);
  const permissionTypes = Array.from(new Set(permissions.map((p) => p.type)));

  return {
    userId,
    displayName: safeProfile?.displayName ?? '',
    preferences: safeProfile?.preferences ?? {},
    permissionTypes,
    permissions: permissions.map((p) => ({
      permissionId: p.permissionId,
      type: p.type,
      value: p.value,
    })),
    createdAt: safeProfile?.createdAt,
    updatedAt: safeProfile?.updatedAt,
  };
}

/** GET /user-profile/admin/list */
adminUserProfileRouter.get('/list', [
  checkPermission([{ type: 'SUPER' }]),
  async (_req: RequestContext, res: Response) => {
    try {
      const profiles = await userProfileService.getAll();
      const permissions = await permissionService.getAll();
      const profileByUserId = new Map(
        profiles.map((profile) => [profile.userId, profile]),
      );
      const ownerIds = new Set(
        permissions.map((permission) => permission.ownerId),
      );
      for (const profile of profiles) ownerIds.add(profile.userId);

      const mapped = await Promise.all(
        Array.from(ownerIds).map((ownerId) =>
          mapUserSummary(ownerId, profileByUserId.get(ownerId), permissions),
        ),
      );
      res.json(mapped);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to list user profiles: ${message}`);
      res.status(400).json({ error: 'Failed to list user profiles' });
    }
  },
]);

/** GET /user-profile/admin/:userId */
adminUserProfileRouter.get('/:userId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      const user = await mapUserSummary(userId);
      res.json(user);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get user details: ${message}`);
      res.status(400).json({ error: 'Failed to get user details' });
    }
  },
]);

/** POST /user-profile/admin/invite */
adminUserProfileRouter.post('/invite', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { email, grantSuper, workspaceIds } = req.body as InvitePayload;
      const formattedEmail = String(email ?? '')
        .trim()
        .toLowerCase();
      if (!formattedEmail) {
        res.status(400).json({ error: 'email is required' });
        return;
      }

      const attrs =
        (await getUserAttributesByEmail(formattedEmail)) ??
        (await createUser(formattedEmail));
      const userSub = attrs?.sub;

      if (!userSub) {
        res.status(400).json({ error: 'Unable to resolve invited user id' });
        return;
      }

      const existing = await userProfileService
        .get(userSub)
        .catch(() => undefined);
      if (!existing?.userId) {
        await userProfileService.create({
          userId: userSub,
          displayName: formattedEmail,
        } as Partial<UserProfile>);
      }

      const existingPermissions = await permissionService.getAll();
      const hasPermission = (type: string, value?: string) =>
        existingPermissions.some(
          (permission) =>
            permission.ownerId === userSub &&
            permission.type === type &&
            (permission.value ?? '') === (value ?? ''),
        );

      if (grantSuper && !hasPermission('SUPER')) {
        await permissionService.create({
          type: 'SUPER',
          ownerId: userSub,
          compositeKey: 'SUPER',
        });
      }

      for (const workspaceId of workspaceIds ?? []) {
        if (workspaceId && !hasPermission('WORKSPACE', workspaceId)) {
          await permissionService.create({
            type: 'WORKSPACE',
            ownerId: userSub,
            value: workspaceId,
            compositeKey: `WORKSPACE|${workspaceId}`,
          });
        }
      }

      const user = await mapUserSummary(userSub);
      res.json(user);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to invite user: ${message}`);
      res.status(400).json({ error: 'Failed to invite user' });
    }
  },
]);

/** PUT /user-profile/admin/preferences */
adminUserProfileRouter.put('/preferences', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { userId, preferences } = req.body as {
        userId?: string;
        preferences?: PreferencesPatch;
      };
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      let existing = await userProfileService.get(userId);
      if (!existing?.userId) {
        existing = await userProfileService.create({
          userId,
        } as Partial<UserProfile>);
      }

      const mergedPreferences = {
        ...(existing.preferences ?? {}),
        ...(preferences ?? {}),
      };

      const updated = await userProfileService.update({
        userId,
        preferences: mergedPreferences,
      } as Partial<UserProfile>);

      res.json({
        userId: updated.userId,
        displayName: updated.displayName ?? '',
        preferences: updated.preferences ?? {},
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update user preferences: ${message}`);
      res.status(400).json({ error: 'Failed to update user preferences' });
    }
  },
]);

/** DELETE /user-profile/admin/:userId */
adminUserProfileRouter.delete('/:userId', [
  checkPermission([{ type: 'SUPER' }]),
  async (req: RequestContext, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const permissions = await permissionService.getAll();
      const related = permissions.filter(
        (permission) => permission.ownerId === userId,
      );
      await Promise.all(
        related.map((permission) =>
          permissionService.delete(permission.permissionId),
        ),
      );

      await userProfileService.delete(userId).catch(() => false);
      res.json({ success: true });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete user: ${message}`);
      res.status(400).json({ error: 'Failed to delete user' });
    }
  },
]);
