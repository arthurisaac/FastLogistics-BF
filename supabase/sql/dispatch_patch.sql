-- ============================================
-- FastLogistics BF - Dispatch Patch SQL
-- ============================================
-- Ce fichier contient les modifications supplémentaires pour le système de dispatch

-- Si la table dispatch_attempts n'existe pas encore, la créer
-- (normalement déjà créée dans main.sql)

-- Modifications supplémentaires pour améliorer le système d'acceptation

-- Ajouter une colonne pour tracking le nombre de tentatives d'un order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatch_round INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatch_started_at TIMESTAMPTZ;

-- Index supplémentaire pour performance dispatch
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_status ON public.orders(status, driver_id) WHERE driver_id IS NULL;

-- Fonction helper pour sélectionner les drivers candidats (appelée par Edge Function via service_role)
-- Cette fonction peut être utilisée par l'Edge Function pour obtenir la liste des drivers éligibles
CREATE OR REPLACE FUNCTION get_eligible_drivers_for_order(
  p_order_id UUID,
  p_max_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  driver_id UUID,
  profile_id UUID,
  vehicle_type TEXT,
  distance_km NUMERIC,
  rating NUMERIC,
  total_deliveries INTEGER,
  push_token TEXT
) AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_pickup_city_id UUID;
  v_vehicle_type TEXT;
BEGIN
  -- Récupérer l'ordre
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Extraire city_id du pickup_location
  v_pickup_city_id := (v_order.pickup_location->>'city_id')::UUID;
  v_vehicle_type := v_order.vehicle_type;
  
  -- Sélectionner les drivers candidats
  RETURN QUERY
  SELECT 
    d.id,
    d.profile_id,
    d.vehicle_type,
    0::NUMERIC as distance_km, -- TODO: calculer distance réelle avec PostGIS
    d.rating,
    d.total_deliveries,
    d.push_token
  FROM public.drivers d
  WHERE d.online_status = 'online'
    AND d.push_token IS NOT NULL
    AND d.vehicle_type = v_vehicle_type
    AND d.onboarding_completed = true
    AND (
      -- Van/Truck: vérifier dans driver_cities OU primary_city
      (d.vehicle_type IN ('van', 'truck') AND (
        EXISTS (
          SELECT 1 FROM public.driver_cities dc
          WHERE dc.driver_id = d.id AND dc.city_id = v_pickup_city_id AND dc.is_active = true
        ) OR d.primary_city_id = v_pickup_city_id
      ))
      OR
      -- Moto/Car: seulement primary_city
      (d.vehicle_type IN ('moto', 'car') AND d.primary_city_id = v_pickup_city_id)
    )
    -- Exclure les drivers qui ont déjà refusé cette commande
    AND NOT EXISTS (
      SELECT 1 FROM public.dispatch_attempts da
      WHERE da.order_id = p_order_id AND da.driver_id = d.id AND da.status = 'declined'
    )
  ORDER BY d.rating DESC, d.total_deliveries DESC
  LIMIT p_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant pour service_role uniquement (Edge Function)
REVOKE ALL ON FUNCTION get_eligible_drivers_for_order FROM PUBLIC;
-- La fonction sera appelée avec service_role key depuis Edge Function

-- Fonction pour marquer les tentatives expirées (appelée par Edge Function)
CREATE OR REPLACE FUNCTION expire_dispatch_attempts(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE public.dispatch_attempts
  SET status = 'expired'
  WHERE order_id = p_order_id
    AND status = 'sent'
    AND expires_at <= now();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION expire_dispatch_attempts FROM PUBLIC;

-- Amélioration de driver_accept_order pour gérer les cas edge
CREATE OR REPLACE FUNCTION driver_accept_order(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_driver_id UUID;
  v_order orders%ROWTYPE;
  v_dispatch_valid BOOLEAN;
  v_dispatch_attempt_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est un driver
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.profile_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non driver');
  END IF;
  
  -- Vérifier l'invitation valide (dispatch_attempts non expirée)
  SELECT da.id, (da.status = 'sent' AND da.expires_at > now()) INTO v_dispatch_attempt_id, v_dispatch_valid
  FROM public.dispatch_attempts da
  WHERE da.order_id = p_order_id
    AND da.driver_id = v_driver_id
  ORDER BY da.created_at DESC
  LIMIT 1;
  
  IF NOT v_dispatch_valid THEN
    RETURN json_build_object('success', false, 'message', 'Invitation invalide ou expirée');
  END IF;
  
  -- Vérifier l'ordre avec lock
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE NOWAIT;
  
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
  WHERE id = v_dispatch_attempt_id;
  
  -- Marquer les autres tentatives comme expired
  UPDATE public.dispatch_attempts
  SET status = 'expired'
  WHERE order_id = p_order_id AND id != v_dispatch_attempt_id AND status = 'sent';
  
  -- Event
  INSERT INTO public.order_events (order_id, event_type, description, metadata)
  VALUES (p_order_id, 'driver_assigned', 'Chauffeur assigné', json_build_object('driver_id', v_driver_id));
  
  -- Mettre driver en busy
  UPDATE public.drivers SET online_status = 'busy' WHERE id = v_driver_id;
  
  RETURN json_build_object('success', true, 'message', 'Commande acceptée');
EXCEPTION
  WHEN lock_not_available THEN
    RETURN json_build_object('success', false, 'message', 'Commande en cours d''assignation par un autre driver');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Erreur: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le grant
GRANT EXECUTE ON FUNCTION driver_accept_order TO authenticated;

-- ============================================
-- FIN DU PATCH DISPATCH
-- ============================================
