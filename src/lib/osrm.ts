// Road routing via OSRM public demo server with Haversine straight-line fallback.
// OSRM expects coordinates as {longitude},{latitude} (not lat/lng).
// For Boat / Flight modes, skip OSRM and return Haversine distance only.

const OSRM_BASE = 'https://router.project-osrm.org'

export interface RouteResult {
  distance_km:  number
  duration_min: number
  source:       'osrm' | 'haversine'
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function getRoute(
  fromLat: number, fromLng: number,
  toLat:   number, toLng:   number,
  mode:    'Road' | 'Boat' | 'Flight' = 'Road',
): Promise<RouteResult> {
  const straight = Math.round(haversineKm(fromLat, fromLng, toLat, toLng) * 100) / 100

  if (mode !== 'Road') {
    return { distance_km: straight, duration_min: 0, source: 'haversine' }
  }

  try {
    // OSRM coordinate order: {lng},{lat}
    const url =
      `${OSRM_BASE}/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const json = await res.json()
    const route = json?.routes?.[0]
    if (!route) throw new Error('OSRM no route')
    return {
      distance_km:  Math.round((route.distance / 1000) * 100) / 100,
      duration_min: Math.round(route.duration / 60),
      source:       'osrm',
    }
  } catch {
    return { distance_km: straight, duration_min: 0, source: 'haversine' }
  }
}
