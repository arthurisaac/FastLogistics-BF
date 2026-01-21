-- ============================================
-- FastLogistics BF - Seeds Data
-- ============================================
-- Données de test pour développement local

-- ============================================
-- 1. CITIES
-- ============================================

INSERT INTO public.cities (id, name, slug, latitude, longitude, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Ouagadougou', 'ouagadougou', 12.3714, -1.5197, true),
('22222222-2222-2222-2222-222222222222', 'Bobo-Dioulasso', 'bobo-dioulasso', 11.1770, -4.2979, true),
('33333333-3333-3333-3333-333333333333', 'Koudougou', 'koudougou', 12.2525, -2.3650, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. TEST USERS (via Supabase Auth)
-- ============================================
-- IMPORTANT: Ces users doivent être créés via Supabase Auth Dashboard ou API
-- Les UUIDs ci-dessous sont des exemples - remplacez par les vrais UUIDs après création

-- Customer test: phone +226 70 00 00 01
-- Driver test: phone +226 70 00 00 02
-- Admin test: phone +226 70 00 00 03

-- Après création via Auth, insérer les profiles:

-- Customer profile
INSERT INTO public.profiles (id, phone, full_name, role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+22670000001', 'Jean Dupont', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Driver profile
INSERT INTO public.profiles (id, phone, full_name, role) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '+22670000002', 'Amadou Traoré', 'driver')
ON CONFLICT (id) DO NOTHING;

-- Admin profile
INSERT INTO public.profiles (id, phone, full_name, role) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '+22670000003', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. DRIVER
-- ============================================

INSERT INTO public.drivers (
  id,
  profile_id,
  vehicle_type,
  vehicle_plate,
  vehicle_model,
  primary_city_id,
  is_verified,
  onboarding_completed,
  online_status,
  push_token
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'moto',
  'BF-123-ABC',
  'Honda XR 150',
  '11111111-1111-1111-1111-111111111111', -- Ouagadougou
  true,
  true,
  'online',
  'test_push_token_123'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. TEST ORDER
-- ============================================

-- Exemple de commande (pending)
INSERT INTO public.orders (
  id,
  customer_id,
  service_type,
  vehicle_type,
  pickup_location,
  dropoff_location,
  cargo,
  status,
  estimated_price,
  payment_method,
  cash_at_pickup,
  cash_at_delivery
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'standard',
  'moto',
  '{
    "address": "Avenue de la Nation, Ouagadougou",
    "city_id": "11111111-1111-1111-1111-111111111111",
    "latitude": 12.3714,
    "longitude": -1.5197,
    "contact_name": "Jean Dupont",
    "contact_phone": "+22670000001"
  }'::jsonb,
  '{
    "address": "Rue de la Liberté, Ouagadougou",
    "city_id": "11111111-1111-1111-1111-111111111111",
    "latitude": 12.3800,
    "longitude": -1.5100,
    "contact_name": "Marie Kaboré",
    "contact_phone": "+22670999999"
  }'::jsonb,
  '{
    "description": "Petit colis - Documents",
    "weight": 0.5,
    "dimensions": {"length": 30, "width": 20, "height": 5},
    "fragile": false,
    "value": 5000
  }'::jsonb,
  'pending',
  1500.00,
  'cash',
  0.00,
  1500.00
)
ON CONFLICT (id) DO NOTHING;

-- Event initial
INSERT INTO public.order_events (order_id, event_type, description) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'created', 'Commande créée')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- Pour créer les users test dans Supabase Auth:
-- 1. Aller dans Authentication > Users dans Supabase Dashboard
-- 2. Créer les users avec les téléphones ci-dessus
-- 3. Copier les UUIDs générés
-- 4. Remplacer les UUIDs dans ce fichier
-- 5. Réexécuter ce script

-- Ou via API:
/*
const { data, error } = await supabase.auth.signUp({
  phone: '+22670000001',
  password: 'test123456'
})
*/
