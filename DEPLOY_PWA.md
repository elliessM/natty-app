# Déploiement PWA Natty (Vercel + nattyapp.fr)

## 1. Test local du build web

```bash
cd "~/Desktop/projet natty/app"
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo export --platform web
npx serve dist
```

Ouvre http://localhost:3000 dans Safari ou Chrome → vérifie que l'app charge, fais l'onboarding, scanne, navigue. Quand c'est OK, suite.

## 2. Push sur GitHub

Vercel se déploie depuis un repo Git. Si ton projet n'est pas encore sur GitHub :

```bash
cd "~/Desktop/projet natty/app"
git init
git add .
git commit -m "Initial Natty PWA"
```

Crée un repo sur https://github.com/new (nom : `natty-app`, privé), puis :

```bash
git remote add origin https://github.com/ELLIESSMAHIR/natty-app.git
git branch -M main
git push -u origin main
```

(Remplace `ELLIESSMAHIR` par ton username GitHub.)

## 3. Setup Vercel

1. Va sur https://vercel.com/signup → **Continue with GitHub**
2. Une fois connecté, clique **Add New… → Project**
3. Sélectionne le repo `natty-app`
4. **Framework Preset** : `Other` (Vercel détectera grâce à `vercel.json`)
5. **Root Directory** : `./` (par défaut)
6. **Build Command** : laisse vide (lu depuis `vercel.json`)
7. **Output Directory** : laisse vide (lu depuis `vercel.json`)
8. **Environment Variables** : aucune nécessaire — la clé Supabase publishable est déjà en clair dans le code, c'est volontaire et safe (RLS protège les données)
9. Clique **Deploy**

⏱️ Premier build = ~3-5 min. Ensuite Vercel te donne une URL `natty-app-xxx.vercel.app`. Ouvre-la depuis ton iPhone Safari → l'app marche.

## 4. Brancher nattyapp.fr depuis OVH

### A. Côté Vercel

1. Dans le dashboard Vercel → ton projet `natty-app`
2. **Settings → Domains**
3. Tape `nattyapp.fr` → **Add**
4. Vercel va afficher 2 enregistrements DNS à créer côté OVH :
   - Soit un **A record** sur `@` qui pointe vers `76.76.21.21`
   - Soit un **CNAME** sur `www` qui pointe vers `cname.vercel-dns.com`
5. Tape aussi `www.nattyapp.fr` → **Add** (Vercel le redirigera auto vers la racine)

### B. Côté OVH

1. Va sur https://www.ovh.com/manager → **Web Cloud → Noms de domaine → nattyapp.fr**
2. Onglet **Zone DNS**
3. Supprime les anciens A/AAAA pointant vers OVH si présents (sauf MX pour les emails, ne touche pas)
4. **Ajouter une entrée → A** :
   - Sous-domaine : (laisse vide)
   - Cible : `76.76.21.21`
5. **Ajouter une entrée → CNAME** :
   - Sous-domaine : `www`
   - Cible : `cname.vercel-dns.com.` (avec le point final)
6. Confirme la propagation (~5-30 min)

### C. Vérifier

Quand Vercel détecte la propagation, le statut passera à ✅. Tu peux ouvrir https://nattyapp.fr depuis ton iPhone — l'app charge avec ton domaine.

## 5. Installer la PWA sur iPhone (icône Natty)

1. Ouvre `https://nattyapp.fr` dans **Safari** (pas Chrome — iOS ne permet l'install PWA que via Safari)
2. Tape sur l'icône **Partager** (carré avec flèche vers le haut)
3. Scroll → **"Sur l'écran d'accueil"**
4. Confirme — Natty s'ajoute à ton springboard avec son icône
5. Au lancement, mode plein écran (sans la barre Safari)

## 6. Updates futurs

Chaque `git push` sur la branche `main` redéploie automatiquement sur Vercel en ~1 min. Pas besoin de toucher à OVH.

## Limitations PWA iOS (à connaître)

- **Notifications push** : non supportées sur iOS PWA (sauf iOS 16.4+ avec install écran d'accueil — ton cas est OK)
- **Caméra** : marche en HTTPS (donc OK avec ton domaine)
- **Pedometer / HealthKit** : ❌ pas accessible côté web — la card "Pas" affichera "Capteur indispo"
- **Haptics** : ❌ pas de Taptic Engine côté web
- **Géolocalisation** : ✅ marche
- **Stockage local** : ✅ AsyncStorage utilise IndexedDB côté web, persistance OK

Pour l'oral UX, c'est largement suffisant — la majorité des features fonctionnent.
