# 🔐 Guide de Déploiement Edge Function - FastLogistics BF

## ❌ Problème Rencontré

```
unexpected deploy status 401: {"message":"Unauthorized"}
```

Cela signifie que **Supabase CLI n'est pas authentifié** avec votre projet.

---

## ✅ Solution : Authentification Supabase

### Étape 1 : Login Supabase

```bash
npx supabase login
```

Cela va ouvrir votre navigateur pour vous connecter à Supabase. Si le navigateur ne s'ouvre pas automatiquement, copiez l'URL affichée et ouvrez-la manuellement.

**OU** si vous avez déjà un Access Token :

```bash
npx supabase login --token YOUR_ACCESS_TOKEN
```

### Étape 2 : Récupérer votre Access Token

Si vous n'avez pas d'Access Token :

1. Aller sur https://app.supabase.com/account/tokens
2. Cliquer sur **"Generate New Token"**
3. Nom du token : `cli-deployment`
4. Copier le token généré
5. Exécuter :

```bash
npx supabase login --token sbp_VOTRE_TOKEN_ICI
```

### Étape 3 : Lier votre Projet

Une fois authentifié, lier votre projet :

```bash
npx supabase link --project-ref vtpfjngsxouyglqodkyh
```

(Votre project ref : **vtpfjngsxouyglqodkyh**)

### Étape 4 : Déployer la Fonction

Maintenant vous pouvez déployer :

```bash
npx supabase functions deploy dispatch-order
```

---

## 📝 Commandes Complètes (À Exécuter dans l'Ordre)

```bash
# 1. Login (choisir une option)

# Option A : Login interactif (recommandé)
npx supabase login

# Option B : Login avec token
npx supabase login --token sbp_VOTRE_TOKEN_ICI


# 2. Lier le projet
npx supabase link --project-ref vtpfjngsxouyglqodkyh


# 3. Déployer la fonction
npx supabase functions deploy dispatch-order


# 4. (Optionnel) Configurer les secrets
npx supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

---

## 🔍 Vérifier l'Authentification

Pour vérifier que vous êtes bien authentifié :

```bash
# Vérifier le statut de connexion
npx supabase projects list

# Devrait afficher la liste de vos projets Supabase
```

---

## 🎯 Alternative : Déploiement via Supabase Dashboard

Si les commandes CLI ne fonctionnent pas, vous pouvez déployer manuellement :

### Option 1 : Via Dashboard (Interface Web)

1. Aller sur https://app.supabase.com/project/vtpfjngsxouyglqodkyh/functions
2. Cliquer sur **"Create a new function"**
3. Nom : `dispatch-order`
4. Copier-coller le contenu de `supabase/functions/dispatch-order/index.ts`
5. Déployer

### Option 2 : Créer un fichier ZIP

```bash
# Créer un ZIP de la fonction
cd /home/user/webapp
zip -r dispatch-order.zip supabase/functions/dispatch-order supabase/functions/_shared

# Uploader ce ZIP via le Dashboard
```

---

## 🔐 Où Trouver votre Access Token ?

### Méthode 1 : Via Supabase Dashboard

1. **Se connecter** : https://app.supabase.com
2. **Aller dans Account Settings** : Cliquer sur votre avatar (en haut à droite) → **"Account Settings"**
3. **Access Tokens** : https://app.supabase.com/account/tokens
4. **Generate New Token** :
   - Name : `cli-deployment`
   - Scopes : Sélectionner **"All"** ou au minimum **"functions:write"**
5. **Copier le token** : Il commence par `sbp_`

### Méthode 2 : Via Supabase CLI (Login Interactif)

```bash
npx supabase login
```

Cette commande va :
1. Ouvrir votre navigateur
2. Vous connecter à Supabase
3. Autoriser le CLI
4. Stocker automatiquement le token

---

## 🐛 Troubleshooting

### Erreur : "Cannot connect to the Docker daemon"

C'est **normal** - Docker n'est pas nécessaire pour déployer les Edge Functions. Ignorez cet avertissement.

### Erreur : "Project not found"

Vérifiez votre Project Ref :

```bash
# Votre Project Ref est : vtpfjngsxouyglqodkyh
npx supabase link --project-ref vtpfjngsxouyglqodkyh
```

### Erreur : "Token expired"

Votre token a expiré. Générez-en un nouveau :

1. https://app.supabase.com/account/tokens
2. Révoquer l'ancien token
3. Générer un nouveau
4. Re-login : `npx supabase login --token NEW_TOKEN`

---

## ✅ Vérifier le Déploiement

Une fois déployé, vérifier que la fonction fonctionne :

### Via Dashboard

1. https://app.supabase.com/project/vtpfjngsxouyglqodkyh/functions
2. Vous devriez voir **dispatch-order** dans la liste
3. Cliquer dessus pour voir les logs

### Via CLI

```bash
# Voir les logs
npx supabase functions logs dispatch-order

# Tester la fonction
npx supabase functions invoke dispatch-order \
  --data '{"order_id":"test-uuid","dry_run":true}'
```

---

## 📚 Documentation Supabase CLI

- **Guide officiel** : https://supabase.com/docs/guides/cli
- **Edge Functions** : https://supabase.com/docs/guides/functions
- **Authentication** : https://supabase.com/docs/guides/cli/local-development#log-in-with-your-personal-access-token

---

## 🎯 Récapitulatif

Pour déployer avec succès :

1. ✅ **Login** : `npx supabase login`
2. ✅ **Link** : `npx supabase link --project-ref vtpfjngsxouyglqodkyh`
3. ✅ **Deploy** : `npx supabase functions deploy dispatch-order`
4. ✅ **Secrets** : `npx supabase secrets set FCM_SERVER_KEY=xxx`
5. ✅ **Test** : Vérifier les logs dans le Dashboard

---

## 🆘 Besoin d'Aide ?

Si les commandes CLI ne fonctionnent toujours pas :

1. **Utilisez le Dashboard** : Plus simple et visuel
2. **Vérifiez les permissions** : Votre compte a-t-il les droits sur le projet ?
3. **Vérifiez le Project Ref** : `vtpfjngsxouyglqodkyh` est-il correct ?

---

**Bon déploiement ! 🚀**
