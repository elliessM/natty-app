export type Fridge = {
  id: string;
  name: string;
  addr: string;
  lat: number;
  lng: number;
  stockCount: number;
  open: boolean;
};

// Mock fridges around Paris 11e — coords approximatives.
export const FRIDGES: Fridge[] = [
  { id: 'fcnation', name: 'Fitness Club Nation', addr: '12 Rue de la Santé', lat: 48.8586, lng: 2.3767, stockCount: 8, open: true },
  { id: 'szconfluence', name: 'SportZone Confluence', addr: '4 Quai des Sportifs', lat: 48.8462, lng: 2.3745, stockCount: 12, open: true },
  { id: 'urbrepub', name: 'Urban Gym République', addr: '67 Rue République', lat: 48.8675, lng: 2.3642, stockCount: 0, open: false },
];

export const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };

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
