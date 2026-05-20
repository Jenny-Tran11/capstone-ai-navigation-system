import { type Response, Router } from 'express';
import { getErrorMessage } from '../../util/error-message';
import type { RequestContext } from '../../util/request-context.type';
import { getMobileRuntimeConfig } from '../app-config/app-config';

const MAX_INPUT_LEN = 200;
const MAX_ADDRESS_LEN = 500;

export const userPlacesRouter = Router();

function requireUserId(req: RequestContext, res: Response): string | null {
  const userId = req.currentUserSub?.trim();
  if (!userId || userId === 'undefined') {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return userId;
}

/** GET /user-profile/user/places/autocomplete?input=… — Australia street addresses only (server-side key). */
userPlacesRouter.get('/autocomplete', [
  async (req: RequestContext, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const raw = req.query.input;
    const input = typeof raw === 'string' ? raw.trim() : '';
    if (!input) {
      res.status(400).json({ error: 'Missing input' });
      return;
    }

    const { googleMapsApiKey } = await getMobileRuntimeConfig();
    if (!googleMapsApiKey) {
      res.status(503).json({ error: 'Places search is not configured' });
      return;
    }

    const params = new URLSearchParams({
      input: input.slice(0, MAX_INPUT_LEN),
      key: googleMapsApiKey,
      types: 'address',
      components: 'country:au',
    });
    const locationRaw =
      typeof req.query.location === 'string' ? req.query.location.trim() : '';
    if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(locationRaw)) {
      params.set('location', locationRaw);
      const rad =
        typeof req.query.radius === 'string' &&
        /^\d{1,6}$/.test(req.query.radius)
          ? req.query.radius
          : '50000';
      params.set('radius', rad);
    }
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
    try {
      const r = await fetch(url);
      const data: unknown = await r.json();
      res.status(r.ok ? 200 : 502).json(data);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(502).json({ error: message });
    }
  },
]);

/** GET /user-profile/user/places/details?placeId=… */
userPlacesRouter.get('/details', [
  async (req: RequestContext, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const raw = req.query.placeId;
    const placeId = typeof raw === 'string' ? raw.trim() : '';
    if (!placeId) {
      res.status(400).json({ error: 'Missing placeId' });
      return;
    }

    const { googleMapsApiKey } = await getMobileRuntimeConfig();
    if (!googleMapsApiKey) {
      res.status(503).json({ error: 'Places search is not configured' });
      return;
    }

    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry',
      key: googleMapsApiKey,
    });
    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    try {
      const r = await fetch(url);
      const data: unknown = await r.json();
      res.status(r.ok ? 200 : 502).json(data);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(502).json({ error: message });
    }
  },
]);

/** GET /user-profile/user/places/geocode?address=… — biased to Australia. */
userPlacesRouter.get('/geocode', [
  async (req: RequestContext, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const raw = req.query.address;
    const address = typeof raw === 'string' ? raw.trim() : '';
    if (!address) {
      res.status(400).json({ error: 'Missing address' });
      return;
    }

    const { googleMapsApiKey } = await getMobileRuntimeConfig();
    if (!googleMapsApiKey) {
      res.status(503).json({ error: 'Places search is not configured' });
      return;
    }

    const params = new URLSearchParams({
      address: address.slice(0, MAX_ADDRESS_LEN),
      components: 'country:AU',
      key: googleMapsApiKey,
    });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    try {
      const r = await fetch(url);
      const data: unknown = await r.json();
      res.status(r.ok ? 200 : 502).json(data);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(502).json({ error: message });
    }
  },
]);
