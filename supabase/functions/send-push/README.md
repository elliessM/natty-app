# send-push — Edge Function

Envoie une notification Web Push à un user.

## Variables d'environnement à configurer

Dans Supabase Dashboard → **Project Settings → Edge Functions → Secrets** :

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | clé publique générée par `web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | clé privée générée par `web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:contact@nattyapp.fr` (ou ton email) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement.

## Déploiement

1. Dashboard Supabase → **Edge Functions → Create a new function**
2. **Function name** : `send-push`
3. Coller le contenu de `index.ts`
4. **Deploy**

## Test depuis l'app

L'app appelle `supabase.functions.invoke('send-push', { body: { test: true } })`. La function identifie le user via le JWT et envoie la notif test à toutes ses subscriptions enregistrées.
