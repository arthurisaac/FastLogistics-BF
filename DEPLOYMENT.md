# 🚀 Guide de déploiement Production - FastLogistics BF

Guide complet pour déployer FastLogistics BF en production.

---

## 📋 Checklist pré-déploiement

Avant de déployer en production, vérifier :

- [ ] ✅ Base de données configurée (RLS, triggers, RPC)
- [ ] ✅ Storage buckets et policies configurés
- [ ] ✅ Auth OTP SMS configuré (Twilio/MessageBird)
- [ ] ✅ Edge Function dispatch-order déployée
- [ ] ✅ Secrets FCM configurés
- [ ] ✅ Tests effectués en local
- [ ] ✅ Build production réussi
- [ ] ✅ Variables d'environnement production prêtes

---

## 🎯 Étape 1 : Configuration Supabase Production

### 1.1 Projet Production

Si vous avez un projet dev Supabase, créer un nouveau projet pour la production :

1. Aller sur [supabase.com](https://supabase.com)
2. **New Project** → `fastlogistics-bf-prod`
3. Choisir région et mot de passe fort
4. Attendre création (~2 min)

### 1.2 Base de données

```bash
# Exécuter dans SQL Editor
1. supabase/sql/main.sql
2. supabase/sql/dispatch_patch.sql
```

### 1.3 Storage

Créer les buckets et policies (voir `supabase/STORAGE_POLICIES.md`).

### 1.4 Auth SMS

#### Option A : Twilio

1. Aller dans **Authentication** > **Providers** > **Phone**
2. Activer **"Enable Phone provider"**
3. Sélectionner **"Twilio"**
4. Entrer :
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Phone Number
5. Sauvegarder

#### Option B : MessageBird

1. Sélectionner **"MessageBird"**
2. Entrer API Key
3. Sauvegarder

### 1.5 Edge Functions

```bash
# Link au projet prod
npx supabase link --project-ref your-prod-ref

# Déployer dispatch-order
npx supabase functions deploy dispatch-order

# Configurer secrets
npx supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

---

## 🎯 Étape 2 : Build et déploiement Frontend

### 2.1 Hébergement recommandés

- **Vercel** (recommandé) : déploiement Git automatique
- **Netlify** : alternative excellente
- **Cloudflare Pages** : ultra-rapide
- **Self-hosted** : via nginx/Docker

### 2.2 Variables d'environnement Production

Créer `.env.production` :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

### 2.3 Build

```bash
# Build production
npm run build

# Tester le build localement
npm run preview
```

Cela génère `dist/` prêt pour déploiement.

---

## 🎯 Étape 3 : Déploiement Vercel (recommandé)

### 3.1 Installation Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Premier déploiement

```bash
# Depuis la racine du projet
vercel

# Suivre les prompts :
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? fastlogistics-bf
# Directory? ./
# Override settings? No
```

### 3.3 Configurer les variables d'environnement

```bash
# Via CLI
vercel env add VITE_SUPABASE_URL
# Entrer la valeur: https://xxxxx.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Entrer la valeur: eyJhbG...

vercel env add VITE_GOOGLE_MAPS_API_KEY
# Entrer la valeur: AIza...
```

Ou via Dashboard Vercel :

1. Aller sur [vercel.com](https://vercel.com)
2. Projet → **Settings** → **Environment Variables**
3. Ajouter les 3 variables

### 3.4 Déployer en production

```bash
vercel --prod
```

✅ Votre app est en ligne : `https://fastlogistics-bf.vercel.app`

### 3.5 Domaine personnalisé

1. Dans Vercel Dashboard : **Settings** → **Domains**
2. Ajouter votre domaine : `fastlogistics.bf`
3. Suivre les instructions DNS

---

## 🎯 Étape 4 : Déploiement Netlify (alternative)

### 4.1 Via Dashboard

1. Aller sur [netlify.com](https://www.netlify.com)
2. **Add new site** → **Import an existing project**
3. Connecter GitHub/GitLab
4. Sélectionner le repo
5. Configurer :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
6. Ajouter les variables d'environnement (même que Vercel)
7. **Deploy site**

### 4.2 Via CLI

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Déployer
netlify deploy --prod
```

---

## 🎯 Étape 5 : Configuration PWA

### 5.1 Génération des icônes

Générer les icônes PWA (192x192, 512x512) :

1. Outil : [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload votre logo
3. Télécharger le pack
4. Placer dans `public/` :
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

### 5.2 Vérification PWA

Après déploiement :

1. Ouvrir Chrome DevTools
2. **Lighthouse** → **Progressive Web App**
3. **Generate report**
4. Vérifier score PWA > 90

---

## 🎯 Étape 6 : Configuration FCM (Push Notifications)

### 6.1 Créer projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → Nom : `fastlogistics-bf`
3. Désactiver Google Analytics (optionnel)
4. **Create project**

### 6.2 Obtenir FCM Server Key

1. **Project settings** (⚙️) → **Cloud Messaging**
2. Copier **Server key**
3. Activer **Firebase Cloud Messaging API** si demandé

### 6.3 Configurer dans Supabase

```bash
npx supabase secrets set FCM_SERVER_KEY=your-server-key
```

### 6.4 Générer vapidKey (pour web push)

1. Dans Firebase Console : **Cloud Messaging** → **Web Push certificates**
2. Copier **Key pair**
3. Ajouter à `.env.production` :

```bash
VITE_FCM_VAPID_KEY=your-vapid-key
```

---

## 🎯 Étape 7 : Monitoring et Analytics

### 7.1 Sentry (Error tracking)

```bash
npm install @sentry/react @sentry/vite-plugin
```

Configurer dans `src/main.tsx` :

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
})
```

### 7.2 Google Analytics

Ajouter dans `index.html` :

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 7.3 Supabase Monitoring

Dans Supabase Dashboard :

1. **Database** → **Logs** : requêtes SQL
2. **Edge Functions** → **Logs** : logs dispatch-order
3. **Auth** → **Users** : utilisateurs actifs

---

## 🎯 Étape 8 : Sécurité Production

### 8.1 RLS Verification

Vérifier que toutes les tables ont RLS activé :

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Toutes doivent avoir `rowsecurity = true`.

### 8.2 Policies Audit

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

Vérifier qu'aucune policy n'est trop permissive.

### 8.3 HTTPS

- Vercel/Netlify : HTTPS automatique ✅
- Self-hosted : configurer Let's Encrypt

### 8.4 CORS

Configuré dans Edge Functions (`_shared/utils.ts`).

---

## 🎯 Étape 9 : Tests Production

### 9.1 Tests manuels

- [ ] Login customer avec OTP SMS
- [ ] Création commande end-to-end
- [ ] Login driver avec OTP SMS
- [ ] Acceptation commande (push reçu)
- [ ] Actions driver (pickup, delivery, POD)
- [ ] Tracking temps réel client
- [ ] Offline mode driver
- [ ] PWA install (Add to Home Screen)

### 9.2 Tests charge (optionnel)

```bash
# Installer k6
brew install k6  # macOS
# ou télécharger depuis k6.io

# Test dispatch
k6 run load-test.js
```

---

## 🎯 Étape 10 : Backup et Maintenance

### 10.1 Backup Database

Supabase fait des backups automatiques. Pour backup manuel :

1. **Database** → **Backups**
2. **Create backup**

### 10.2 Monitoring quotidien

Configurer alertes :

- Supabase : **Settings** → **Integrations** → Slack/Email
- Vercel : Notifications déploiement
- Sentry : Alertes erreurs

### 10.3 Mises à jour

```bash
# Vérifier les dépendances outdated
npm outdated

# Mettre à jour (attention breaking changes)
npm update
```

---

## 📊 Métriques de succès

### KPIs à suivre

- **Utilisateurs actifs** (DAU/MAU)
- **Commandes créées** (par jour/semaine)
- **Taux d'acceptation drivers** (%)
- **Temps moyen de livraison** (minutes)
- **Taux de complétion** (delivered → completed)
- **Rating moyen drivers** (1-5)
- **Taux de crash** (< 1%)
- **Temps de chargement** (< 3s)

### Dashboards recommandés

- Google Analytics : acquisition utilisateurs
- Supabase : usage database + API
- Vercel Analytics : performance web
- Sentry : erreurs et stability

---

## 🆘 Support Production

### En cas de problème

1. **Vérifier logs** : Supabase + Vercel + Sentry
2. **Rollback** : `vercel rollback` ou via Dashboard
3. **Status page** : créer un status.fastlogistics.bf

### Contacts d'urgence

- **Dev Team** : dev@fastlogistics.bf
- **Supabase Support** : support@supabase.com
- **Vercel Support** : support@vercel.com

---

## ✅ Checklist post-déploiement

- [ ] ✅ App accessible via HTTPS
- [ ] ✅ OTP SMS fonctionne
- [ ] ✅ Push notifications fonctionnent
- [ ] ✅ Dispatch automatique fonctionne
- [ ] ✅ PWA installable
- [ ] ✅ Monitoring configuré
- [ ] ✅ Alertes configurées
- [ ] ✅ Backup automatique activé
- [ ] ✅ Tests end-to-end passés
- [ ] ✅ Documentation à jour

---

**🎉 Félicitations ! FastLogistics BF est en production !** 🚚

**URL Production** : https://fastlogistics.bf  
**Admin Dashboard** : https://fastlogistics.bf/admin  
**Supabase Dashboard** : https://app.supabase.com/project/xxxxx
