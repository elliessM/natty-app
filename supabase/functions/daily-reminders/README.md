# daily-reminders — Edge Function

Vérifie toutes les 30 min si des rappels (hydratation, repas, pesée, résa) tombent dans la fenêtre passée, et envoie les push concernés.

## Variables d'environnement

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | déjà configurée pour `send-push` |
| `VAPID_PRIVATE_KEY` | idem |
| `VAPID_SUBJECT` | idem |
| `CRON_SECRET` | **nouveau** : un token long aléatoire (32+ chars) pour authentifier le cron externe |

## Déploiement

1. Dashboard Supabase → **Edge Functions → Create a new function**
2. **Function name** : `daily-reminders`
3. **Verify JWT** : **désactiver** (le cron externe ne fournit pas de JWT, on utilise le secret à la place)
4. Coller le contenu de `index.ts`
5. **Deploy**

## Configurer le cron externe (gratuit)

1. Va sur https://cron-job.org/en/signup → crée un compte (gratuit, sans CB)
2. **Cronjobs → Create cronjob**
3. **Title** : `Natty daily reminders`
4. **URL** : `https://qwdznyzcszrdtcjsffld.supabase.co/functions/v1/daily-reminders`
5. **Schedule** : `Every 30 minutes` (ou cocher `*/30 * * * *` en mode advanced)
6. **Advanced → Request method** : `POST`
7. **Advanced → Request headers** : ajoute :
   - `x-cron-secret` : la valeur du `CRON_SECRET` Supabase
8. **Save**

À partir de maintenant, toutes les 30 min, le cron pingera la fonction et les notifs s'enverront aux bons users selon leurs préférences.

## Test manuel

Depuis ton terminal :

```bash
curl -X POST \
  -H "x-cron-secret: VOTRE_SECRET" \
  https://qwdznyzcszrdtcjsffld.supabase.co/functions/v1/daily-reminders
```

Tu dois recevoir `{"ok":true,"sent":N,"errors":0}`. Si tu es à proximité d'un slot (genre il est 13h35 et `meals` actif), tu reçois la notif.
