# 🔴 ERREUR : Récursion infinie dans les RLS policies

## ❌ **Symptôme**

```
GET https://vtpfjngsxouyglqodkyh.supabase.co/rest/v1/profiles 500 (Internal Server Error)

{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"profiles\""
}
```

---

## 🔍 **Cause du problème**

Dans le fichier `supabase/sql/main.sql`, ligne 203 :

```sql
CREATE POLICY "Profiles visible by owner and admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    --                    ^^^^^^^^^^^^^^^^ 
    --                    RÉCURSION ICI !
  );
```

La policy sur `profiles` fait une requête **sur `profiles` elle-même**, créant une **boucle infinie**.

---

## ✅ **Solution**

Utiliser une **fonction SECURITY DEFINER** qui contourne les RLS policies pour récupérer le rôle.

---

## 🔧 **Étapes de correction**

### **Étape 1 : Ouvrir le SQL Editor de Supabase**

👉 https://app.supabase.com/project/vtpfjngsxouyglqodkyh/sql/new

### **Étape 2 : Copier-coller le script de correction**

Le fichier `supabase/sql/fix_rls_recursion.sql` contient le correctif complet.

**Ou copiez directement ce script** :

```sql
-- ============================================
-- CORRECTIF : Récursion infinie dans RLS policies
-- ============================================

-- 1. Supprimer les anciennes policies profiles
DROP POLICY IF EXISTS "Profiles visible by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner (except role)" ON public.profiles;

-- 2. Créer une fonction helper SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer les policies profiles SANS récursion
CREATE POLICY "Profiles visible by owner and admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Profiles insertable by owner"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles updatable by owner (except role)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. Mettre à jour les autres policies
DROP POLICY IF EXISTS "Drivers visible by owner and admin" ON public.drivers;
CREATE POLICY "Drivers visible by owner and admin"
  ON public.drivers FOR SELECT
  USING (
    profile_id = auth.uid() OR
    public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Driver cities visible by driver and admin" ON public.driver_cities;
CREATE POLICY "Driver cities visible by driver and admin"
  ON public.driver_cities FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND profile_id = auth.uid()) OR
    public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Driver cities writable by admin only" ON public.driver_cities;
CREATE POLICY "Driver cities writable by admin only"
  ON public.driver_cities FOR ALL
  USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Orders visible by participants and admin" ON public.orders;
CREATE POLICY "Orders visible by participants and admin"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND profile_id = auth.uid()) OR
    public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Order events visible by participants and admin" ON public.order_events;
CREATE POLICY "Order events visible by participants and admin"
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid()) OR
        public.get_current_user_role() = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Order events insertable by admin only" ON public.order_events;
CREATE POLICY "Order events insertable by admin only"
  ON public.order_events FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Order photos visible by participants and admin" ON public.order_photos;
CREATE POLICY "Order photos visible by participants and admin"
  ON public.order_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid()) OR
        public.get_current_user_role() = 'admin'
      )
    )
  );

-- 5. Support email (phone devient optionnel)
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
ALTER TABLE public.profiles ADD CONSTRAINT check_email_or_phone 
  CHECK (email IS NOT NULL OR phone IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL;
```

### **Étape 3 : Exécuter le script**

1. Collez le script dans le SQL Editor
2. Cliquez sur **"Run"** (en bas à droite)
3. Attendez le message de succès

### **Étape 4 : Vérifier que ça fonctionne**

Dans le SQL Editor, exécutez cette requête de test :

```sql
-- Vérifier que la fonction existe
SELECT public.get_current_user_role();

-- Vérifier que les policies sont actives
SELECT * FROM public.profiles WHERE id = auth.uid();
```

Si ça retourne votre profil, **c'est corrigé !** ✅

---

## 🧪 **Tester dans l'application**

1. **Rechargez la page** de l'application
2. **Connectez-vous** si nécessaire
3. Ouvrez **DevTools (F12) → Network**
4. Vérifiez que `/rest/v1/profiles` retourne **200 OK** (et non 500)

---

## 🔍 **Explication technique**

### **Problème de récursion**

```sql
-- ❌ AVANT (récursion infinie)
CREATE POLICY "..." ON profiles FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE ...) -- Récursion !
);
```

Quand Postgres évalue la policy pour lire `profiles`, il doit :
1. Vérifier si `auth.uid() = id` → OK
2. Vérifier `EXISTS (SELECT FROM profiles ...)` → Il doit appliquer la policy de `profiles`
3. → Retour à l'étape 1 → **Boucle infinie** 💥

### **Solution SECURITY DEFINER**

```sql
-- ✅ APRÈS (pas de récursion)
CREATE FUNCTION get_current_user_role()
RETURNS TEXT
SECURITY DEFINER -- Contourne les RLS policies !
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "..." ON profiles FOR SELECT
USING (
  auth.uid() = id OR
  get_current_user_role() = 'admin' -- Pas de récursion !
);
```

`SECURITY DEFINER` fait que la fonction s'exécute avec les **privilèges du propriétaire de la fonction** (qui contournent les RLS), évitant la récursion.

---

## ⚠️ **Modifications de schéma**

Le script ajoute aussi le support pour l'email :

| Changement | Description |
|------------|-------------|
| `profiles.phone` | **Devient optionnel** (peut être NULL) |
| `profiles.email` | **Nouvelle colonne** (optionnelle) |
| Contrainte | **Au moins un** (email OU phone) requis |
| Index | Email unique si présent |

---

## ✅ **Checklist de vérification**

- [ ] Script SQL copié dans le SQL Editor
- [ ] Script exécuté avec succès (pas d'erreur)
- [ ] Fonction `get_current_user_role()` créée
- [ ] Policies recréées sans récursion
- [ ] Colonne `email` ajoutée
- [ ] Application rechargée
- [ ] Connexion testée
- [ ] Requête `/rest/v1/profiles` retourne 200 OK
- [ ] Dashboard affiché correctement

---

## 🔗 **Liens utiles**

| Ressource | URL |
|-----------|-----|
| **SQL Editor** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/sql/new |
| **Table Editor** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/editor |
| **Auth Users** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/users |
| **Database Functions** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/database/functions |

---

## 🆘 **Si le problème persiste**

### **Erreur lors de l'exécution du script**

1. **Vérifiez les logs** : SQL Editor → Onglet "Logs"
2. **Exécutez ligne par ligne** : Copiez chaque bloc séparément
3. **Vérifiez les permissions** : Utilisez le SQL Editor avec l'utilisateur `postgres`

### **L'erreur 500 persiste après le fix**

1. **Videz le cache du navigateur** : Ctrl+Shift+R
2. **Reconnectez-vous** : Déconnexion → Connexion
3. **Vérifiez les policies actives** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

### **La fonction n'est pas créée**

```sql
-- Vérifier si la fonction existe
SELECT * FROM pg_proc WHERE proname = 'get_current_user_role';

-- Si elle n'existe pas, la recréer manuellement
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎉 **Résultat attendu**

Après avoir appliqué le fix :

1. ✅ Pas d'erreur 500 sur `/rest/v1/profiles`
2. ✅ Dashboard charge correctement
3. ✅ Profil affiché
4. ✅ Pas d'erreur "infinite recursion"

**Une fois le fix appliqué, rechargez l'application et reconnectez-vous !** 🚀
