# 🧪 Guide de test - Authentification Magic Link

## 🎯 **Ce qui a été modifié**

✅ **Nouveau système d'authentification par Magic Link (email)**
- Plus besoin de saisir un code OTP à 6 chiffres
- Un simple clic sur le lien dans l'email suffit
- Compatible avec Supabase gratuit
- Expérience utilisateur plus fluide

---

## 🚀 **Test 1 : Inscription d'un nouveau client**

### **Étape 1 : Ouvrir la page d'inscription**

🔗 **URL** : https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/register

### **Étape 2 : Remplir le formulaire**

- **Nom complet** : `Jean Dupont`
- **Email** : `votreemail@example.com` (utilisez votre vrai email)
- **Type de compte** : Cliquez sur **Client** 👤

### **Étape 3 : Soumettre le formulaire**

Cliquez sur **"Créer mon compte"**

### **Étape 4 : Confirmation à l'écran**

Vous devriez voir :
```
📧 Email envoyé !
Vérifiez votre boîte email
Nous avons envoyé un lien de connexion à votreemail@example.com

Étapes suivantes :
1. Ouvrez votre boîte email
2. Cliquez sur le lien "Log In"
3. Vous serez automatiquement connecté
```

### **Étape 5 : Vérifier votre email**

1. Ouvrez votre boîte email
2. Cherchez un email de **Supabase** ou **no-reply@supabase.io**
3. **⚠️ Si vous ne le voyez pas** : Vérifiez vos **spams** !

L'email ressemble à :
```
Sujet: Magic Link

Follow this link to login:

[Log In] https://vtpfjngsxouyglqodkyh.supabase.co/auth/v1/verify?token=...
```

### **Étape 6 : Cliquer sur le lien**

1. Cliquez sur le bouton **"Log In"** dans l'email
2. Votre navigateur va s'ouvrir
3. **✅ Vous serez automatiquement connecté et redirigé vers `/dashboard`**

### **✅ Résultat attendu**

- Vous êtes connecté
- Vous voyez le **Dashboard Client**
- Votre profil est créé dans la base de données

---

## 🚀 **Test 2 : Inscription d'un nouveau chauffeur**

### **Étape 1 : Ouvrir la page d'inscription**

🔗 **URL** : https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/register

### **Étape 2 : Remplir le formulaire**

- **Nom complet** : `Pierre Martin`
- **Email** : `chauffeur@example.com`
- **Type de compte** : Cliquez sur **Chauffeur** 🚚

**Champs supplémentaires pour chauffeur** :
- **Type de véhicule** : 🏍️ Moto
- **Plaque d'immatriculation** : `BF-123-ABC`
- **Ville principale** : Sélectionnez `Ouagadougou`

### **Étape 3 : Soumettre et vérifier l'email**

(Même processus que pour le client)

### **✅ Résultat attendu**

- Vous êtes connecté
- Vous voyez le **Dashboard Chauffeur**
- Votre profil **ET** votre fiche chauffeur sont créés
- Votre véhicule est enregistré

---

## 🚀 **Test 3 : Connexion d'un utilisateur existant**

### **Étape 1 : Aller sur la page de connexion**

🔗 **URL** : https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/login

### **Étape 2 : Entrer votre email**

- **Email** : `votreemail@example.com` (utilisez un email déjà inscrit)

### **Étape 3 : Cliquer sur "Envoyer le lien"**

### **Étape 4 : Vérifier votre email et cliquer sur le lien**

(Même processus que pour l'inscription)

### **✅ Résultat attendu**

- Vous êtes connecté
- Vous êtes redirigé vers le dashboard approprié (client ou chauffeur)

---

## 🔍 **Vérification dans la base de données**

### **Vérifier les profils créés**

1. Allez sur : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/editor

2. Cliquez sur la table **`profiles`**

3. Vous devriez voir vos utilisateurs :
   - `id` : UUID Supabase
   - `full_name` : Jean Dupont, Pierre Martin
   - `email` : Les emails utilisés
   - `role` : customer ou driver

### **Vérifier les chauffeurs**

1. Cliquez sur la table **`drivers`**

2. Vous devriez voir :
   - `profile_id` : UUID correspondant au profil
   - `vehicle_type` : moto
   - `vehicle_plate` : BF-123-ABC
   - `primary_city_id` : ID de Ouagadougou

---

## 🐛 **Dépannage**

### ❌ **Problème : Je ne reçois pas l'email**

**Solutions** :

1. **Vérifiez vos spams** (90% des cas)

2. **Vérifiez que Email provider est activé** :
   - Allez sur : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/providers
   - Section **Email** doit être **ON**
   - **Confirm email** doit être **OFF**

3. **Vérifiez les logs Supabase** :
   - Allez sur : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/logs/explorer
   - Filtrez par "auth"

4. **Utilisez un autre email** :
   - Gmail, Outlook, etc.
   - Évitez les emails temporaires

### ❌ **Problème : Le lien ne fonctionne pas**

**Causes possibles** :

1. **Le lien a expiré** (1 heure de validité)
   - Solution : Demandez un nouveau lien

2. **Le lien a déjà été utilisé** (usage unique)
   - Solution : Demandez un nouveau lien

3. **Erreur de redirection**
   - Vérifiez l'URL de redirection dans Supabase
   - Allez sur : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/url-configuration
   - **Redirect URLs** doit contenir :
     - `http://localhost:3000/*`
     - `http://localhost:3001/*`
     - `https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/*`

### ❌ **Problème : Erreur lors de la création du profil**

**Vérifications** :

1. **La base de données est-elle configurée ?**
   - Les tables `profiles` et `drivers` existent ?
   - Les triggers sont actifs ?
   - Les RLS policies permettent l'insertion ?

2. **Vérifiez la console du navigateur** (F12 → Console)
   - Y a-t-il des erreurs JavaScript ?
   - Y a-t-il des erreurs d'API ?

3. **Vérifiez les Network requests** (F12 → Network)
   - Les requêtes vers Supabase réussissent ?
   - Status code 200 ou erreur ?

---

## 📊 **Checklist de test complète**

### **Inscription Client**
- [ ] Page d'inscription accessible
- [ ] Formulaire rempli (nom, email, type Client)
- [ ] Email de Magic Link reçu
- [ ] Clic sur le lien dans l'email
- [ ] Redirection vers `/dashboard`
- [ ] Profil créé dans `profiles` (role: customer)

### **Inscription Chauffeur**
- [ ] Page d'inscription accessible
- [ ] Formulaire rempli (+ véhicule, plaque, ville)
- [ ] Email de Magic Link reçu
- [ ] Clic sur le lien dans l'email
- [ ] Redirection vers `/driver/dashboard`
- [ ] Profil créé dans `profiles` (role: driver)
- [ ] Fiche créée dans `drivers` avec véhicule

### **Connexion**
- [ ] Page de connexion accessible
- [ ] Email entré
- [ ] Magic Link reçu
- [ ] Clic sur le lien
- [ ] Redirection vers le bon dashboard
- [ ] Session active

### **Vérification BDD**
- [ ] Table `profiles` contient les utilisateurs
- [ ] Table `drivers` contient les chauffeurs
- [ ] Les `id` correspondent entre les tables

---

## 🔗 **Liens utiles**

| Ressource | URL |
|-----------|-----|
| **App (Inscription)** | https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/register |
| **App (Connexion)** | https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/login |
| **Supabase Auth Providers** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/providers |
| **Supabase Users** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/users |
| **Supabase Database** | https://app.supabase.com/project/vtpfjngsxouyglqodkyh/editor |
| **GitHub Repo** | https://github.com/arthurisaac/FastLogistics-BF |

---

## 📝 **Notes importantes**

1. **Les Magic Links expirent après 1 heure**
2. **Chaque lien ne peut être utilisé qu'une fois**
3. **Pas besoin de mot de passe** (authentification sans mot de passe)
4. **Les données d'inscription sont stockées temporairement** dans localStorage
5. **Le profil est créé automatiquement** après le clic sur le lien

---

## 🎉 **Prochaines étapes**

Une fois les tests réussis :

1. ✅ Tester la déconnexion
2. ✅ Tester la reconnexion
3. ✅ Tester les différentes pages du dashboard
4. ✅ Tester les fonctionnalités métier (commandes, livraisons, etc.)

**Bonne chance avec les tests ! 🚀**
