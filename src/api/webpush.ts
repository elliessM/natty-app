import { Platform } from 'react-native';
import { supabase } from './supabase';

// Clé VAPID publique — sera remplacée par celle générée par le user.
// La privée vit côté Edge Function uniquement (secret Supabase).
export const VAPID_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '__REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY__';

/** Disponible uniquement sur web + service worker + push manager + iOS standalone */
export function isWebPushSupported(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Sur iOS, le PushManager n'est dispo QUE quand l'app est installée
 * sur l'écran d'accueil (mode standalone).
 */
export function isIosStandaloneRequired(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua);
  if (!isIos) return false;
  // @ts-ignore navigator.standalone existe sur iOS
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone;
  return !isStandalone;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('[webpush] sw register failed', e);
    return null;
  }
}

export async function subscribeAndSync(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isWebPushSupported()) return { ok: false, reason: 'unsupported' };
  if (isIosStandaloneRequired())
    return { ok: false, reason: "ios-not-standalone" };

  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.startsWith('__')) {
    return { ok: false, reason: 'missing-vapid' };
  }

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'sw-failed' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'permission-denied' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const endpoint = sub.endpoint;
  const p256dh = arrayBufferToBase64(sub.getKey('p256dh'));
  const auth = arrayBufferToBase64(sub.getKey('auth'));

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );
  if (error) return { ok: false, reason: error.message };

  return { ok: true };
}

export async function unsubscribe(userId: string): Promise<void> {
  if (!isWebPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
}

export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>('send-push', {
    body: { test: true },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}
