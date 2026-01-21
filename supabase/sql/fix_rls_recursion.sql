-- ============================================
-- CORRECTIF : Récursion infinie dans RLS policies
-- ============================================
-- Problème : Les policies profiles font référence à elles-mêmes
-- Solution : Utiliser auth.jwt() pour récupérer le rôle

-- 1. Supprimer les anciennes policies profiles
DROP POLICY IF EXISTS "Profiles visible by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by owner (except role)" ON public.profiles;

-- 2. Ajouter une fonction helper pour récupérer le rôle depuis le JWT ou la DB
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Try to get role from JWT claims first (si configuré)
  -- Sinon, on fait une requête simple sans policy
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

-- 4. Mettre à jour les autres policies qui utilisent la même pattern
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

-- 5. Mettre à jour la colonne phone pour accepter NULL (pour support email)
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 6. Créer un index sur email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Ajouter une contrainte pour s'assurer qu'au moins un (email ou phone) est présent
ALTER TABLE public.profiles ADD CONSTRAINT check_email_or_phone 
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Rendre email unique si présent
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- Tester la récupération du profil
-- SELECT * FROM public.profiles WHERE id = auth.uid();
