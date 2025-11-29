# 📋 COMPLETE SCRIPTS TO RUN - Step by Step

## 🎯 Overview

This document contains **ALL** the scripts you need to run for your new Supabase project, in the **exact order** you should run them.

---

## ✅ STEP 1: Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Select or create
   - **Name**: `lenzro-saas` (or your preferred name)
   - **Database Password**: Generate a strong password and **save it securely!**
   - **Region**: Choose closest to your target users:
     - `eu-west-1` - Ireland (for Europe/Africa)
     - `us-east-1` - Virginia (for Americas)
     - `ap-southeast-1` - Singapore (for Asia)
   - **Pricing Plan**: Free (to start)
4. Click **"Create new project"**
5. ⏳ Wait 2-3 minutes for project to be ready

---

## ✅ STEP 2: Run Main Database Setup Script

### 2.1: Open SQL Editor

1. In your Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### 2.2: Copy and Run the Setup Script

1. Open the file: `supabase/FRESH_DATABASE_SETUP.sql`
2. **Select ALL content** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into the Supabase SQL Editor
5. Click **"Run"** button (or press Ctrl/Cmd + Enter)
6. ⏳ Wait ~30 seconds for execution

### 2.3: Verify Success

You should see a message like:

```
╔══════════════════════════════════════════════════════╗
║   LENZRO SAAS PLATFORM - DATABASE SETUP COMPLETE!   ║
╚══════════════════════════════════════════════════════╝

✅ All tables created successfully
✅ Row Level Security (RLS) enabled
✅ Default subscription plans added
✅ Functions and triggers configured
✅ Indexes created for performance
✅ Storage buckets configured
```

### 2.4: What This Script Created

- **17 database tables**:

  - `organizations` - Your tenants/businesses
  - `organization_members` - Team members
  - `user_profiles` - User information
  - `subscription_plans` - Pricing tiers
  - `subscriptions` - Active subscriptions
  - `payment_transactions` - Payment history
  - `usage_tracking` - Usage monitoring
  - `invitations` - Team invites
  - `audit_logs` - Activity logs
  - `products` - Products/services
  - `sales` - Sales transactions
  - `returns` - Returns
  - `orders` - Customer orders
  - `expenses` - Business expenses
  - `customer_credits` - Credits/loyalty
  - `locations` - Multiple locations

- **Row Level Security (RLS)**: Complete tenant isolation
- **3 Subscription Plans**: Free, Basic ($29/mo), Premium ($99/mo)
- **Functions**: Helper functions for common operations
- **Triggers**: Auto-update timestamps
- **Indexes**: Performance optimization
- **Storage Buckets**: For images and files

---

## ✅ STEP 3: Configure Authentication

### 3.1: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** provider (should be enabled by default)
3. Verify it's **ON** (toggle should be green)

### 3.2: Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:5173`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:5173/**
   https://*.vercel.app/**
   capacitor://localhost/**
   ```

### 3.3: (Optional) Enable Social Login

For Google login:

1. Go to **Authentication** → **Providers**
2. Find **Google**
3. Toggle **ON**
4. Enter your Google OAuth credentials

---

## ✅ STEP 4: Get Your API Credentials

### 4.1: Copy Project Credentials

1. Go to **Settings** → **API**
2. Copy these three values:

```
Project URL:        https://xxxxx.supabase.co
anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**:

- The `anon key` is safe for client-side use
- The `service_role key` must be kept **SECRET** (never in frontend code!)

---

## ✅ STEP 5: Configure Environment Variables

### 5.1: Create .env File

In your project root, run:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

### 5.2: Fill in Supabase Credentials

Open `.env` and add your credentials:

```env
# REQUIRED: Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key
```

### 5.3: Set App Defaults

```env
# App Configuration
VITE_APP_NAME=Lenzro
VITE_DEFAULT_CURRENCY=KES
VITE_DEFAULT_COUNTRY=KE
VITE_DEFAULT_TIMEZONE=Africa/Nairobi
```

---

## ✅ STEP 6: Install Dependencies

Run in your project root:

```bash
npm install
```

This installs:

- React 18
- Supabase client
- Capacitor (for mobile)
- TailwindCSS
- All other dependencies

---

## ✅ STEP 7: Start Development Server

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

You should see the Lenzro login page! 🎉

---

## ✅ STEP 8: Test the Setup

### 8.1: Create Your First User

1. Click **"Sign Up"**
2. Enter email and password
3. Check your email for verification link
4. Click the link to verify your email

### 8.2: Complete Onboarding

After login, you'll see a 3-step onboarding:

**Step 1: Create Organization**

- Business Name: `My Test Business`
- Industry: Choose any (e.g., `Retail`)
- Country: `Kenya`
- Currency: `KES`

**Step 2: Choose Plan**

- Select **Free Starter** (for testing)

**Step 3: Invite Team (Optional)**

- Skip for now or invite team members

### 8.3: Verify Database

Go back to Supabase Dashboard → **Table Editor**

Check these tables have data:

- `user_profiles` - Should have your user
- `organizations` - Should have your organization
- `organization_members` - Should have you as owner

---

## 🔧 OPTIONAL SCRIPTS (For Advanced Features)

### Storage Policies (Already Created)

If you need to recreate storage buckets:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('organization-logos', 'organization-logos', true),
  ('product-images', 'product-images', true),
  ('user-avatars', 'user-avatars', true),
  ('receipts', 'receipts', false),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

### Test Data (Optional)

To add test products for development:

```sql
-- Run in Supabase SQL Editor (replace YOUR_ORG_ID with your organization ID)
INSERT INTO products (organization_id, name, sku, selling_price, quantity, category)
VALUES
  ('YOUR_ORG_ID', 'Test Product 1', 'TP001', 100.00, 50, 'Electronics'),
  ('YOUR_ORG_ID', 'Test Product 2', 'TP002', 200.00, 30, 'Clothing'),
  ('YOUR_ORG_ID', 'Test Product 3', 'TP003', 50.00, 100, 'Food');
```

To get your organization ID:

```sql
-- Run in Supabase SQL Editor
SELECT id, name FROM organizations WHERE owner_id = auth.uid();
```

---

## 🐛 Troubleshooting

### Error: "relation 'organizations' does not exist"

**Solution**: You didn't run the `FRESH_DATABASE_SETUP.sql` script. Go back to **Step 2**.

### Error: "JWT expired" or "Invalid auth token"

**Solution**:

1. Check your `.env` file has correct Supabase credentials
2. Clear browser cookies
3. Sign out and sign in again

### Error: "Row level security policy violation"

**Solution**:

1. Make sure you completed onboarding
2. Check you have a `current_organization_id` set:
   ```sql
   SELECT * FROM user_profiles WHERE id = auth.uid();
   ```
3. If `current_organization_id` is null, run:
   ```sql
   UPDATE user_profiles
   SET current_organization_id = (
     SELECT organization_id
     FROM organization_members
     WHERE user_id = auth.uid()
     LIMIT 1
   )
   WHERE id = auth.uid();
   ```

### Can't see products/sales I created

**Solution**: Verify you're in the right organization:

```sql
-- Check your current organization
SELECT
  up.id,
  up.current_organization_id,
  o.name as organization_name
FROM user_profiles up
LEFT JOIN organizations o ON o.id = up.current_organization_id
WHERE up.id = auth.uid();
```

---

## 📱 Mobile Setup (Later - Phase 2)

After basic setup works, you can build for mobile:

### Android

```bash
# Build and sync
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

### iOS (macOS only)

```bash
# Build and sync
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 🎯 Next Steps After Setup

1. ✅ **Test all features** in the web app
2. ✅ **Create test products** and sales
3. ✅ **Invite team members** to test multi-user access
4. 🔄 **Phase 2**: Mobile enhancements (push notifications, offline support)
5. 💳 **Phase 3**: PayPal payment integration
6. 🧪 **Phase 4**: Testing and security audit
7. 📱 **Phase 5**: App store deployment
8. 🚀 **Phase 6**: Production launch!

---

## 📚 Related Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- `PHASE_2_MOBILE_DEVELOPMENT.md` - Mobile app guide
- `PHASE_3_PAYMENT_INTEGRATION.md` - PayPal integration
- `.env.example` - All environment variables explained

---

## ✅ Setup Checklist

Copy this and check off as you complete:

```
□ Created new Supabase project
□ Ran FRESH_DATABASE_SETUP.sql script
□ Verified 17 tables were created
□ Enabled email authentication
□ Configured redirect URLs
□ Copied Supabase credentials
□ Created .env file from .env.example
□ Filled in Supabase credentials in .env
□ Ran npm install
□ Ran npm run dev
□ Opened http://localhost:5173
□ Created test user account
□ Verified email
□ Completed onboarding flow
□ Created test organization
□ Verified data in Supabase Table Editor
□ Created test products (optional)
□ Tested RLS policies (optional)
```

---

🎉 **Congratulations!** You're ready to build your multi-industry SaaS platform!

Need help? Check the documentation or review the error messages in:

- Browser console (F12)
- Supabase Dashboard → Logs
- Terminal output
