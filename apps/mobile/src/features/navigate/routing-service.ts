const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export type LatLng = { lat: number; lng: number };
export type RouteStep = { instruction: string; distance: string; duration: string };
export type Route = { steps: RouteStep[]; polyline: string; totalDistance: string; totalDuration: string };

export async function getWalkingRoute(origin: LatLng, destination: LatLng): Promise<Route> {
  if (!GOOGLE_API_KEY) return getMockRoute(origin, destination);

  const body = {
    origin: { location: { latLng: origin } },
    destination: { location: { latLng: destination } },
    travelMode: 'WALK',
    languageCode: 'en-AU',
    units: 'METRIC',
  };

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'routes.legs,routes.polyline,routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Routes API error: ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  const leg = route.legs?.[0];
  const steps: RouteStep[] = (leg?.steps ?? []).map((s: { navigationInstruction?: { instructions?: string }; distanceMeters?: number; staticDuration?: string }) => ({
    instruction: s.navigationInstruction?.instructions ?? '',
    distance: `${Math.round((s.distanceMeters ?? 0))} m`,
    duration: s.staticDuration ?? '',
  }));

  return {
    steps,
    polyline: route.polyline?.encodedPolyline ?? '',
    totalDistance: `${Math.round((route.distanceMeters ?? 0) / 1000 * 10) / 10} km`,
    totalDuration: route.duration ?? '',
  };
}

function getMockRoute(_origin: LatLng, _destination: LatLng): Route {
  return {
    steps: [
      { instruction: 'Head north on the footpath', distance: '200 m', duration: '3 min' },
      { instruction: 'Turn right at the intersection', distance: '150 m', duration: '2 min' },
      { instruction: 'Continue straight for 300 metres', distance: '300 m', duration: '4 min' },
      { instruction: 'Arrive at destination on the left', distance: '0 m', duration: '0 min' },
    ],
    polyline: '',
    totalDistance: '0.65 km',
    totalDuration: '9 min',
  };
}
