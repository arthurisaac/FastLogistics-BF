# 🔴 Correction : Email de confirmation au lieu d'OTP

## ❌ **Problème actuel**

Vous recevez un email avec un **lien de confirmation** :
```
Follow this link to confirm your user:
Confirm your mail (https://vtpfjngsxouyglqodkyh.supabase.co/auth/v1/verify?token=...)
```

**Au lieu d'un code OTP à 6 chiffres** comme : `123456`

---

## 🔧 **Solution : Désactiver la confirmation d'email**

### **Étape 1 : Configurer l'authentification Email dans Supabase**

1. **Allez sur** : 👉 **https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/providers**

2. **Cliquez sur la section "Email"**

3. **Modifiez les paramètres suivants** :

   ✅ **Enable Email provider** : **OUI** (coché)
   
   ❌ **Confirm email** : **NON** (décoché) ← **IMPORTANT !**
   
   ✅ **Enable email OTP** : **OUI** (coché si disponible)

4. **Cliquez sur "Save"** en bas de la page

---

### **Étape 2 : Vérifier les paramètres Email Template (optionnel)**

1. Allez sur : 👉 **https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/templates**

2. Vérifiez que le template **"Magic Link"** ou **"Email OTP"** est configuré

3. Le template devrait contenir `{{ .Token }}` pour afficher le code

---

### **Étape 3 : Tester à nouveau**

1. **Supprimez l'utilisateur de test** dans Supabase :
   - Allez sur : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/users
   - Trouvez `test@example.com`
   - Cliquez sur les 3 points ⋮ → **Delete user**

2. **Retournez sur la page d'inscription** :
   👉 https://3001-i3hj5orczbgrlqhtm968w-b32ec7bb.sandbox.novita.ai/register

3. **Inscrivez-vous à nouveau** avec un email :
   - Email : `test2@example.com`
   - Nom : `Test User`

4. **Vérifiez votre email** :
   - Vous devriez maintenant recevoir un **code à 6 chiffres**
   - Exemple : `Your code is: 123456`

---

## 🔄 **Alternative : Utiliser le lien Magic Link**

Si vous préférez utiliser le **lien de confirmation** (sans code OTP), vous pouvez modifier le code pour utiliser le **Magic Link** :

### **Option A : Cliquer sur le lien dans l'email**

1. Recevez l'email
2. Cliquez sur le lien
3. Vous serez automatiquement connecté

### **Option B : Modifier le code pour utiliser Magic Link**

Je peux modifier le code pour utiliser `signInWithOtp` avec `emailRedirectTo` au lieu de demander un code manuel.

**Voulez-vous que je modifie le code pour cette approche ?**

---

## 📊 **Comparaison des méthodes**

| Méthode | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Email OTP (code)** | ✅ Même expérience que SMS<br>✅ Code à 6 chiffres<br>✅ Pas de redirection | ⚠️ Nécessite "Confirm email" = OFF |
| **Magic Link** | ✅ Un seul clic<br>✅ Pas de code à saisir | ⚠️ Redirection requise<br>⚠️ Peut finir dans les spams |

---

## ✅ **Configuration recommandée pour OTP**

Dans **Auth → Providers → Email** :

```
✅ Enable Email provider : ON
❌ Confirm email : OFF  ← CRITIQUE pour recevoir un code OTP
✅ Secure email change : ON
✅ Enable email OTP : ON (si disponible)
```

---

## 🆘 **Si le problème persiste**

### **Solution de secours : Utiliser Magic Link au lieu d'OTP**

Si Supabase continue d'envoyer des liens au lieu de codes, on peut modifier l'approche :

1. **Supprimer l'étape de saisie du code**
2. **Envoyer un Magic Link**
3. **Rediriger l'utilisateur** après avoir cliqué sur le lien

Je peux modifier le code pour cette approche si nécessaire.

---

## 📝 **Checklist**

- [ ] Désactiver "Confirm email" dans Supabase
- [ ] Activer "Enable email OTP" si disponible
- [ ] Supprimer l'utilisateur de test
- [ ] Tester à nouveau l'inscription
- [ ] Vérifier que vous recevez un code à 6 chiffres

---

## 🔗 **Liens directs**

- 🔐 **Auth Providers** : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/providers
- 📧 **Email Templates** : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/templates
- 👥 **Users** : https://app.supabase.com/project/vtpfjngsxouyglqodkyh/auth/users

---

## 🎯 **Action immédiate**

**1. Désactivez "Confirm email"** dans les paramètres Email
**2. Supprimez l'utilisateur de test**
**3. Retestez l'inscription**

Si après ces étapes vous ne recevez toujours pas de code OTP, dites-le moi et je modifierai le code pour utiliser le Magic Link à la place ! 🚀
