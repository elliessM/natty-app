export type Fridge = {
  id: string;
  name: string;
  addr: string;
  lat: number;
  lng: number;
  stockCount: number;
  open: boolean;
};

// Mock fridges — Toulouse, autour du quartier Compans-Caffarelli.
export const FRIDGES: Fridge[] = [
  { id: 'fpcompans', name: 'Fitness Park Compans', addr: '2 Bd Lascrosses', lat: 43.6103, lng: 1.4326, stockCount: 12, open: true },
  { id: 'szjeannedarc', name: "SportZone Jeanne d'Arc", addr: "5 Pl. Jeanne d'Arc", lat: 43.6087, lng: 1.4458, stockCount: 8, open: true },
  { id: 'urbcapitole', name: 'Urban Gym Capitole', addr: "8 Rue du Poids de l'Huile", lat: 43.6045, lng: 1.4442, stockCount: 0, open: false },
];

// Fallback sans géoloc : jardin Compans-Caffarelli, Toulouse.
export const COMPANS_CENTER = { lat: 43.6112, lng: 1.4337 };

// Haversine distance in meters.
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// Rough walking time estimate (5 km/h → ~80m/min)
export function walkingTime(m: number) {
  const minutes = Math.max(1, Math.round(m / 80));
  return `${minutes} min`;
}
