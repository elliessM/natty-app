import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { COMPANS_CENTER } from '../data/fridges';

export type LatLng = { lat: number; lng: number };

type LocationState = {
  coords: LatLng;
  loading: boolean;
  granted: boolean;
  error: string | null;
};

/**
 * Returns a best-effort location:
 *  - Real coords if permission granted
 *  - Compans-Caffarelli (Toulouse) as fallback (so UI can still render distances)
 */
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: COMPANS_CENTER,
    loading: true,
    granted: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setState({ coords: COMPANS_CENTER, loading: false, granted: false, error: null });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          granted: true,
          error: null,
        });
      } catch (e: any) {
        if (cancelled) return;
        setState({ coords: COMPANS_CENTER, loading: false, granted: false, error: String(e?.message ?? e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
