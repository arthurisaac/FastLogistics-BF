#!/bin/bash

# Script de vérification des clés Supabase
# Usage: ./check-supabase-keys.sh

echo "🔍 Vérification des clés Supabase..."
echo ""

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env introuvable !"
    echo "   Créer .env depuis .env.example"
    exit 1
fi

# Extraire la clé
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

if [ -z "$ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY manquante dans .env"
    exit 1
fi

echo "✅ Clé trouvée dans .env"
echo ""

# Décoder le JWT (payload seulement)
# Format JWT : header.payload.signature
PAYLOAD=$(echo $ANON_KEY | cut -d '.' -f2)

# Ajouter padding si nécessaire
case $((${#PAYLOAD} % 4)) in
    2) PAYLOAD="${PAYLOAD}==" ;;
    3) PAYLOAD="${PAYLOAD}=" ;;
esac

# Décoder base64
DECODED=$(echo $PAYLOAD | base64 -d 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "⚠️  Impossible de décoder la clé JWT"
    echo "   Vérifier que c'est bien une clé valide"
    exit 1
fi

echo "📄 Payload JWT décodé :"
echo "$DECODED" | python3 -m json.tool 2>/dev/null || echo "$DECODED"
echo ""

# Vérifier le rôle
if echo "$DECODED" | grep -q '"role":"anon"'; then
    echo "✅ CLÉ CORRECTE : Type 'anon' (publique)"
    echo "   ✓ Peut être utilisée dans le frontend"
    echo "   ✓ Respecte les RLS policies"
    exit 0
elif echo "$DECODED" | grep -q '"role":"service_role"'; then
    echo "❌ CLÉ INCORRECTE : Type 'service_role' (secrète)"
    echo "   ✗ NE DOIT PAS être utilisée dans le frontend !"
    echo "   ✗ Bypass toute la sécurité RLS !"
    echo ""
    echo "🔧 SOLUTION :"
    echo "   1. Aller sur https://app.supabase.com/project/vtpfjngsxouyglqodkyh/settings/api"
    echo "   2. Copier la clé 'anon public' (pas 'service_role')"
    echo "   3. Remplacer dans .env"
    echo "   4. Redémarrer le serveur (npm run dev)"
    exit 1
else
    echo "⚠️  Type de clé inconnu"
    echo "   Vérifier manuellement sur jwt.io"
    exit 1
fi
