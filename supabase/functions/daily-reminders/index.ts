// Edge Function — Rappels Natty programmés.
// Appelée toutes les 30 minutes par un cron externe (cron-job.org).
// Vérifie chaque user et envoie les notifs prévues dans la fenêtre.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Slots quotidiens — alignés avec scheduler.ts côté natif ────────
type Slot = {
  kind: 'hydration' | 'meal' | 'weighIn';
  hour: number;
  minute: number;
  weekday?: number; // 1=lun..7=dim, optionnel (sinon tous les jours)
  title: string;
  body: string;
  tag: string;
};

const HYDRATION_SLOTS: Slot[] = [
  { kind: 'hydration', hour: 11, minute: 0, title: '💧 Hydratation', body: 'Pause eau ? +250 mL pour rester sur ton objectif.', tag: 'hydration-11' },
  { kind: 'hydration', hour: 14, minute: 30, title: '💧 Hydratation', body: "Petit verre d'eau pour passer le cap de l'aprèm.", tag: 'hydration-14' },
  { kind: 'hydration', hour: 17, minute: 30, title: '💧 Hydratation', body: "Encore un dernier shot d'eau avant la séance ?", tag: 'hydration-17' },
];

const MEAL_SLOTS: Slot[] = [
  { kind: 'meal', hour: 9, minute: 0, title: '🍳 Petit-déjeuner', body: 'Tu as déjà loggé ton petit-déj ?', tag: 'meal-breakfast' },
  { kind: 'meal', hour: 13, minute: 30, title: '🍽️ Déjeuner', body: 'Pense à enregistrer ton repas du midi.', tag: 'meal-lunch' },
  { kind: 'meal', hour: 21, minute: 0, title: '🌙 Dîner', body: "Dernier rappel : logge ton dîner avant d'aller te coucher.", tag: 'meal-dinner' },
];

// ─── Time helpers (Europe/Paris) ────────────────────────────────────
function parisNow(): { date: Date; hour: number; minute: number; weekday: number } {
  const now = new Date();
  // L'API Intl gère DST automatiquement.
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const map: Record<string, number> = { lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 7 };
  const weekday = map[weekdayStr.toLowerCase().slice(0, 3)] ?? 1;
  return { date: now, hour, minute, weekday };
}

/** Slot tombé dans les `windowMin` dernières minutes ? */
function inWindow(slot: Slot, hour: number, minute: number, weekday: number, windowMin: number): boolean {
  if (slot.weekday && slot.weekday !== weekday) return false;
  const slotMins = slot.hour * 60 + slot.minute;
  const nowMins = hour * 60 + minute;
  const diff = nowMins - slotMins;
  return diff >= 0 && diff < windowMin;
}

// ─── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Vérifie le secret partagé pour empêcher des abus extérieurs.
  const cronSecret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (cronSecret && provided !== cronSecret) {
    return json({ error: 'forbidden' }, 403);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@nattyapp.fr';
    if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
      return json({ error: 'Missing env config' }, 500);
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const admin = createClient(supabaseUrl, serviceKey);
    const { hour, minute, weekday } = parisNow();
    const WINDOW = 30; // minutes

    // 1) Profils + subs
    const { data: profiles, error: pErr } = await admin
      .from('profiles')
      .select('id, name, notifications_enabled, notif_prefs, weigh_in_day, weigh_in_hour');
    if (pErr) return json({ error: pErr.message }, 500);

    const { data: subs, error: sErr } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth');
    if (sErr) return json({ error: sErr.message }, 500);

    const subsByUser = new Map<string, typeof subs>();
    for (const s of subs ?? []) {
      const arr = subsByUser.get(s.user_id) ?? [];
      arr.push(s);
      subsByUser.set(s.user_id, arr);
    }

    // 2) Réservations à venir dans la fenêtre (rappel 15 min avant)
    const fromTs = new Date(Date.now() - 15 * 60_000).toISOString(); // déjà passé
    const toTs = new Date(Date.now() + 16 * 60_000).toISOString(); // dans la prochaine demi-heure
    const { data: resas } = await admin
      .from('reservations')
      .select('user_id, fridge_name, pickup_ts, cancelled_at, completed_at')
      .gte('pickup_ts', fromTs)
      .lte('pickup_ts', toTs)
      .is('cancelled_at', null)
      .is('completed_at', null);

    let totalSent = 0;
    const errors: any[] = [];

    // ─── Notifs récurrentes ────────────────────────────────────
    for (const p of profiles ?? []) {
      if (!p.notifications_enabled) continue;
      const userSubs = subsByUser.get(p.id) ?? [];
      if (userSubs.length === 0) continue;
      const prefs = (p.notif_prefs ?? {}) as { hydration?: boolean; meals?: boolean; weighIn?: boolean; reservations?: boolean };

      const userSlots: Slot[] = [];
      if (prefs.hydration !== false) userSlots.push(...HYDRATION_SLOTS);
      if (prefs.meals !== false) userSlots.push(...MEAL_SLOTS);
      if (prefs.weighIn !== false) {
        userSlots.push({
          kind: 'weighIn',
          hour: p.weigh_in_hour ?? 8,
          minute: 0,
          weekday: p.weigh_in_day ?? 1,
          title: '⚖️ Pèse-toi ce matin',
          body: 'Une mesure rapide pour suivre ta progression hebdo.',
          tag: 'weighIn',
        });
      }

      for (const slot of userSlots) {
        if (!inWindow(slot, hour, minute, weekday, WINDOW)) continue;
        for (const s of userSubs) {
          const r = await sendPush(s, { title: slot.title, body: slot.body, tag: slot.tag, url: '/' });
          if (r.ok) totalSent++;
          else errors.push(r);
          // Cleanup expired subs
          if (r.statusCode === 404 || r.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id);
          }
        }
      }
    }

    // ─── Rappels résa (15 min avant) ───────────────────────────
    for (const r of resas ?? []) {
      const profile = profiles?.find((p) => p.id === r.user_id);
      if (!profile?.notifications_enabled) continue;
      const prefs = (profile.notif_prefs ?? {}) as { reservations?: boolean };
      if (prefs.reservations === false) continue;
      const userSubs = subsByUser.get(r.user_id) ?? [];
      const minsUntil = Math.round((new Date(r.pickup_ts).getTime() - Date.now()) / 60_000);
      if (minsUntil > 16 || minsUntil < -1) continue; // sécurité
      const title = minsUntil <= 0 ? '✅ Ton retrait est dispo' : '🕒 Ton retrait dans 15 min';
      const body = minsUntil <= 0 ? `Récupère ta commande chez ${r.fridge_name}.` : `Direction ${r.fridge_name}.`;
      for (const s of userSubs) {
        const ok = await sendPush(s, { title, body, tag: `resa-${r.user_id}-${r.pickup_ts}`, url: '/' });
        if (ok.ok) totalSent++;
      }
    }

    return json({ ok: true, sent: totalSent, errors: errors.length });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

// ─── Helpers ────────────────────────────────────────────────────────
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: { title: string; body: string; tag?: string; url?: string }): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, statusCode: e?.statusCode, error: String(e?.message ?? e) };
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
