import type { UserProfile } from '@baseline/types/user-profile';
import { type Response, Router } from 'express';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { userProfileService } from './user-profile.service';
import { userPreferencesRouter } from './user-profile-user-preferences-api';

export const userProfileUserRouter = Router();

const profileMapper = (data: UserProfile): UserProfile => ({
  userId: data?.userId,
  displayName: data?.displayName,
  avatarKey: data?.avatarKey,
  createdAt: data?.createdAt,
  updatedAt: data?.updatedAt,
});

/** GET /user-profile/user/me */
userProfileUserRouter.get('/me', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      let profile = await userProfileService.get(userId);
      if (!profile?.userId) {
        profile = await userProfileService.create({
          userId,
        } as Partial<UserProfile>);
      }
      res.json(profileMapper(profile));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get user profile: ${message}`);
      res.status(400).json({ error: 'Failed to get user profile' });
    }
  },
]);

/** PUT /user-profile/user/me */
userProfileUserRouter.put('/me', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      const { displayName, avatarKey } = req.body as Partial<
        Pick<UserProfile, 'displayName' | 'avatarKey'>
      >;
      const updated = await userProfileService.update({
        userId,
        displayName,
        avatarKey,
      } as Partial<UserProfile>);
      res.json(profileMapper(updated));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update user profile: ${message}`);
      res.status(400).json({ error: 'Failed to update user profile' });
    }
  },
]);

userProfileUserRouter.use('/preferences', userPreferencesRouter);
