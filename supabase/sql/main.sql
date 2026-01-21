-- ============================================
-- FastLogistics BF - Main SQL Schema
-- ============================================
-- Ce fichier contient toutes les tables, RLS policies, triggers et RPC functions
-- À exécuter dans l'ordre dans le SQL Editor de Supabase

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 2. TABLES
-- ============================================

-- Table: cities
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('moto', 'car', 'van', 'truck')),
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  primary_city_id UUID NOT NULL REFERENCES public.cities(id),
  license_url TEXT,
  vehicle_registration_url TEXT,
  insurance_url TEXT,
  photo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  online_status TEXT NOT NULL DEFAULT 'offline' CHECK (online_status IN ('offline', 'online', 'busy')),
  push_token TEXT,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: driver_cities (pour multi-villes van/truck)
CREATE TABLE IF NOT EXISTS public.driver_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, city_id)
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.drivers(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('standard', 'express', 'scheduled')),
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('moto', 'car', 'van', 'truck')),
  
  -- Locations (JSONB)
  pickup_location JSONB NOT NULL, -- { address, city_id, latitude, longitude, contact_name, contact_phone }
  dropoff_location JSONB NOT NULL,
  
  -- Cargo (JSONB)
  cargo JSONB NOT NULL, -- { description, weight, dimensions, fragile, value }
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'no_driver_found', 'driver_assigned',
    'arriving_pickup', 'arrived_pickup', 'picked_up', 'in_transit',
    'arriving_delivery', 'delivered', 'completed', 'cancelled'
  )),
  
  -- Pricing
  estimated_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2),
  
  -- Payment (cash only pour MVP)
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method = 'cash'),
  cash_at_pickup DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cash_at_delivery DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cash_collected_pickup DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cash_collected_delivery DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'cash_due', 'partial', 'collected')),
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: order_events (audit trail)
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: order_photos (POD + autres)
CREATE TABLE IF NOT EXISTS public.order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  photo_type TEXT NOT NULL CHECK (photo_type IN ('pickup', 'delivery', 'damage', 'other')),
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  rated_by UUID NOT NULL REFERENCES public.profiles(id),
  rated_user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: dispatch_attempts (anti-guess security)
CREATE TABLE IF NOT EXISTS public.dispatch_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired', 'failed')),
  decline_reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON public.order_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_attempts_order_driver ON public.dispatch_attempts(order_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_attempts_expires_at ON public.dispatch_attempts(expires_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Cities: accessible par tous (lecture)
CREATE POLICY "Cities visible by everyone"
  ON public.cities FOR SELECT
  USING (is_active = true);

-- Profiles: lecture par owner + admin, mise à jour owner (sauf role)
CREATE POLICY "Profiles visible by owner and admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Profiles insertable by owner"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles updatable by owner (except role)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Drivers: lecture par owner + admin
CREATE POLICY "Drivers visible by owner and admin"
  ON public.drivers FOR SELECT
  USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers insertable by owner"
  ON public.drivers FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Drivers updatable by owner"
  ON public.drivers FOR UPDATE
  USING (profile_id = auth.uid());

-- Driver_cities: lecture par driver, écriture admin only
CREATE POLICY "Driver cities visible by driver and admin"
  ON public.driver_cities FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Driver cities writable by admin only"
  ON public.driver_cities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Orders: lecture par customer/driver/admin, insertion customer
CREATE POLICY "Orders visible by participants and admin"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Orders insertable by customer"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Pas de UPDATE direct sur orders (utiliser RPC)
-- Si nécessaire, ajouter policy admin only

-- Order_events: lecture participants, insertion via RPC (service_role ou admin)
CREATE POLICY "Order events visible by participants and admin"
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- INSERT order_events uniquement via RPC (service_role) ou admin
CREATE POLICY "Order events insertable by admin only"
  ON public.order_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Order_photos: lecture participants, insertion participants
CREATE POLICY "Order photos visible by participants and admin"
  ON public.order_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Order photos insertable by participants"
  ON public.order_photos FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid())
      )
    )
  );

-- Ratings: lecture participants, insertion customer/driver
CREATE POLICY "Ratings visible by participants and admin"
  ON public.ratings FOR SELECT
  USING (
    rated_by = auth.uid() OR
    rated_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Ratings insertable by customer or driver"
  ON public.ratings FOR INSERT
  WITH CHECK (
    rated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.drivers WHERE id = o.driver_id AND profile_id = auth.uid())
      )
    )
  );

-- Dispatch_attempts: lecture driver concerné + admin
CREATE POLICY "Dispatch attempts visible by driver and admin"
  ON public.dispatch_attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT dispatch_attempts via service_role uniquement (Edge Function)

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger: empêcher changement de role sauf admin
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Seul un admin peut changer le rôle';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- Trigger: empêcher multi-villes pour moto/car
CREATE OR REPLACE FUNCTION check_multi_city_constraint()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_type TEXT;
  v_active_cities_count INTEGER;
BEGIN
  -- Récupérer le type de véhicule
  SELECT vehicle_type INTO v_vehicle_type
  FROM public.drivers
  WHERE id = NEW.driver_id;
  
  -- Compter le nombre de villes actives pour ce driver
  SELECT COUNT(*) INTO v_active_cities_count
  FROM public.driver_cities
  WHERE driver_id = NEW.driver_id AND is_active = true;
  
  -- Si moto ou car, max 1 ville active
  IF v_vehicle_type IN ('moto', 'car') AND v_active_cities_count >= 1 AND NEW.is_active = true THEN
    RAISE EXCEPTION 'Moto et Car ne peuvent opérer que dans 1 ville active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_multi_city
  BEFORE INSERT OR UPDATE ON public.driver_cities
  FOR EACH ROW
  EXECUTE FUNCTION check_multi_city_constraint();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. RPC FUNCTIONS
-- ============================================

-- RPC: driver_accept_order (assignation atomique + anti-guess)
CREATE OR REPLACE FUNCTION driver_accept_order(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
  v_dispatch_valid BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est un driver
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.profile_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  -- Vérifier l'invitation valide (dispatch_attempts non expirée)
  SELECT EXISTS(
    SELECT 1 FROM public.dispatch_attempts
    WHERE order_id = p_order_id
      AND driver_id = v_driver_id
      AND status = 'sent'
      AND expires_at > now()
  ) INTO v_dispatch_valid;
  
  IF NOT v_dispatch_valid THEN
    RETURN json_build_object('success', false, 'message', 'Invitation invalide ou expirée');
  END IF;
  
  -- Vérifier l'ordre
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF v_order.status NOT IN ('confirmed', 'no_driver_found') THEN
    RETURN json_build_object('success', false, 'message', 'Commande déjà assignée ou statut invalide');
  END IF;
  
  IF v_order.driver_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande déjà assignée');
  END IF;
  
  -- Assignation atomique
  UPDATE public.orders
  SET driver_id = v_driver_id,
      status = 'driver_assigned',
      assigned_at = now()
  WHERE id = p_order_id;
  
  -- Marquer dispatch_attempt accepted
  UPDATE public.dispatch_attempts
  SET status = 'accepted', accepted_at = now()
  WHERE order_id = p_order_id AND driver_id = v_driver_id AND status = 'sent';
  
  -- Marquer les autres tentatives comme expired
  UPDATE public.dispatch_attempts
  SET status = 'expired'
  WHERE order_id = p_order_id AND driver_id != v_driver_id AND status = 'sent';
  
  -- Event
  INSERT INTO public.order_events (order_id, event_type, description, metadata)
  VALUES (p_order_id, 'driver_assigned', 'Chauffeur assigné', json_build_object('driver_id', v_driver_id));
  
  -- Mettre driver en busy
  UPDATE public.drivers SET online_status = 'busy' WHERE id = v_driver_id;
  
  RETURN json_build_object('success', true, 'message', 'Commande acceptée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_accept_order TO authenticated;

-- RPC: driver_decline_order
CREATE OR REPLACE FUNCTION driver_decline_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.profile_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  UPDATE public.dispatch_attempts
  SET status = 'declined', decline_reason = p_reason
  WHERE order_id = p_order_id AND driver_id = v_driver_id AND status = 'sent';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invitation introuvable');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Commande refusée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_decline_order TO authenticated;

-- RPC: driver_mark_arriving_pickup
CREATE OR REPLACE FUNCTION driver_mark_arriving_pickup(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
BEGIN
  SELECT d.id INTO v_driver_id FROM public.drivers d WHERE d.profile_id = auth.uid();
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable ou non assignée');
  END IF;
  
  IF v_order.status != 'driver_assigned' THEN
    RETURN json_build_object('success', false, 'message', 'Statut invalide');
  END IF;
  
  UPDATE public.orders SET status = 'arriving_pickup' WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event_type, description)
  VALUES (p_order_id, 'arriving_pickup', 'Chauffeur en route vers pickup');
  
  RETURN json_build_object('success', true, 'message', 'Statut mis à jour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_mark_arriving_pickup TO authenticated;

-- RPC: driver_mark_picked_up
CREATE OR REPLACE FUNCTION driver_mark_picked_up(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
BEGIN
  SELECT d.id INTO v_driver_id FROM public.drivers d WHERE d.profile_id = auth.uid();
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF v_order.status NOT IN ('arriving_pickup', 'arrived_pickup') THEN
    RETURN json_build_object('success', false, 'message', 'Statut invalide');
  END IF;
  
  UPDATE public.orders SET status = 'picked_up', picked_up_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event_type, description)
  VALUES (p_order_id, 'picked_up', 'Colis récupéré');
  
  RETURN json_build_object('success', true, 'message', 'Colis marqué récupéré');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_mark_picked_up TO authenticated;

-- RPC: driver_mark_in_transit
CREATE OR REPLACE FUNCTION driver_mark_in_transit(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
BEGIN
  SELECT d.id INTO v_driver_id FROM public.drivers d WHERE d.profile_id = auth.uid();
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF v_order.status != 'picked_up' THEN
    RETURN json_build_object('success', false, 'message', 'Statut invalide');
  END IF;
  
  UPDATE public.orders SET status = 'in_transit' WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event_type, description)
  VALUES (p_order_id, 'in_transit', 'En transit vers destination');
  
  RETURN json_build_object('success', true, 'message', 'En transit');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_mark_in_transit TO authenticated;

-- RPC: driver_add_pod_photo
CREATE OR REPLACE FUNCTION driver_add_pod_photo(
  p_order_id UUID,
  p_bucket TEXT,
  p_path TEXT,
  p_caption TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
  v_photo_id UUID;
BEGIN
  SELECT d.id, d.profile_id INTO v_driver_id
  FROM public.drivers d WHERE d.profile_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  INSERT INTO public.order_photos (order_id, uploaded_by, photo_type, storage_bucket, storage_path, caption, metadata)
  VALUES (p_order_id, auth.uid(), 'delivery', p_bucket, p_path, p_caption, p_metadata)
  RETURNING id INTO v_photo_id;
  
  INSERT INTO public.order_events (order_id, event_type, description, metadata)
  VALUES (p_order_id, 'pod_photo_added', 'Photo POD ajoutée', json_build_object('photo_id', v_photo_id));
  
  RETURN json_build_object('success', true, 'message', 'Photo POD ajoutée', 'photo_id', v_photo_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_add_pod_photo TO authenticated;

-- RPC: driver_mark_delivered (vérifie POD)
CREATE OR REPLACE FUNCTION driver_mark_delivered(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
  v_pod_count INTEGER;
BEGIN
  SELECT d.id INTO v_driver_id FROM public.drivers d WHERE d.profile_id = auth.uid();
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF v_order.status != 'in_transit' THEN
    RETURN json_build_object('success', false, 'message', 'Statut invalide');
  END IF;
  
  -- Vérifier POD (au moins 1 photo delivery)
  SELECT COUNT(*) INTO v_pod_count
  FROM public.order_photos
  WHERE order_id = p_order_id AND photo_type = 'delivery';
  
  IF v_pod_count < 1 THEN
    RETURN json_build_object('success', false, 'message', 'Photo POD obligatoire');
  END IF;
  
  UPDATE public.orders SET status = 'delivered', delivered_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event_type, description)
  VALUES (p_order_id, 'delivered', 'Livraison effectuée');
  
  -- Libérer driver
  UPDATE public.drivers SET online_status = 'online' WHERE id = v_driver_id;
  
  RETURN json_build_object('success', true, 'message', 'Livraison effectuée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_mark_delivered TO authenticated;

-- RPC: driver_collect_cash
CREATE OR REPLACE FUNCTION driver_collect_cash(
  p_order_id UUID,
  p_stage TEXT, -- 'pickup' ou 'delivery'
  p_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
  v_new_payment_status TEXT;
  v_total_collected NUMERIC;
  v_total_due NUMERIC;
BEGIN
  SELECT d.id INTO v_driver_id FROM public.drivers d WHERE d.profile_id = auth.uid();
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND driver_id = v_driver_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF p_stage = 'pickup' THEN
    UPDATE public.orders SET cash_collected_pickup = p_amount WHERE id = p_order_id;
  ELSIF p_stage = 'delivery' THEN
    UPDATE public.orders SET cash_collected_delivery = p_amount WHERE id = p_order_id;
  ELSE
    RETURN json_build_object('success', false, 'message', 'Stage invalide');
  END IF;
  
  -- Recalculer payment_status
  SELECT cash_collected_pickup + cash_collected_delivery INTO v_total_collected FROM public.orders WHERE id = p_order_id;
  v_total_due := v_order.cash_at_pickup + v_order.cash_at_delivery;
  
  IF v_total_collected >= v_total_due THEN
    v_new_payment_status := 'collected';
  ELSIF v_total_collected > 0 THEN
    v_new_payment_status := 'partial';
  ELSE
    v_new_payment_status := 'cash_due';
  END IF;
  
  UPDATE public.orders SET payment_status = v_new_payment_status WHERE id = p_order_id;
  
  INSERT INTO public.order_events (order_id, event_type, description, metadata)
  VALUES (p_order_id, 'cash_collected', 'Cash collecté', json_build_object('stage', p_stage, 'amount', p_amount));
  
  RETURN json_build_object('success', true, 'message', 'Cash collecté', 'payment_status', v_new_payment_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION driver_collect_cash TO authenticated;

-- RPC: customer_confirm_completed
CREATE OR REPLACE FUNCTION customer_confirm_completed(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND customer_id = auth.uid();
  IF v_order.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Commande introuvable');
  END IF;
  
  IF v_order.status != 'delivered' THEN
    RETURN json_build_object('success', false, 'message', 'Statut invalide');
  END IF;
  
  UPDATE public.orders SET status = 'completed', completed_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_events (order_id, event_type, description)
  VALUES (p_order_id, 'completed', 'Commande confirmée complétée par client');
  
  -- Update driver stats
  UPDATE public.drivers d
  SET total_deliveries = total_deliveries + 1
  WHERE id = v_order.driver_id;
  
  RETURN json_build_object('success', true, 'message', 'Commande complétée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION customer_confirm_completed TO authenticated;

-- ============================================
-- 6. STORAGE BUCKETS (à créer via UI)
-- ============================================
-- 1. Créer bucket "order-photos" (private)
-- 2. Créer bucket "driver-documents" (private)
-- Voir STORAGE_POLICIES.md pour les policies à configurer via UI

-- ============================================
-- FIN DU SCRIPT PRINCIPAL
-- ============================================
