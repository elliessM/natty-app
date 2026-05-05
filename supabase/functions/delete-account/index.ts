// Edge Function — Suppression de compte RGPD.
// Le client envoie son JWT dans le header Authorization, on identifie l'user,
// puis on appelle auth.admin.deleteUser. La FK on-delete-cascade efface
// profiles / journal_entries / reservations / hydration_logs en chaîne.
//
// Déploiement (depuis le dashboard Supabase) :
//   1. Edge Functions → "Create a new function"
//   2. Nom : delete-account
//   3. Coller ce fichier dans l'éditeur
//   4. Deploy

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'Missing env config' }, 500);
    }

    // 1. Identifier le user à partir du JWT fourni
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();

    if (userErr || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2. Supprimer le user avec la service role key (cascade automatique).
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (delErr) {
      return json({ error: delErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
