# ⚡ QUICK START - Copy & Paste Commands

## 🚀 One-Time Setup (First Time Only)

### Step 1: Create Supabase Project

```
Go to: https://supabase.com/dashboard
Click: "New Project"
Choose region: eu-west-1 (for Africa/Europe)
Save your database password!
```

### Step 2: Run Database Script

```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy ALL content from: supabase/FRESH_DATABASE_SETUP.sql
4. Paste and click "Run"
5. Wait for success message
```

### Step 3: Get Credentials

```
Go to: Settings → API in Supabase Dashboard
Copy these 3 values:
- Project URL
- anon public key
- service_role key
```

### Step 4: Setup Environment

```powershell
# Windows PowerShell
Copy-Item .env.example .env

# Then edit .env and fill in:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key
# SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Step 5: Install & Run

```powershell
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

---

## 🔄 Daily Development Commands

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Lint code
npm run lint
```

---

## 📱 Mobile Development Commands

### Android

```powershell
# Build and sync to Android
npm run android:sync

# Open in Android Studio
npm run android

# Build release APK
npm run android:bundle

# Generate app icons
npm run assets:generate
```

### iOS (macOS only)

```powershell
# Build and sync to iOS
npm run ios:sync

# Open in Xcode
npm run ios
```

---

## 🗄️ Database Commands

### View Tables in Supabase

```
Dashboard → Table Editor
```

### Run SQL Queries

```
Dashboard → SQL Editor
```

### Common Queries

Check your organizations:

```sql
SELECT * FROM organizations;
```

Check your user profile:

```sql
SELECT * FROM user_profiles WHERE id = auth.uid();
```

Check subscription plans:

```sql
SELECT name, price_monthly_usd, regional_pricing
FROM subscription_plans
WHERE is_active = true;
```

Check products:

```sql
SELECT * FROM products
WHERE organization_id = (
  SELECT current_organization_id
  FROM user_profiles
  WHERE id = auth.uid()
);
```

Check RLS is working:

```sql
-- Should only show YOUR organization's data
SELECT * FROM sales;
```

---

## 🔑 PayPal Setup (When Ready for Payments)

### Get PayPal Sandbox Credentials

```
1. Go to: https://developer.paypal.com
2. Login/Sign up
3. Go to: Dashboard → My Apps & Credentials
4. Create new app: "Lenzro SaaS"
5. Copy Client ID and Secret
6. Add to .env:
   VITE_PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_secret
   VITE_PAYPAL_MODE=sandbox
```

---

## 🔥 Firebase Setup (For Push Notifications - Phase 2)

### Create Firebase Project

```
1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name: "Lenzro SaaS"
4. Disable Google Analytics (optional)
5. Click "Create project"
```

### Get Firebase Config

```
1. Project Overview → Settings (gear icon)
2. Scroll to "Your apps"
3. Click "</> Web"
4. Register app: "Lenzro Web"
5. Copy all config values
6. Add to .env:
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   (etc.)
```

### Enable Cloud Messaging

```
1. Project Overview → Build → Cloud Messaging
2. Click "Get started"
3. Copy Server Key
4. Add to .env:
   FIREBASE_SERVER_KEY=your_server_key
```

---

## 🧪 Testing Commands

### Create Test User

```
1. Open http://localhost:5173
2. Click "Sign Up"
3. Email: test@example.com
4. Password: Test123456!
5. Check email for verification
```

### Create Test Organization

```
After login:
1. Business Name: "Test Business"
2. Industry: "Retail"
3. Country: "Kenya"
4. Currency: "KES"
5. Choose "Free Starter" plan
```

### Add Test Products via SQL

```sql
-- Get your organization ID first
SELECT id FROM organizations WHERE owner_id = auth.uid();

-- Then insert products (replace YOUR_ORG_ID)
INSERT INTO products (organization_id, name, sku, selling_price, quantity)
VALUES
  ('YOUR_ORG_ID', 'Product 1', 'P001', 100, 50),
  ('YOUR_ORG_ID', 'Product 2', 'P002', 200, 30),
  ('YOUR_ORG_ID', 'Product 3', 'P003', 50, 100);
```

---

## 🐛 Troubleshooting Commands

### Clear Browser Data

```
Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Edge: Ctrl+Shift+Delete
```

### Reset Database (DANGER: Deletes all data!)

```sql
-- Run in Supabase SQL Editor
-- This will delete ALL your data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then run FRESH_DATABASE_SETUP.sql again
```

### Check Supabase Connection

```powershell
# In browser console (F12)
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

### Verify Node Version

```powershell
node --version
# Should be v18.x or higher
```

### Reinstall Dependencies

```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

---

## 📊 Monitoring Commands

### Check Supabase Usage

```
Dashboard → Settings → Usage
```

### View Logs

```
Dashboard → Logs → All logs
```

### Check API Calls

```
Dashboard → Settings → API
Scroll to "API Requests"
```

---

## 🚀 Deployment Commands (When Ready)

### Deploy to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
```

### Deploy to Netlify

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

---

## 📱 App Store Preparation (Phase 5)

### Android (Google Play)

```powershell
# Generate signed AAB
npm run android:bundle

# File location:
# android/app/build/outputs/bundle/release/app-release.aab
```

### iOS (App Store)

```bash
# macOS only
npm run ios

# In Xcode:
# Product → Archive
# Then upload to App Store Connect
```

---

## 🔐 Security Check Commands

### Check RLS Policies

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

### Test RLS Isolation

```sql
-- Create second user and verify they can't see your data
-- This should return 0 rows if RLS is working:
SELECT COUNT(*) FROM products
WHERE organization_id NOT IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
);
```

---

## 📚 Documentation Paths

```
# Setup guides
SETUP_GUIDE.md
SCRIPTS_TO_RUN.md
TRANSFORMATION_SUMMARY.md

# Phase guides
PHASE_2_MOBILE_DEVELOPMENT.md
PHASE_3_PAYMENT_INTEGRATION.md

# Database
supabase/FRESH_DATABASE_SETUP.sql

# Configuration
.env.example
capacitor.config.ts
package.json
```

---

## ⚡ Emergency Commands

### Stop All Processes

```powershell
# Stop dev server
Ctrl+C

# Kill all node processes (if stuck)
taskkill /F /IM node.exe
```

### Revert Git Changes

```powershell
# Undo all uncommitted changes
git reset --hard HEAD

# Restore specific file
git checkout HEAD -- path/to/file
```

### Contact Support

```
# Check these first:
1. Browser console (F12)
2. Terminal output
3. Supabase logs
4. GitHub issues

# Then create issue with:
- Error message
- Steps to reproduce
- Environment (OS, Node version)
- Screenshots
```

---

## ✅ Quick Checklist

Copy and check off:

```
Setup Phase:
□ Supabase project created
□ Database script ran successfully
□ .env file created and filled
□ npm install completed
□ npm run dev works
□ Can access localhost:5173

Testing Phase:
□ User registration works
□ Email verification received
□ Onboarding completed
□ Organization created
□ Products can be added
□ Sales can be created
□ RLS prevents cross-tenant access

Ready for Phase 2:
□ All basic features tested
□ No console errors
□ Database populated
□ Team members invited
□ Mobile build tested (optional)
```

---

## 🎯 Most Used Commands

```powershell
# Development (90% of the time)
npm run dev

# Building for mobile
npm run android:sync
npm run ios:sync

# Database management
# (Use Supabase Dashboard SQL Editor)

# Testing
npm run test
```

---

🚀 **You're all set!** Start with `npm run dev` and refer back to this guide as needed.

For detailed instructions, see:

- `SETUP_GUIDE.md` - Complete setup
- `SCRIPTS_TO_RUN.md` - Step-by-step scripts
- `TRANSFORMATION_SUMMARY.md` - Overview
