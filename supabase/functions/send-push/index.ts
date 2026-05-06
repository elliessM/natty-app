// Edge Function — Envoi d'une notification Web Push.
// 2 modes :
//   - body { test: true } → envoie une notif de test au user appelant
//   - body { user_id, title, body, url, tag } → envoie à un user (admin/cron)
//
// Variables d'environnement nécessaires (à configurer dans Supabase) :
//   - VAPID_PUBLIC_KEY
//   - VAPID_PRIVATE_KEY
//   - VAPID_SUBJECT (mailto:contact@nattyapp.fr)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Payload = {
  test?: boolean;
  user_id?: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@nattyapp.fr';

    if (!supabaseUrl || !serviceKey || !anonKey || !vapidPublic || !vapidPrivate) {
      return json({ error: 'Missing env config' }, 500);
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = (await req.json().catch(() => ({}))) as Payload;
    let targetUserId = payload.user_id ?? null;

    // Mode test : on identifie le user via son JWT
    if (payload.test || !targetUserId) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Missing Authorization' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (!user) return json({ error: 'Unauthorized' }, 401);
      targetUserId = user.id;
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: subs, error: subsErr } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);
    if (subsErr) return json({ error: subsErr.message }, 500);
    if (!subs || subs.length === 0) return json({ error: 'No subscription' }, 404);

    const notifTitle = payload.title ?? (payload.test ? '🎉 Natty marche !' : 'Natty');
    const notifBody =
      payload.body ?? (payload.test ? "Ta première notification est bien arrivée." : '');
    const notifUrl = payload.url ?? '/';
    const notifTag = payload.tag ?? 'natty';

    const results = await Promise.all(
      subs.map(async (s) => {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl, tag: notifTag })
          );
          return { ok: true, endpoint: s.endpoint };
        } catch (e: any) {
          // 404 / 410 → subscription expirée, on la nettoie
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id);
          }
          return { ok: false, endpoint: s.endpoint, error: String(e?.message ?? e) };
        }
      })
    );

    const sent = results.filter((r) => r.ok).length;
    return json({ ok: true, sent, total: subs.length, results });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
