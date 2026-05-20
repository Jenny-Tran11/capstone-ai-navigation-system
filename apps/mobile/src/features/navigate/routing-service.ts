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

function stripHtmlEntities(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export type LatLng = { lat: number; lng: number };
export type MapPoint = { latitude: number; longitude: number };
export type StepType = 'walking' | 'transit';

export type TransitDetails = {
  vehicle?: string; // 'BUS' | 'SUBWAY' | 'RAIL' | 'TRAM' | 'FERRY'
  shortName?: string;
  headsign?: string;
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
  arrivalTime?: string;
};

export type RouteStep = {
  instruction: string;
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
  endCoord?: MapPoint;
  stepType?: StepType;
  transitDetails?: TransitDetails;
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

/** Distance (m) off-route before recalculation is triggered. */
export const DEVIATION_METERS = 50;

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

function distanceToSegment(p: MapPoint, a: MapPoint, b: MapPoint): number {
  const cosLat = Math.cos((p.latitude * Math.PI) / 180);
  const px = (p.longitude - a.longitude) * cosLat;
  const py = p.latitude - a.latitude;
  const dx = (b.longitude - a.longitude) * cosLat;
  const dy = b.latitude - a.latitude;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineDistance(p, a);
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  return haversineDistance(p, {
    latitude: a.latitude + t * dy,
    longitude: a.longitude + (t * dx) / cosLat,
  });
}

/** Returns the minimum distance (m) from point to the nearest segment of the polyline. */
export function nearestPointOnRoute(
  point: MapPoint,
  polyline: MapPoint[],
): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineDistance(point, polyline[0]);
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegment(point, polyline[i], polyline[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

function vehicleLabel(type?: string): string {
  switch (type) {
    case 'BUS': return 'Bus';
    case 'SUBWAY': return 'Subway';
    case 'RAIL': return 'Train';
    case 'TRAM': return 'Tram';
    case 'FERRY': return 'Ferry';
    default: return 'Transit';
  }
}

function buildTransitInstruction(td: TransitDetails): string {
  const parts: string[] = [];
  if (td.shortName) {
    parts.push(`Take ${vehicleLabel(td.vehicle)} ${td.shortName}`);
  } else if (td.vehicle) {
    parts.push(`Take ${vehicleLabel(td.vehicle)}`);
  }
  if (td.headsign) parts.push(`towards ${td.headsign}`);
  if (td.departureStop) parts.push(`from ${td.departureStop}`);
  if (td.arrivalStop) parts.push(`to ${td.arrivalStop}`);
  return parts.join(' ') || 'Board transit';
}

type LegacyMode = 'walking' | 'transit';

async function getLegacyDirectionsRoute(
  mode: LegacyMode,
  origin: LatLng,
  destination: LatLng,
  apiKey: string,
): Promise<Route | null> {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key: apiKey,
    region: 'au',
    language: 'en-AU',
  });
  if (mode === 'transit') params.set('transit_routing_preference', 'fewer_transfers');

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route0 = data.routes?.[0];
    const leg = route0?.legs?.[0];
    if (!route0 || !leg) return null;

    const polylinePoints: MapPoint[] = route0.overview_polyline?.points
      ? decodePolyline(route0.overview_polyline.points)
      : [];

    const steps: RouteStep[] = (leg.steps ?? []).map((s: any) => {
      const distanceMeters = Number(s.distance?.value ?? 0);
      const durationSeconds = Number(s.duration?.value ?? 0);
      const stepPoints: MapPoint[] = s.polyline?.points
        ? decodePolyline(s.polyline.points)
        : [];
      const endCoord =
        stepPoints.length > 0 ? stepPoints[stepPoints.length - 1] : undefined;

      let transitDetails: TransitDetails | undefined;
      let stepType: StepType = 'walking';
      if (mode === 'transit' && s.travel_mode === 'TRANSIT') {
        stepType = 'transit';
        const td = s.transit_details ?? {};
        transitDetails = {
          vehicle: td.line?.vehicle?.type,
          shortName: td.line?.short_name ?? td.line?.name,
          headsign: td.headsign,
          departureStop: td.departure_stop?.name,
          arrivalStop: td.arrival_stop?.name,
          departureTime: td.departure_time?.text,
          arrivalTime: td.arrival_time?.text,
        };
      }

      const htmlInstruction = String(s.html_instructions ?? '');
      const instruction =
        stripHtmlEntities(htmlInstruction) ||
        (stepType === 'transit' && transitDetails
          ? buildTransitInstruction(transitDetails)
          : 'Continue');

      return {
        instruction,
        distance: `${Math.round(distanceMeters)} m`,
        duration: formatDuration(durationSeconds),
        distanceMeters,
        durationSeconds,
        endCoord,
        stepType,
        transitDetails,
      };
    });

    return {
      steps,
      polyline: route0.overview_polyline?.points ?? '',
      polylinePoints,
      totalDistance: `${Math.round((Number(leg.distance?.value ?? 0) / 1000) * 10) / 10} km`,
      totalDuration: formatDuration(Number(leg.duration?.value ?? 0)),
      totalDistanceMeters: Number(leg.distance?.value ?? 0),
      totalDurationSeconds: Number(leg.duration?.value ?? 0),
      destination,
    };
  } catch {
    return null;
  }
}

// ─── Walking route ────────────────────────────────────────────────────────────

export async function getWalkingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<Route> {
  const runtime = await getRuntimeConfig();
  const GOOGLE_API_KEY = runtime.googleMapsApiKey;
  if (!GOOGLE_API_KEY) return getMockRoute(origin, destination);

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode: 'WALK',
    languageCode: 'en-AU',
    units: 'METRIC',
    regionCode: 'AU',
  };

  let data: any;
  try {
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

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Routes API error ${res.status}: ${body || 'no body'}`);
    }
    data = await res.json();
  } catch {
    const legacy = await getLegacyDirectionsRoute(
      'walking',
      origin,
      destination,
      GOOGLE_API_KEY,
    );
    return legacy ?? getMockRoute(origin, destination);
  }

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
        instruction: stripHtmlEntities(s.navigationInstruction?.instructions ?? ''),
        distance: `${Math.round(distanceMeters)} m`,
        duration: formatDuration(durationSeconds),
        distanceMeters,
        durationSeconds,
        endCoord,
        stepType: 'walking' as StepType,
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

// ─── Transit route ────────────────────────────────────────────────────────────

type TransitApiStep = {
  navigationInstruction?: { instructions?: string };
  travelMode?: string;
  distanceMeters?: number;
  staticDuration?: string;
  polyline?: { encodedPolyline?: string };
  transitDetails?: {
    stopDetails?: {
      arrivalStop?: { name?: string };
      departureStop?: { name?: string };
    };
    localizedValues?: {
      arrivalTime?: { time?: { text?: string } };
      departureTime?: { time?: { text?: string } };
    };
    headsign?: string;
    transitLine?: {
      vehicle?: { type?: string };
      nameShort?: string;
      name?: string;
    };
  };
};

export async function getTransitRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<Route> {
  const runtime = await getRuntimeConfig();
  const GOOGLE_API_KEY = runtime.googleMapsApiKey;
  if (!GOOGLE_API_KEY) return getMockTransitRoute(origin, destination);

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode: 'TRANSIT',
    languageCode: 'en-AU',
    units: 'METRIC',
    regionCode: 'AU',
  };

  let data: any;
  try {
    const res = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask':
            'routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline,routes.polyline,routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Routes API error ${res.status}: ${body || 'no body'}`);
    }
    data = await res.json();
  } catch {
    const legacy = await getLegacyDirectionsRoute(
      'transit',
      origin,
      destination,
      GOOGLE_API_KEY,
    );
    return legacy ?? getMockTransitRoute(origin, destination);
  }

  const route = data.routes?.[0];
  if (!route) throw new Error('No transit route found');

  const leg = route.legs?.[0];
  const steps: RouteStep[] = (leg?.steps ?? []).map((s: TransitApiStep) => {
    const distanceMeters = s.distanceMeters ?? 0;
    const durationSeconds = parseDurationSeconds(s.staticDuration ?? '');
    const stepPoints = s.polyline?.encodedPolyline
      ? decodePolyline(s.polyline.encodedPolyline)
      : [];
    const endCoord =
      stepPoints.length > 0 ? stepPoints[stepPoints.length - 1] : undefined;
    const isTransit = s.travelMode === 'TRANSIT';

    let transitDetails: TransitDetails | undefined;
    if (s.transitDetails) {
      const td = s.transitDetails;
      transitDetails = {
        vehicle: td.transitLine?.vehicle?.type,
        shortName: td.transitLine?.nameShort ?? td.transitLine?.name,
        headsign: td.headsign,
        departureStop: td.stopDetails?.departureStop?.name,
        arrivalStop: td.stopDetails?.arrivalStop?.name,
        departureTime: td.localizedValues?.departureTime?.time?.text,
        arrivalTime: td.localizedValues?.arrivalTime?.time?.text,
      };
    }

    const rawInstruction = stripHtmlEntities(
      s.navigationInstruction?.instructions ?? '',
    );
    const instruction =
      rawInstruction ||
      (isTransit && transitDetails
        ? buildTransitInstruction(transitDetails)
        : 'Continue');

    return {
      instruction,
      distance: distanceMeters > 0 ? `${Math.round(distanceMeters)} m` : '',
      duration: formatDuration(durationSeconds),
      distanceMeters,
      durationSeconds,
      endCoord,
      stepType: isTransit ? ('transit' as StepType) : ('walking' as StepType),
      transitDetails,
    };
  });

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

// ─── Mock fallbacks ───────────────────────────────────────────────────────────

function getMockRoute(origin: LatLng, destination: LatLng): Route {
  const originPoint: MapPoint = {
    latitude: origin.lat,
    longitude: origin.lng,
  };
  const destPoint: MapPoint = {
    latitude: destination.lat,
    longitude: destination.lng,
  };
  const totalDistanceMeters = Math.max(
    100,
    Math.round(haversineDistance(originPoint, destPoint)),
  );
  const totalDurationSeconds = Math.max(
    120,
    Math.round(totalDistanceMeters / 1.2),
  );

  return {
    steps: [
      {
        instruction: 'Head towards your destination',
        distance: `${Math.round(totalDistanceMeters * 0.5)} m`,
        duration: formatDuration(Math.round(totalDurationSeconds * 0.5)),
        distanceMeters: Math.round(totalDistanceMeters * 0.5),
        durationSeconds: Math.round(totalDurationSeconds * 0.5),
        endCoord: {
          latitude: (origin.lat + destination.lat) / 2,
          longitude: (origin.lng + destination.lng) / 2,
        },
        stepType: 'walking',
      },
      {
        instruction: 'Continue straight to destination',
        distance: `${Math.round(totalDistanceMeters * 0.5)} m`,
        duration: formatDuration(Math.round(totalDurationSeconds * 0.5)),
        distanceMeters: Math.round(totalDistanceMeters * 0.5),
        durationSeconds: Math.round(totalDurationSeconds * 0.5),
        endCoord: destPoint,
        stepType: 'walking',
      },
      {
        instruction: 'Arrive at destination',
        distance: '0 m',
        duration: '0 min',
        distanceMeters: 0,
        durationSeconds: 0,
        endCoord: destPoint,
        stepType: 'walking',
      },
    ],
    polyline: '',
    polylinePoints: [originPoint, destPoint],
    totalDistance: `${Math.round(totalDistanceMeters / 100) / 10} km`,
    totalDuration: formatDuration(totalDurationSeconds),
    totalDistanceMeters,
    totalDurationSeconds,
    destination,
  };
}

function getMockTransitRoute(origin: LatLng, destination: LatLng): Route {
  const originPoint: MapPoint = {
    latitude: origin.lat,
    longitude: origin.lng,
  };
  const destPoint: MapPoint = {
    latitude: destination.lat,
    longitude: destination.lng,
  };
  const totalDistanceMeters = Math.max(
    600,
    Math.round(haversineDistance(originPoint, destPoint)),
  );
  const totalDurationSeconds = Math.max(
    600,
    Math.round(totalDistanceMeters / 4.2),
  );

  return {
    steps: [
      {
        instruction: 'Walk to bus stop',
        distance: `${Math.round(totalDistanceMeters * 0.15)} m`,
        duration: formatDuration(Math.round(totalDurationSeconds * 0.15)),
        distanceMeters: Math.round(totalDistanceMeters * 0.15),
        durationSeconds: Math.round(totalDurationSeconds * 0.15),
        endCoord: {
          latitude: origin.lat + (destination.lat - origin.lat) * 0.2,
          longitude: origin.lng + (destination.lng - origin.lng) * 0.2,
        },
        stepType: 'walking',
      },
      {
        instruction: 'Take Bus 370 towards City Center',
        distance: `${Math.round((totalDistanceMeters * 0.7) / 100) / 10} km`,
        duration: formatDuration(Math.round(totalDurationSeconds * 0.7)),
        distanceMeters: Math.round(totalDistanceMeters * 0.7),
        durationSeconds: Math.round(totalDurationSeconds * 0.7),
        endCoord: {
          latitude: origin.lat + (destination.lat - origin.lat) * 0.85,
          longitude: origin.lng + (destination.lng - origin.lng) * 0.85,
        },
        stepType: 'transit',
        transitDetails: {
          vehicle: 'BUS',
          shortName: '370',
          headsign: 'City Center',
          departureStop: 'Main St Stop',
          arrivalStop: 'City Center Stop',
          departureTime: '10:25 AM',
          arrivalTime: '10:37 AM',
        },
      },
      {
        instruction: 'Walk to destination',
        distance: `${Math.round(totalDistanceMeters * 0.15)} m`,
        duration: formatDuration(Math.round(totalDurationSeconds * 0.15)),
        distanceMeters: Math.round(totalDistanceMeters * 0.15),
        durationSeconds: Math.round(totalDurationSeconds * 0.15),
        endCoord: destPoint,
        stepType: 'walking',
      },
      {
        instruction: 'Arrive at destination',
        distance: '',
        duration: '0 min',
        distanceMeters: 0,
        durationSeconds: 0,
        endCoord: destPoint,
        stepType: 'walking',
      },
    ],
    polyline: '',
    polylinePoints: [originPoint, destPoint],
    totalDistance: `${Math.round(totalDistanceMeters / 100) / 10} km`,
    totalDuration: formatDuration(totalDurationSeconds),
    totalDistanceMeters,
    totalDurationSeconds,
    destination,
  };
}
