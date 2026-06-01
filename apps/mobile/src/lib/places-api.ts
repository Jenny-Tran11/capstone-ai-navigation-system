import { apiClient } from '@/lib/api-client';
import { getRuntimeConfig } from '@/lib/runtime-config';

type MapPoint = { latitude: number; longitude: number };

export type PlaceAutocompletePrediction = {
  place_id: string;
  description: string;
};

export type NearbyPlace = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

/** Australia street addresses only; optional GPS bias within AU (via backend → Google). */
export async function placesAutocomplete(
  input: string,
  locationBias: MapPoint | null,
): Promise<PlaceAutocompletePrediction[]> {
  const q = input.trim();
  if (!q) return [];
  try {
    const params: Record<string, string> = { input: q };
    if (locationBias) {
      params.location = `${locationBias.latitude},${locationBias.longitude}`;
      params.radius = '50000';
    }
    const { data } = await apiClient.get<{
      predictions?: PlaceAutocompletePrediction[];
      status?: string;
    }>('/user-profile/user/places/autocomplete', { params });
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return [];
    }
    return data.predictions ?? [];
  } catch {
    return [];
  }
}

export async function placesDetailsGeometry(
  placeId: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!placeId.trim()) return null;
  try {
    const { data } = await apiClient.get<{
      result?: { geometry?: { location?: { lat: number; lng: number } } };
    }>('/user-profile/user/places/details', { params: { placeId } });
    const loc = data.result?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {
    // ignore
  }
  return null;
}

export async function placesGeocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const a = address.trim();
  if (!a) return null;
  try {
    const { data } = await apiClient.get<{
      results?: { geometry?: { location?: { lat: number; lng: number } } }[];
    }>('/user-profile/user/places/geocode', { params: { address: a } });
    const loc = data.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
  } catch {
    // ignore
  }
  return null;
}

/**
 * Direct Google Places Text Search for nearby transit stops/stations and key POIs.
 * Falls back to empty list on any API/key error.
 */
export async function placesNearbyTransitPoi(
  location: MapPoint,
): Promise<NearbyPlace[]> {
  const runtime = await getRuntimeConfig();
  const key = runtime.googleMapsApiKey?.trim();
  if (!key) return [];

  const body = {
    textQuery:
      'bus stop OR train station OR tram stop OR ferry terminal OR station',
    rankPreference: 'DISTANCE',
    maxResultCount: 8,
    locationBias: {
      circle: {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 2500,
      },
    },
    languageCode: 'en',
    regionCode: 'AU',
  };

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
      }>;
    };

    return (data.places ?? [])
      .map((p) => {
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          label: p.displayName?.text?.trim() || p.formattedAddress || 'Nearby place',
          address: p.formattedAddress || p.displayName?.text?.trim() || 'Nearby place',
          lat,
          lng,
        } satisfies NearbyPlace;
      })
      .filter((p): p is NearbyPlace => p !== null);
  } catch {
    return [];
  }
}
