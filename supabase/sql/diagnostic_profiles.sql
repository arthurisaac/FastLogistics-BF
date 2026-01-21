-- ============================================
-- DIAGNOSTIC : Vérifier si le profil existe
-- ============================================

-- 1. Voir tous les users Supabase Auth
SELECT 
  id,
  email,
  phone,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Voir tous les profils dans la table profiles
SELECT 
  id,
  email,
  phone,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Trouver les users sans profil (AUTH mais pas PROFILE)
SELECT 
  u.id,
  u.email,
  u.phone,
  u.created_at,
  'NO PROFILE' as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Vérifier l'ID spécifique de l'erreur
SELECT * FROM auth.users WHERE id = 'b295a84d-651b-4eae-851a-3046e90543e8';
SELECT * FROM public.profiles WHERE id = 'b295a84d-651b-4eae-851a-3046e90543e8';
