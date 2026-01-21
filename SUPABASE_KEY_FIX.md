# 🔴 CORRECTION URGENTE : Clé Supabase dans le navigateur

## ❌ **ERREUR ACTUELLE**

Vous avez l'erreur suivante :
```
{
  "message": "Forbidden use of secret API key in browser",
  "hint": "Secret API keys can only be used in a protected environment..."
}
```

**Cause** : Vous avez placé la **clé secrète (service_role)** dans votre `.env` au lieu de la **clé publique (anon)**.

---

## 🔑 **Les 2 types de clés Supabase**

| Clé | Usage | Où l'utiliser |
|-----|-------|---------------|
| **anon (publique)** | Frontend, browser | ✅ `.env` client (React app) |
| **service_role (secrète)** | Backend, serveur | ❌ JAMAIS dans le browser<br>✅ Edge Functions, serveur Node.js |

---

## ✅ **SOLUTION : Étapes pour corriger**

### **Étape 1 : Obtenir la clé publique (anon)**

1. Allez sur votre projet Supabase :  
   👉 **https://app.supabase.com/project/vtpfjngsxouyglqodkyh/settings/api**

2. Dans la section **Project API keys**, copiez la clé **anon public** :
   ```
   Exemple : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

3. **NE PAS copier** la clé `service_role` (marquée comme secrète)

---

### **Étape 2 : Créer le fichier `.env`**

À la racine du projet `/home/user/webapp/`, créez le fichier `.env` :

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vtpfjngsxouyglqodkyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE

# Google Maps (optionnel pour MVP)
VITE_GOOGLE_MAPS_API_KEY=

# FCM (optionnel pour MVP)
VITE_FCM_VAPID_KEY=
```

**Remplacez** `YOUR_ANON_KEY_HERE` par votre clé **anon** réelle.

---

### **Étape 3 : Vérifier le fichier `.env`**

```bash
cd /home/user/webapp
cat .env
```

✅ **Vous devriez voir** :
- `VITE_SUPABASE_URL=https://vtpfjngsxouyglqodkyh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbGci...` (une longue chaîne JWT)

❌ **Vous NE devez PAS voir** :
- Une clé courte (genre `sbp_xxxxx`)
- La mention `service_role`

---

### **Étape 4 : Redémarrer le serveur de développement**

```bash
# Arrêter le serveur (Ctrl+C)

# Redémarrer
cd /home/user/webapp
npm run dev
```

---

### **Étape 5 : Tester**

1. Ouvrez votre navigateur : **http://localhost:3000**
2. Ouvrez DevTools (F12) → Onglet **Network**
3. Rechargez la page
4. Vérifiez les appels API vers Supabase :
   - ✅ Vous devriez voir des requêtes avec status **200 OK**
   - ✅ Plus d'erreur 401 ou "Forbidden use of secret API key"

---

## 🔒 **Sécurité : Où utiliser quelle clé ?**

### ✅ **Clé `anon` (publique) dans :**
- `.env` du projet React (frontend)
- `src/config/supabase.ts`
- Applications mobiles (React Native)

### ✅ **Clé `service_role` (secrète) dans :**
- **Edge Functions Supabase** (`supabase/functions/`)
- Serveurs backend (Node.js, Express)
- Scripts de migration ou de seeds
- Variables d'environnement côté serveur (Vercel, Netlify)

### ❌ **JAMAIS** :
- Exposer `service_role` dans le code frontend
- Committer `.env` dans Git (déjà dans `.gitignore`)
- Partager les clés secrètes publiquement

---

## 📝 **Résumé rapide**

```bash
# 1. Copier .env.example
cp .env.example .env

# 2. Éditer .env avec votre clé anon
nano .env

# 3. Coller la clé anon (pas service_role!)
VITE_SUPABASE_ANON_KEY=eyJhbGci...votre_clé_anon_ici

# 4. Redémarrer
npm run dev
```

---

## 🆘 **Besoin d'aide ?**

- 🔗 **Docs Supabase** : https://supabase.com/docs/guides/api#api-url-and-keys
- 🔗 **Votre projet** : https://app.supabase.com/project/vtpfjngsxouyglqodkyh
- 📧 **Support** : https://supabase.com/support

---

## ✅ **Checklist finale**

- [ ] J'ai copié la clé **anon** (pas service_role)
- [ ] J'ai créé le fichier `.env` à la racine
- [ ] J'ai redémarré le serveur (`npm run dev`)
- [ ] Les appels API fonctionnent (plus d'erreur 401)
- [ ] Mon `.env` est dans `.gitignore` (déjà configuré)

**Une fois ces étapes terminées, l'erreur "Forbidden use of secret API key" disparaîtra !** 🎉
