# ⚡ FastLogistics BF - Quick Commands Reference

## 🚀 Start Here (First Time)

```bash
# 1. Clone and install
git clone <repo-url>
cd webapp
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start development
npm run dev
# Open http://localhost:3000
```

---

## 📝 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Clean port 3000
npm run clean-port
```

---

## 🗄️ Database Setup (Supabase Dashboard)

```sql
-- 1. Execute in SQL Editor
-- Copy-paste: supabase/sql/main.sql

-- 2. Execute dispatch patch
-- Copy-paste: supabase/sql/dispatch_patch.sql

-- 3. (Optional) Load test data
-- Copy-paste: supabase/sql/seeds.sql
```

---

## 🪣 Storage Setup (Supabase Dashboard)

```bash
# 1. Create buckets (Storage > New bucket)
Bucket name: order-photos (Private)
Bucket name: driver-documents (Private)

# 2. Configure policies
# Follow: supabase/STORAGE_POLICIES.md
```

---

## ☁️ Edge Functions (Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Link project
npx supabase link --project-ref your-project-ref

# Deploy dispatch function
npx supabase functions deploy dispatch-order

# Set secrets
npx supabase secrets set FCM_SERVER_KEY=your-fcm-key

# View logs
npx supabase functions logs dispatch-order
```

---

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# First deploy
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GOOGLE_MAPS_API_KEY

# Rollback (if needed)
vercel rollback
```

---

## 🚢 Deployment (Netlify)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

## 🧪 Testing

```bash
# Test local build
npm run build && npm run preview

# Test with curl
curl http://localhost:3000

# Test dispatch function (local)
curl -X POST http://localhost:54321/functions/v1/dispatch-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "order_id": "uuid-here",
    "dry_run": true
  }'
```

---

## 🔍 Debugging

```bash
# Check Supabase logs
# Dashboard > Database > Logs
# Dashboard > Edge Functions > Logs

# Check browser console
# F12 > Console (for errors)

# Check IndexedDB
# F12 > Application > IndexedDB > fastlogistics-bf

# Check service worker
# F12 > Application > Service Workers

# Check network
# F12 > Network (filter by supabase.co)
```

---

## 🐛 Common Issues

### "Invalid API key"
```bash
# Check .env file
cat .env
# Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
```

### "Table does not exist"
```bash
# Execute main.sql in Supabase SQL Editor
```

### "RLS policy violated"
```bash
# Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
# All should have rowsecurity = true
```

### Port 3000 in use
```bash
npm run clean-port
# or
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Monitoring

### Supabase Dashboard

```
Database Usage:
└── Database > Usage

API Requests:
└── Database > API Logs

Edge Function Invocations:
└── Edge Functions > Logs

Auth Events:
└── Authentication > Logs
```

### Vercel Dashboard

```
Deployments:
└── Deployments tab

Analytics:
└── Analytics tab (if enabled)

Logs:
└── Deployment > View Function Logs
```

---

## 🔐 Security Checks

```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Check admin count
SELECT COUNT(*) FROM profiles WHERE role = 'admin';

-- Check online drivers
SELECT COUNT(*) FROM drivers WHERE online_status = 'online';
```

---

## 📈 Performance

```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Bundle analyzer
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts

# Check bundle size
npm run build
ls -lh dist/assets/
```

---

## 🆘 Emergency

### Rollback deployment
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

### Disable dispatch function
```bash
# Delete or pause in Supabase Dashboard
# Edge Functions > dispatch-order > Settings > Pause
```

### Mark orders as failed
```sql
UPDATE orders
SET status = 'no_driver_found'
WHERE status = 'confirmed' AND created_at < NOW() - INTERVAL '1 hour';
```

---

## 📚 Documentation

- **README.md** : Documentation principale
- **QUICKSTART.md** : Installation en 15min
- **DEPLOYMENT.md** : Guide déploiement production
- **PROJECT_SUMMARY.md** : Résumé technique complet
- **supabase/STORAGE_POLICIES.md** : Configuration Storage

---

## 🔗 Useful Links

- **Supabase Dashboard** : https://app.supabase.com
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Netlify Dashboard** : https://app.netlify.com
- **Firebase Console** : https://console.firebase.google.com
- **Tailwind Docs** : https://tailwindcss.com/docs
- **React Router** : https://reactrouter.com

---

## 🎯 Typical Workflow

### New Feature Development

```bash
# 1. Create branch
git checkout -b feature/new-feature

# 2. Develop
npm run dev

# 3. Test
npm run type-check
npm run lint
npm run build

# 4. Commit
git add .
git commit -m "feat: new feature description"

# 5. Push and PR
git push origin feature/new-feature
```

### Database Schema Change

```bash
# 1. Write migration SQL
# supabase/sql/migration_YYYYMMDD.sql

# 2. Test locally in Supabase SQL Editor

# 3. Apply to production
# Execute in production SQL Editor

# 4. Document
# Update README.md if needed
```

### Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix
# ... make changes ...

# 3. Deploy immediately
vercel --prod

# 4. Commit and merge
git commit -m "fix: critical bug"
git push origin hotfix/critical-bug
# Merge to main
```

---

**📱 FastLogistics BF - Ready to Code! 🚀**
