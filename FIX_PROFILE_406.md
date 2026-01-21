# 🔴 ERREUR 406 : Profil manquant

## ❌ **Symptôme**

```
GET /rest/v1/profiles 406 (Not Acceptable)

{
  "code": "PGRST116",
  "message": "Cannot coerce the result to a single JSON object",
  "details": "The result contains 0 rows"
}
```

---

## 🔍 **Cause du problème**

Vous êtes **authentifié dans Supabase Auth** (session active), mais **votre profil n'existe pas** dans la table `profiles`.

Cela peut arriver si :
1. La création du profil a échoué lors de l'inscription
2. Le profil a été supprimé manuellement
3. Il y a eu un problème de timing lors du Magic Link

---

## ✅ **Solutions appliquées**

### **1. Correction du code `useAuth.ts`**

**Avant** (causait l'erreur 406) :
```typescript
.single() // ❌ Lance une erreur si 0 résultats
```

**Après** :
```typescript
.maybeSingle() // ✅ Retourne null si 0 résultats, pas d'erreur
```

### **2. Nouvelle page `/profile-setup`**

Une page dédiée pour finaliser le profil si manquant :
- Détecte automatiquement qu'il manque un profil
- Formulaire pour créer le profil
- Supporte Client et Chauffeur
- Redirection automatique après création

### **3. Redirection automatique dans `ProtectedRoute`**

Si un utilisateur est authentifié mais sans profil → Redirection vers `/profile-setup`

---

## 🔧 **Comment ça fonctionne maintenant**

### **Flux normal (profil existe)**
```
[Login] → [Auth OK] → [Profil trouvé] → [Dashboard] ✅
```

###  **Flux avec profil manquant (nouveau)**
```
[Login] → [Auth OK] → [Profil manquant] → [/profile-setup] → [Création] → [Dashboard] ✅
```

---

## 🧪 **Test de la solution**

### **Option 1 : Laisser l'application gérer**

1. **Rechargez la page** de l'application
2. Vous serez **automatiquement redirigé** vers `/profile-setup`
3. **Remplissez le formulaire** :
   - Nom complet
   - Type de compte (Client ou Chauffeur)
   - Infos véhicule si chauffeur
4. Cliquez sur **"Créer mon profil"**
5. **✅ Vous serez redirigé** vers le dashboard

### **Option 2 : Diagnostic manuel (pour comprendre)**

1. **Ouvrir le SQL Editor de Supabase** :
   👉 https://app.supabase.com/project/vtpfjngsxouyglqodkyh/sql/new

2. **Exécuter le diagnostic** :
   ```sql
   -- Voir tous les users authentifiés
   SELECT id, email, phone, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 10;

   -- Voir tous les profils
   SELECT id, email, phone, full_name, role, created_at 
   FROM public.profiles 
   ORDER BY created_at DESC 
   LIMIT 10;

   -- Trouver les users SANS profil (le problème)
   SELECT u.id, u.email, u.phone, u.created_at, 'NO PROFILE' as status
   FROM auth.users u
   LEFT JOIN public.profiles p ON u.id = p.id
   WHERE p.id IS NULL
   ORDER BY u.created_at DESC;

   -- Vérifier votre ID spécifique
   SELECT * FROM auth.users WHERE id = 'b295a84d-651b-4eae-851a-3046e90543e8';
   SELECT * FROM public.profiles WHERE id = 'b295a84d-651b-4eae-851a-3046e90543e8';
   ```

3. **Résultat attendu** :
   - ✅ `auth.users` : Vous existez
   - ❌ `public.profiles` : Aucune ligne (profil manquant)

---

## 🛠️ **Option 3 : Créer le profil manuellement via SQL**

Si vous préférez créer le profil via SQL :

```sql
-- Remplacez les valeurs par les vôtres
INSERT INTO public.profiles (id, email, phone, full_name, role)
VALUES (
  'b295a84d-651b-4eae-851a-3046e90543e8', -- Votre user ID
  'votre-email@example.com',               -- Votre email
  NULL,                                     -- Ou '+226...' si vous avez un téléphone
  'Jean Dupont',                            -- Votre nom
  'customer'                                -- 'customer' ou 'driver'
);

-- Si vous avez choisi 'driver', ajoutez aussi :
INSERT INTO public.drivers (profile_id, vehicle_type, vehicle_plate, primary_city_id)
VALUES (
  'b295a84d-651b-4eae-851a-3046e90543e8', -- Votre user ID
  'moto',                                   -- 'moto', 'car', 'van', ou 'truck'
  'BF-123-ABC',                             -- Votre plaque
  (SELECT id FROM public.cities WHERE name = 'Ouagadougou' LIMIT 1) -- ID de la ville
);
```

Puis **rechargez l'application**.

---

## 📁 **Fichiers modifiés**

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useAuth.ts` | `.single()` → `.maybeSingle()` + logs |
| `src/components/ProtectedRoute.tsx` | Redirection vers `/profile-setup` si pas de profil |
| `src/pages/ProfileSetupPage.tsx` | **Nouvelle page** pour créer le profil |
| `src/App.tsx` | Ajout de la route `/profile-setup` |
| `supabase/sql/diagnostic_profiles.sql` | **Nouveau fichier** de diagnostic |

---

## ✅ **Checklist de vérification**

- [ ] Code mis à jour (git pull ou rechargement)
- [ ] Application rechargée dans le navigateur
- [ ] Redirection automatique vers `/profile-setup`
- [ ] Formulaire de profil affiché
- [ ] Profil créé avec succès
- [ ] Redirection vers dashboard
- [ ] Plus d'erreur 406

---

## 🔗 **Liens utiles**

| Ressource | URL |
|-----------|-----|
| **App - Profile Setup** | https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/profile-setup |
| **Supabase SQL Editor** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/sql/new |
| **Supabase Table Editor** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/editor |
| **Supabase Auth Users** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/users |

---

## 🎯 **Ce qui change pour l'utilisateur**

### **Avant (erreur 406)**
```
[Login] → [Auth OK] → [Erreur 406] → [Écran blanc/erreur] ❌
```

### **Maintenant (gestion élégante)**
```
[Login] → [Auth OK] → [Profil manquant détecté] → [Page /profile-setup]
                                                            ↓
                                                    [Formulaire]
                                                            ↓
                                                    [Création profil]
                                                            ↓
                                                    [Dashboard] ✅
```

---

## 🐛 **Si le problème persiste**

### **Erreur 406 encore visible**

1. **Videz le cache** : Ctrl+Shift+R
2. **Vérifiez que le code est à jour** : `git pull`
3. **Reconnectez-vous** : Déconnexion → Login

### **La page /profile-setup ne s'affiche pas**

1. **Allez manuellement** : https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/profile-setup
2. **Vérifiez la console** (F12) pour les erreurs JavaScript

### **Le profil n'est toujours pas créé**

1. **Vérifiez les RLS policies** : Assurez-vous que le fix RLS a été appliqué
2. **Vérifiez la console** pour les erreurs SQL
3. **Créez le profil manuellement** via SQL (voir Option 3)

---

## 🎉 **Résultat attendu**

Après avoir appliqué le fix :

1. ✅ Plus d'erreur 406
2. ✅ Redirection automatique vers `/profile-setup` si profil manquant
3. ✅ Formulaire de création de profil affiché
4. ✅ Profil créé avec succès
5. ✅ Dashboard accessible

**Rechargez l'application maintenant et vous serez automatiquement redirigé vers la page de setup !** 🚀
