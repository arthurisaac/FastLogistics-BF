# 🚚 FastLogistics BF

**Plateforme logistique mobile-first pour le Burkina Faso**

Application PWA complète avec espaces Customer, Driver et Admin, intégrant Supabase (Auth OTP, PostgreSQL, Storage, Realtime, RLS), offline-first avec IndexedDB, et dispatch push automatique via Edge Functions.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Démarrage rapide](#-démarrage-rapide)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Documentation complète](#-documentation-complète)

---

## ✨ Fonctionnalités

### 🎯 Core Features

- **Multi-villes** : Ouagadougou, Bobo-Dioulasso, Koudougou
- **Types de service** : Standard (jour même), Express (2-3h), Planifié
- **Types de véhicule** : Moto, Voiture, Van, Camion
- **Paiement** : Cash uniquement (collecte pickup/delivery flexible)
- **POD** : Photo obligatoire avant livraison (visible par client)
- **Offline-first** : Queue locale IndexedDB avec resync automatique
- **Realtime** : Suivi en temps réel via Supabase Realtime
- **Push notifications** : Dispatch automatique vers drivers via FCM

### 👥 Espaces utilisateurs

#### Customer

- Création de commande (booking multi-étapes)
- Suivi temps réel avec timeline d'événements
- Visualisation photos POD
- Historique des commandes
- Confirmation de réception

#### Driver

- Dashboard avec statut online/offline
- Acceptation/refus de commandes (anti-guess avec dispatch_attempts)
- Navigation étape par étape (arriving → pickup → transit → delivery)
- Collecte cash (pickup/delivery)
- Upload photo POD obligatoire
- Mode offline complet avec queue locale

#### Admin

- Vue d'ensemble des commandes
- Gestion des drivers et vérifications
- Statistiques

---

## 🛠️ Stack technique

### Frontend

- **React 18** + **TypeScript**
- **Vite** (build ultra-rapide)
- **Tailwind CSS** (styling utility-first)
- **React Router v6** (routing)
- **IDB** (IndexedDB pour offline)
- **PWA** (manifest + service worker)

### Backend

- **Supabase** (BaaS complet)
  - Auth OTP (SMS)
  - PostgreSQL avec RLS
  - Storage (buckets privés)
  - Realtime (subscriptions)
  - Edge Functions (Deno)
- **PostGIS** (données géospatiales)

### Dispatch System

- **Edge Function** `dispatch-order` (Deno)
- **FCM** (push notifications)
- **Anti-guess** (dispatch_attempts avec expires_at)
- **Multi-rounds** (batch_size × max_rounds)

---

## 📁 Structure du projet

```
webapp/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── OfflineBadge.tsx
│   │   └── ProtectedRoute.tsx
│   ├── config/              # Configuration
│   │   ├── constants.ts
│   │   └── supabase.ts
│   ├── contexts/            # Contexts React
│   │   └── AuthContext.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useOfflineQueue.ts
│   ├── lib/                 # Utilitaires
│   │   ├── offline-db.ts    # IndexedDB helpers
│   │   └── sync.ts          # Sync queue
│   ├── pages/               # Pages par rôle
│   │   ├── customer/
│   │   │   ├── BookingPage.tsx
│   │   │   ├── CustomerDashboard.tsx
│   │   │   └── TrackingPage.tsx
│   │   ├── driver/
│   │   │   ├── DriverActivePage.tsx
│   │   │   └── DriverDashboard.tsx
│   │   ├── LoginPage.tsx
│   │   ├── VerifyOtpPage.tsx
│   │   └── WelcomePage.tsx
│   ├── types/               # Types TypeScript
│   │   └── database.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── _shared/
│   │   │   ├── utils.ts
│   │   │   └── fcm.ts
│   │   └── dispatch-order/
│   │       └── index.ts
│   ├── sql/                 # Scripts SQL
│   │   ├── main.sql         # Tables, RLS, triggers, RPC
│   │   ├── dispatch_patch.sql
│   │   └── seeds.sql
│   └── STORAGE_POLICIES.md  # Guide policies Storage
├── public/                  # Assets statiques
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 Démarrage rapide

Voir **[QUICKSTART.md](./QUICKSTART.md)** pour les instructions détaillées.

### Prérequis

- Node.js 18+
- npm/yarn/pnpm
- Compte Supabase (gratuit)
- (Optionnel) FCM Server Key pour push notifications

### Installation

```bash
# 1. Cloner et installer
git clone <repo-url>
cd webapp
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 3. Démarrer le dev server
npm run dev
```

---

## ⚙️ Configuration

### Variables d'environnement

Créer `.env` à la racine :

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Base de données

1. Aller dans le SQL Editor de Supabase
2. Exécuter `supabase/sql/main.sql` (tables + RLS + triggers + RPC)
3. Exécuter `supabase/sql/dispatch_patch.sql` (dispatch amélioré)
4. (Optionnel) Exécuter `supabase/sql/seeds.sql` (données de test)

### Storage

Créer les buckets via UI Supabase :

1. **order-photos** (private) : photos commandes/POD
2. **driver-documents** (private) : documents drivers

Puis configurer les policies selon **[supabase/STORAGE_POLICIES.md](./supabase/STORAGE_POLICIES.md)**.

### Edge Function

```bash
# Déployer dispatch-order
npx supabase functions deploy dispatch-order

# Configurer secrets
npx supabase secrets set FCM_SERVER_KEY=your-fcm-key
```

---

## 📦 Déploiement

Voir **[DEPLOYMENT.md](./DEPLOYMENT.md)** pour le guide complet.

### Production checklist

- [ ] RLS activé sur toutes les tables
- [ ] Storage policies configurées
- [ ] Edge Function dispatch-order déployée
- [ ] Secrets FCM configurés
- [ ] Auth OTP SMS activé (Twilio/MessageBird)
- [ ] PWA manifest valide
- [ ] Build optimisé (`npm run build`)
- [ ] Monitoring configuré

---

## 📚 Documentation complète

- **[QUICKSTART.md](./QUICKSTART.md)** : Guide d'installation et premiers pas
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** : Guide de déploiement production
- **[supabase/STORAGE_POLICIES.md](./supabase/STORAGE_POLICIES.md)** : Policies Storage UI
- **[supabase/sql/main.sql](./supabase/sql/main.sql)** : Schéma complet BDD
- **[supabase/functions/dispatch-order/](./supabase/functions/dispatch-order/)** : Logique dispatch

---

## 🔐 Sécurité

### RLS (Row Level Security)

Toutes les tables sont protégées par RLS :

- **Customers** : accès uniquement à leurs commandes
- **Drivers** : accès uniquement à leurs commandes assignées
- **Admin** : accès total
- **Dispatch anti-guess** : vérification invitation valide (dispatch_attempts)

### Triggers

- Empêcher changement de `profiles.role` (sauf admin)
- Empêcher multi-villes pour moto/car (max 1 ville active)
- Auto-update `updated_at` sur modifications

### RPC-first

Toutes les actions critiques passent par des RPC :

- `driver_accept_order` (assignation atomique + anti-guess)
- `driver_mark_*` (changements de statut)
- `driver_collect_cash` (collecte paiement)
- `driver_add_pod_photo` (upload POD)
- `customer_confirm_completed` (confirmation client)

---

## 🎯 Roadmap

### MVP (Actuel)

- [x] Auth OTP SMS
- [x] Booking multi-étapes
- [x] Dispatch push automatique
- [x] Offline-first driver
- [x] POD obligatoire
- [x] Tracking temps réel
- [x] Cash split pickup/delivery

### V1.1

- [ ] Google Maps intégration (calcul itinéraire)
- [ ] Paiement mobile money
- [ ] Ratings & commentaires
- [ ] Notifications in-app
- [ ] Admin dashboard complet

### V2.0

- [ ] Multi-langue (FR/EN/Mooré)
- [ ] API publique
- [ ] Webhooks
- [ ] Analytics avancées
- [ ] Programme fidélité

---

## 🤝 Contribution

Contributions bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Projet privé - Tous droits réservés

---

## 📧 Support

- **Email** : support@fastlogistics.bf
- **Téléphone** : +226 XX XX XX XX

---

**FastLogistics BF** - Livraison rapide et fiable au Burkina Faso 🇧🇫
