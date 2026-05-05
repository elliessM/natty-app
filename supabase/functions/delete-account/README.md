# delete-account — Edge Function

## Déploiement (3 minutes via le dashboard)

1. Aller sur https://supabase.com/dashboard → projet `natty-dev`
2. Sidebar → **Edge Functions** → **Create a new function**
3. **Function name** : `delete-account`
4. **Verify JWT** : `Enabled` (par défaut)
5. Dans l'éditeur de code, coller le contenu de `index.ts`
6. **Deploy**

## Configuration

L'edge function utilise 3 variables d'environnement déjà fournies par Supabase :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Aucune** action manuelle nécessaire — elles sont injectées automatiquement.

## Comment ça marche

1. L'app appelle `supabase.functions.invoke('delete-account')` avec le JWT du user dans l'Authorization header
2. La function identifie l'user via le JWT
3. Elle utilise la `service_role_key` (privilèges admin) pour appeler `auth.admin.deleteUser(user.id)`
4. Les contraintes `on delete cascade` du schéma effacent automatiquement :
   - `profiles`
   - `journal_entries`
   - `reservations`
   - `hydration_logs`
5. Retour `{ ok: true }` côté app, qui signOut puis reset.

## Sécurité

- Le user ne peut supprimer que **son propre compte** (vérification via JWT)
- La `service_role_key` n'est jamais exposée au client
- L'opération est irréversible côté Supabase (le tier free ne fait pas de backup point-in-time)
