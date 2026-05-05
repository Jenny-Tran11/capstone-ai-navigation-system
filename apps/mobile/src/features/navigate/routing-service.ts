import { getRuntimeConfig } from '@/lib/runtime-config';

function decodePolyline(encoded: string): MapPoint[] {
  const points: MapPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export type LatLng = { lat: number; lng: number };
export type MapPoint = { latitude: number; longitude: number };
export type RouteStep = {
  instruction: string;
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
  endCoord?: MapPoint;
};
export type Route = {
  steps: RouteStep[];
  polyline: string;
  polylinePoints: MapPoint[];
  totalDistance: string;
  totalDuration: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  destination: LatLng;
};

export function parseDurationSeconds(raw: string): number {
  if (!raw) return 0;
  const match = raw.match(/^(\d+)s$/);
  if (match) return Number.parseInt(match[1], 10);
  // already formatted like "5 min"
  const minMatch = raw.match(/^(\d+)\s*min/);
  if (minMatch) return Number.parseInt(minMatch[1], 10) * 60;
  return 0;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  return mins < 60
    ? `${mins} min`
    : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export function haversineDistance(a: MapPoint, b: MapPoint): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export async function getWalkingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<Route> {
  const runtime = await getRuntimeConfig();
  const GOOGLE_API_KEY = runtime.googleMapsApiKey;
  if (!GOOGLE_API_KEY) return getMockRoute(origin, destination);

  const body = {
    origin: { location: { latLng: origin } },
    destination: { location: { latLng: destination } },
    travelMode: 'WALK',
    languageCode: 'en-AU',
    units: 'METRIC',
  };

  const res = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline,routes.polyline,routes.distanceMeters,routes.duration',
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) throw new Error(`Routes API error: ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  const leg = route.legs?.[0];
  const steps: RouteStep[] = (leg?.steps ?? []).map(
    (s: {
      navigationInstruction?: { instructions?: string };
      distanceMeters?: number;
      staticDuration?: string;
      polyline?: { encodedPolyline?: string };
    }) => {
      const distanceMeters = s.distanceMeters ?? 0;
      const durationSeconds = parseDurationSeconds(s.staticDuration ?? '');
      const stepPoints = s.polyline?.encodedPolyline
        ? decodePolyline(s.polyline.encodedPolyline)
        : [];
      const endCoord =
        stepPoints.length > 0 ? stepPoints[stepPoints.length - 1] : undefined;
      return {
        instruction: (s.navigationInstruction?.instructions ?? '')
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' '),
        distance: `${Math.round(distanceMeters)} m`,
        duration: formatDuration(durationSeconds),
        distanceMeters,
        durationSeconds,
        endCoord,
      };
    },
  );

  const totalDistanceMeters = route.distanceMeters ?? 0;
  const totalDurationSeconds = parseDurationSeconds(route.duration ?? '');
  const encodedPolyline = route.polyline?.encodedPolyline ?? '';
  const polylinePoints: MapPoint[] = encodedPolyline
    ? decodePolyline(encodedPolyline)
    : [];

  return {
    steps,
    polyline: encodedPolyline,
    polylinePoints,
    totalDistance: `${Math.round(totalDistanceMeters / 100) / 10} km`,
    totalDuration: formatDuration(totalDurationSeconds),
    totalDistanceMeters,
    totalDurationSeconds,
    destination,
  };
}

function getMockRoute(_origin: LatLng, destination: LatLng): Route {
  return {
    steps: [
      {
        instruction: 'Head north on the footpath',
        distance: '200 m',
        duration: '3 min',
        distanceMeters: 200,
        durationSeconds: 180,
      },
      {
        instruction: 'Turn right at the intersection',
        distance: '150 m',
        duration: '2 min',
        distanceMeters: 150,
        durationSeconds: 120,
      },
      {
        instruction: 'Continue straight for 300 metres',
        distance: '300 m',
        duration: '4 min',
        distanceMeters: 300,
        durationSeconds: 240,
      },
      {
        instruction: 'Arrive at destination on the left',
        distance: '0 m',
        duration: '0 min',
        distanceMeters: 0,
        durationSeconds: 0,
      },
    ],
    polyline: '',
    polylinePoints: [],
    totalDistance: '0.65 km',
    totalDuration: '9 min',
    totalDistanceMeters: 650,
    totalDurationSeconds: 540,
    destination,
  };
}
