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
  const latRaw = input.lat;
  const lngRaw = input.lng;
  const lat =
    typeof latRaw === 'number'
      ? latRaw
      : typeof latRaw === 'string'
        ? Number(latRaw)
        : NaN;
  const lng =
    typeof lngRaw === 'number'
      ? lngRaw
      : typeof lngRaw === 'string'
        ? Number(lngRaw)
        : NaN;

  if (tag !== 'home' && tag !== 'work' && tag !== 'other') return null;
  if (typeof label !== 'string' || !label.trim()) return null;
  if (typeof address !== 'string' || !address.trim()) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

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

type SavedPlace = { label: string; address: string; lat: number; lng: number };

function toSavedPlace(value: unknown): SavedPlace | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const label = input.label;
  const address = input.address;
  const lat =
    typeof input.lat === 'number'
      ? input.lat
      : typeof input.lat === 'string'
        ? Number(input.lat)
        : NaN;
  const lng =
    typeof input.lng === 'number'
      ? input.lng
      : typeof input.lng === 'string'
        ? Number(input.lng)
        : NaN;
  if (typeof label !== 'string' || !label.trim()) return null;
  if (typeof address !== 'string' || !address.trim()) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: label.trim(), address: address.trim(), lat, lng };
}

function normalizeSavedPlaces(value: unknown): SavedPlace[] {
  if (!Array.isArray(value)) return [];
  return value.map(toSavedPlace).filter(Boolean).slice(0, 10) as SavedPlace[];
}

export const userPreferencesRouter = Router();

function requireUserId(req: RequestContext, res: Response): string | null {
  const userId = req.currentUserSub?.trim();
  if (!userId || userId === 'undefined') {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return userId;
}

/** GET /user-profile/user/preferences */
userPreferencesRouter.get('/', [
  async (req: RequestContext, res: Response) => {
    try {
      const userId = requireUserId(req, res);
      if (!userId) return;
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
      const userId = requireUserId(req, res);
      if (!userId) return;
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
      if ('savedPlaces' in incoming) {
        merged.savedPlaces = normalizeSavedPlaces(incoming.savedPlaces);
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
