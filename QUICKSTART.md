# 🚀 Guide de démarrage rapide - FastLogistics BF

Ce guide vous permet de lancer l'application en **moins de 15 minutes**.

---

## 📋 Prérequis

- **Node.js 18+** ([télécharger](https://nodejs.org/))
- **Git** ([télécharger](https://git-scm.com/))
- **Compte Supabase** (gratuit) : [supabase.com](https://supabase.com)
- **Éditeur de code** : VS Code recommandé

---

## 🎯 Étape 1 : Configuration Supabase

### 1.1 Créer un projet

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter / Créer un compte
3. Cliquer sur **"New Project"**
4. Remplir :
   - **Name** : fastlogistics-bf
   - **Database Password** : (générer un mot de passe fort)
   - **Region** : choisir le plus proche (ex: Frankfurt)
5. Cliquer sur **"Create new project"**
6. Attendre ~2 minutes que le projet soit créé

### 1.2 Récupérer les clés API

1. Dans le projet, aller dans **Settings** > **API**
2. Copier :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** (API Key)

### 1.3 Créer la base de données

1. Aller dans **SQL Editor**
2. Cliquer sur **"New query"**
3. Copier-coller le contenu de **`supabase/sql/main.sql`**
4. Cliquer sur **"Run"** (en bas à droite)
5. Attendre la confirmation ✅
6. Répéter avec **`supabase/sql/dispatch_patch.sql`**

### 1.4 Créer les buckets Storage

1. Aller dans **Storage**
2. Cliquer sur **"New bucket"**
3. Créer **order-photos** :
   - Name: `order-photos`
   - Public bucket: **❌ Non** (Private)
4. Créer **driver-documents** :
   - Name: `driver-documents`
   - Public bucket: **❌ Non** (Private)

### 1.5 Configurer les Storage Policies

Suivre les instructions dans **`supabase/STORAGE_POLICIES.md`** pour créer les policies via l'UI.

---

## 🎯 Étape 2 : Installation locale

### 2.1 Cloner le projet

```bash
git clone <votre-repo-url>
cd webapp
```

### 2.2 Installer les dépendances

```bash
npm install
```

### 2.3 Configurer les variables d'environnement

Créer un fichier **`.env`** à la racine :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_GOOGLE_MAPS_API_KEY=
```

> **Note** : Google Maps est optionnel pour le MVP. L'app fonctionne sans.

### 2.4 Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000** 🎉

---

## 🎯 Étape 3 : Créer des utilisateurs de test

### 3.1 Via l'application

1. Ouvrir http://localhost:3000
2. Cliquer sur **"Créer un compte"**
3. Entrer un numéro de téléphone : `+22670000001`
4. Supabase enverra un code OTP par email (car SMS n'est pas configuré en dev)

### 3.2 Via Supabase Dashboard

1. Aller dans **Authentication** > **Users**
2. Cliquer sur **"Add user"**
3. Créer 2 users :

**Customer** :

```
Phone: +22670000001
Password: test123456
```

**Driver** :

```
Phone: +22670000002
Password: test123456
```

4. Pour chaque user créé, copier son **UUID**
5. Aller dans **SQL Editor** et exécuter :

```sql
-- Créer profile customer
INSERT INTO public.profiles (id, phone, full_name, role)
VALUES ('UUID_COPIÉ_1', '+22670000001', 'Test Customer', 'customer');

-- Créer profile driver
INSERT INTO public.profiles (id, phone, full_name, role)
VALUES ('UUID_COPIÉ_2', '+22670000002', 'Test Driver', 'driver');

-- Créer driver entry
INSERT INTO public.drivers (
  profile_id, vehicle_type, vehicle_plate, primary_city_id,
  is_verified, onboarding_completed, online_status
)
VALUES (
  'UUID_COPIÉ_2',
  'moto',
  'BF-123-ABC',
  (SELECT id FROM public.cities WHERE name = 'Ouagadougou'),
  true,
  true,
  'online'
);
```

### 3.3 Seeds (optionnel)

Pour charger les données de test (villes) :

```bash
# Via SQL Editor Supabase
-- Copier-coller supabase/sql/seeds.sql
```

---

## 🎯 Étape 4 : Tester l'application

### 4.1 Login Customer

1. Aller sur http://localhost:3000/login
2. Entrer : `+22670000001`
3. Cliquer "Recevoir le code"
4. Entrer le mot de passe : `test123456` (en dev, le code OTP = password)
5. Vous êtes redirigé vers le dashboard customer ✅

### 4.2 Créer une commande

1. Cliquer sur **"Standard"**
2. Sélectionner **"Moto"**
3. Remplir pickup : Ouagadougou, adresse, contact
4. Remplir dropoff : Ouagadougou, adresse, contact
5. Remplir cargo : description, poids
6. Définir cash delivery : `1500 FCFA`
7. Cliquer **"Confirmer"**
8. Vous êtes redirigé vers la page de tracking ✅

### 4.3 Login Driver

1. Ouvrir un nouvel onglet : http://localhost:3000/login
2. Entrer : `+22670000002`
3. Entrer le mot de passe : `test123456`
4. Vous êtes sur le dashboard driver ✅

---

## 🎯 Étape 5 : Déployer l'Edge Function (optionnel)

> **Note** : Cette étape est optionnelle pour le développement local. Elle est nécessaire pour le dispatch automatique en production.

### 5.1 Installer Supabase CLI

```bash
npm install -g supabase
```

### 5.2 Login

```bash
npx supabase login
```

### 5.3 Link au projet

```bash
npx supabase link --project-ref xxxxx
```

(Remplacer `xxxxx` par votre Project Ref visible dans Settings > General)

### 5.4 Déployer la fonction

```bash
npx supabase functions deploy dispatch-order
```

### 5.5 Configurer FCM (optionnel)

Pour les push notifications :

```bash
npx supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

---

## 🎯 Étape 6 : Activer Auth OTP SMS (production)

En développement, OTP via email suffit. Pour la production :

### 6.1 Twilio

1. Créer compte [twilio.com](https://www.twilio.com)
2. Obtenir Account SID + Auth Token
3. Acheter un numéro Twilio
4. Dans Supabase : **Authentication** > **Providers** > **Phone**
5. Activer et configurer Twilio

### 6.2 MessageBird (alternative)

1. Créer compte [messagebird.com](https://www.messagebird.com)
2. Obtenir API Key
3. Configurer dans Supabase Phone Auth

---

## ✅ Vérification finale

Checklist :

- [ ] ✅ Projet Supabase créé
- [ ] ✅ Base de données configurée (main.sql + dispatch_patch.sql)
- [ ] ✅ Buckets Storage créés
- [ ] ✅ Storage Policies configurées
- [ ] ✅ Variables .env configurées
- [ ] ✅ `npm install` réussi
- [ ] ✅ `npm run dev` fonctionne
- [ ] ✅ Users test créés
- [ ] ✅ Login customer fonctionne
- [ ] ✅ Création commande fonctionne
- [ ] ✅ Login driver fonctionne

---

## 🐛 Troubleshooting

### Erreur "Invalid API key"

→ Vérifier que `.env` contient les bonnes clés Supabase

### Erreur "Table does not exist"

→ Vérifier que `main.sql` a été exécuté sans erreur dans SQL Editor

### Erreur "Row level security policy violated"

→ Vérifier que les RLS policies ont été créées (dans main.sql)

### Push notifications ne fonctionnent pas

→ FCM Server Key est optionnel pour le développement. L'app fonctionne sans.

### "Cannot read property 'id' of null"

→ Le user n'a pas de profile. Créer le profile avec l'INSERT ci-dessus.

---

## 📚 Prochaines étapes

- Lire **[README.md](./README.md)** pour la documentation complète
- Lire **[DEPLOYMENT.md](./DEPLOYMENT.md)** pour le déploiement production
- Explorer le code dans `src/` pour comprendre l'architecture

---

**Besoin d'aide ?** Ouvrir une issue sur GitHub ou contacter support@fastlogistics.bf

---

🎉 **Félicitations ! Votre application FastLogistics BF est prête à l'emploi !** 🚚
