# 🗂️ Storage Policies Configuration Guide

Ce guide explique comment configurer les Storage policies via l'UI Supabase.

> ⚠️ **IMPORTANT**: Les policies pour `storage.objects` ne peuvent pas être créées de manière fiable via SQL. Utilisez l'interface Supabase Dashboard.

## 📦 Buckets à créer

### 1. Bucket: `order-photos` (Private)

**Objectif**: Stocker les photos des commandes (pickup, delivery/POD, dommages)

**Configuration**:
- Nom: `order-photos`
- Public: ❌ Non (Private)
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Policies à créer via UI**:

#### Policy 1: READ - Participants peuvent voir les photos

```
Policy name: Participants can view order photos
Operation: SELECT
Target roles: authenticated

USING expression:
EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = (storage.foldername(name))[1]::uuid
  AND (
    o.customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = o.driver_id AND d.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
)
```

#### Policy 2: INSERT - Participants peuvent uploader

```
Policy name: Participants can upload order photos
Operation: INSERT
Target roles: authenticated

WITH CHECK expression:
EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = (storage.foldername(name))[1]::uuid
  AND (
    o.customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = o.driver_id AND d.profile_id = auth.uid()
    )
  )
)
```

#### Policy 3: UPDATE - Admin only

```
Policy name: Admin can update order photos
Operation: UPDATE
Target roles: authenticated

USING expression:
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

#### Policy 4: DELETE - Admin only

```
Policy name: Admin can delete order photos
Operation: DELETE
Target roles: authenticated

USING expression:
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

### 2. Bucket: `driver-documents` (Private)

**Objectif**: Stocker les documents des drivers (permis, carte grise, assurance, photo)

**Configuration**:
- Nom: `driver-documents`
- Public: ❌ Non (Private)
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

**Policies à créer via UI**:

#### Policy 1: READ - Driver owner + Admin

```
Policy name: Driver can view own documents
Operation: SELECT
Target roles: authenticated

USING expression:
(storage.foldername(name))[1]::uuid IN (
  SELECT d.profile_id FROM public.drivers d WHERE d.profile_id = auth.uid()
)
OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

#### Policy 2: INSERT - Driver owner

```
Policy name: Driver can upload own documents
Operation: INSERT
Target roles: authenticated

WITH CHECK expression:
(storage.foldername(name))[1]::uuid = auth.uid()
AND EXISTS (
  SELECT 1 FROM public.drivers d WHERE d.profile_id = auth.uid()
)
```

#### Policy 3: UPDATE - Admin only

```
Policy name: Admin can update driver documents
Operation: UPDATE
Target roles: authenticated

USING expression:
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

#### Policy 4: DELETE - Driver owner + Admin

```
Policy name: Driver can delete own documents
Operation: DELETE
Target roles: authenticated

USING expression:
(storage.foldername(name))[1]::uuid = auth.uid()
AND EXISTS (
  SELECT 1 FROM public.drivers d WHERE d.profile_id = auth.uid()
)
OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

## 📝 Structure des paths

### order-photos

```
order-photos/
  {order_id}/
    pickup_123.jpg
    delivery_456.jpg (POD)
    damage_789.jpg
```

### driver-documents

```
driver-documents/
  {profile_id}/
    license.pdf
    vehicle_registration.pdf
    insurance.pdf
    photo.jpg
```

---

## ✅ Vérification

Après avoir créé les policies, vérifiez:

1. **Upload test**: Un driver peut uploader son permis
2. **Download test**: Le driver peut télécharger son propre document
3. **Privacy test**: Un driver ne peut PAS voir les documents d'un autre driver
4. **Admin test**: Un admin peut voir tous les documents

---

## 🔧 Commandes utiles (depuis le code)

```typescript
// Upload photo POD
const { data, error } = await supabase.storage
  .from('order-photos')
  .upload(`${orderId}/delivery_${Date.now()}.jpg`, file)

// Download photo
const { data } = await supabase.storage
  .from('order-photos')
  .getPublicUrl(`${orderId}/delivery_123.jpg`)

// List photos d'une commande
const { data, error } = await supabase.storage
  .from('order-photos')
  .list(orderId)
```

---

## 📚 Ressources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
