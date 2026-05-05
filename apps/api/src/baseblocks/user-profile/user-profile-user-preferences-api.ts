import type { UserProfile } from '@baseline/types/user-profile';
import { type Response, Router } from 'express';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { userProfileService } from './user-profile.service';

type PreferredLocation = {
  tag: 'home' | 'work' | 'other';
  label: string;
  address: string;
  lat: number;
  lng: number;
};

function toPreferredLocation(value: unknown): PreferredLocation | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const tag = input.tag;
  const label = input.label;
  const address = input.address;
  const lat = input.lat;
  const lng = input.lng;

  if (tag !== 'home' && tag !== 'work' && tag !== 'other') return null;
  if (typeof label !== 'string' || !label.trim()) return null;
  if (typeof address !== 'string' || !address.trim()) return null;
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null;

  return { tag, label: label.trim(), address: address.trim(), lat, lng };
}

function normalizePreferredLocations(value: unknown): PreferredLocation[] {
  if (!Array.isArray(value)) return [];
  const parsed = value
    .map(toPreferredLocation)
    .filter(Boolean) as PreferredLocation[];
  const dedupedByTag = new Map<PreferredLocation['tag'], PreferredLocation>();
  for (const item of parsed) dedupedByTag.set(item.tag, item);
  return Array.from(dedupedByTag.values()).slice(0, 3);
}

export const userPreferencesRouter = Router();

/** GET /user-profile/user/preferences */
userPreferencesRouter.get('/', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      let profile = await userProfileService.get(userId);
      if (!profile?.userId) {
        profile = await userProfileService.create({
          userId,
        } as Partial<UserProfile>);
      }
      res.json(profile.preferences ?? {});
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get preferences: ${message}`);
      res.status(400).json({ error: 'Failed to get preferences' });
    }
  },
]);

/** PUT /user-profile/user/preferences */
userPreferencesRouter.put('/', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.currentUserSub;
      let existing = await userProfileService.get(userId);
      if (!existing?.userId) {
        existing = await userProfileService.create({
          userId,
        } as Partial<UserProfile>);
      }
      const incoming = req.body as Record<string, unknown>;
      const merged = { ...(existing.preferences ?? {}), ...incoming };
      if ('preferredLocations' in incoming) {
        merged.preferredLocations = normalizePreferredLocations(
          incoming.preferredLocations,
        );
      }
      await userProfileService.update({
        userId,
        preferences: merged,
      } as Partial<UserProfile>);
      res.json(merged);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update preferences: ${message}`);
      res.status(400).json({ error: 'Failed to update preferences' });
    }
  },
]);
