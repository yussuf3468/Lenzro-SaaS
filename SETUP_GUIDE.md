# 🚀 LENZRO SAAS - Complete Setup Guide for New Supabase Project

## 📋 Overview

This guide will help you set up your **multi-industry, international SaaS platform** from scratch using your new Supabase project.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: Lenzro SaaS
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users (e.g., `eu-west-1` for Europe, `us-east-1` for USA)
4. Click "Create Project" and wait ~2 minutes

### Step 2: Run Database Setup Script

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file: `supabase/FRESH_DATABASE_SETUP.sql`
4. **Copy the ENTIRE contents** of that file
5. **Paste** into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for completion message: ✅ "LENZRO SAAS PLATFORM - DATABASE SETUP COMPLETE!"

**This creates:**

- 17 database tables
- Row Level Security (RLS) policies
- 3 subscription plans (Free, Basic, Premium)
- Functions and triggers
- Storage buckets
- Indexes for performance

### Step 3: Configure Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. **Enable** the following:
   - ✅ Email (enabled by default)
   - ✅ Google (optional, for social login)
   - ✅ Apple (optional, for iOS)
3. Go to **Authentication** → **URL Configuration**
4. Set:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add these:
     ```
     http://localhost:5173/**
     https://yourdomain.com/**
     capacitor://localhost/**
     ```

### Step 4: Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Step 5: Configure Environment Variables

1. In your project root, copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:

   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # PayPal Configuration (get from PayPal Developer)
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   VITE_PAYPAL_MODE=sandbox
   ```

### Step 6: Install Dependencies & Run

```bash
# Install packages
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🗂️ What Was Created

### Database Tables (17 total)

#### SaaS Core Tables:

- `organizations` - Tenants/businesses using your platform
- `organization_members` - Users belonging to organizations
- `user_profiles` - Extended user information
- `subscription_plans` - Pricing tiers (Free, Basic, Premium)
- `subscriptions` - Active subscriptions
- `payment_transactions` - Payment history
- `usage_tracking` - Monitor usage limits
- `invitations` - Team member invitations
- `audit_logs` - Activity tracking

#### Business Data Tables (Multi-Industry):

- `products` - Products/services (any industry)
- `sales` - Transactions/sales
- `returns` - Product returns
- `orders` - Customer orders
- `expenses` - Business expenses
- `customer_credits` - Credit/loyalty system
- `locations` - Multi-location support

---

## 🌍 International Features

### Multi-Currency Support

The platform automatically handles multiple currencies:

```typescript
// Supported currencies
const currencies = {
  KES: "Kenyan Shilling",
  USD: "US Dollar",
  GBP: "British Pound",
  EUR: "Euro",
  ZAR: "South African Rand",
  NGN: "Nigerian Naira",
  UGX: "Ugandan Shilling",
  TZS: "Tanzanian Shilling",
};
```

Each organization can set their preferred currency during onboarding.

### Regional Pricing

Subscription plans have regional pricing stored in the database:

```json
{
  "KE": { "monthly": 3000, "yearly": 30000, "currency": "KES" },
  "US": { "monthly": 29, "yearly": 290, "currency": "USD" },
  "GB": { "monthly": 25, "yearly": 250, "currency": "GBP" }
}
```

### Supported Industries

The platform supports any business type:

- 🛒 **Retail** - General retail stores
- 📚 **Bookshop** - Book stores and libraries
- 🍔 **Restaurant** - Restaurants and cafes
- 💇 **Salon** - Beauty salons and spas
- 💊 **Pharmacy** - Pharmacies and drugstores
- 🥬 **Grocery** - Grocery stores
- 📱 **Electronics** - Electronics stores
- 👕 **Clothing** - Fashion and apparel
- 🔧 **Hardware** - Hardware stores
- 💼 **Services** - Service businesses
- 📦 **Other** - Any other business type

---

## 💳 PayPal Integration Setup (Kenya-Compatible)

### Why PayPal Instead of Stripe?

- ✅ Works in Kenya and most African countries
- ✅ Widely trusted internationally
- ✅ Supports multiple currencies
- ✅ Lower barriers to entry

### Get PayPal Credentials

1. Go to [PayPal Developer](https://developer.paypal.com)
2. Log in with your PayPal account
3. Go to **Dashboard** → **My Apps & Credentials**
4. Under **REST API apps**, click **Create App**
5. Name your app: "Lenzro SaaS"
6. Copy your:
   - **Client ID** (for frontend)
   - **Secret** (for backend - keep secure!)

### PayPal Modes

- **Sandbox**: For testing (use test accounts)
- **Live**: For production (real money)

Start with Sandbox mode in your `.env`:

```env
VITE_PAYPAL_MODE=sandbox
```

### Testing PayPal

PayPal provides test accounts:

1. Go to [PayPal Sandbox](https://developer.paypal.com/developer/accounts)
2. Use the **Business** account to receive payments
3. Use the **Personal** account to make test purchases

---

## 🔐 Security Setup

### Row Level Security (RLS)

All tables have RLS policies ensuring:

- ✅ Users can only access their organization's data
- ✅ No cross-tenant data leaks
- ✅ Role-based permissions (owner, admin, manager, staff, viewer)

### API Keys

**Never commit these to Git:**

- ❌ Supabase service role key
- ❌ PayPal client secret
- ❌ Any API secrets

**Safe to commit:**

- ✅ Supabase URL
- ✅ Supabase anon key
- ✅ PayPal Client ID (public key)

---

## 📱 Mobile Setup (Android & iOS)

### Android Setup

```bash
# Build for Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

### iOS Setup (macOS only)

```bash
# Build for iOS
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 🧪 Testing Your Setup

### 1. Test User Registration

1. Open `http://localhost:5173`
2. Click "Sign Up"
3. Create an account
4. Check your email for verification link

### 2. Test Onboarding Flow

After login, you should see:

1. **Step 1**: Create your organization
   - Enter business name
   - Select industry
   - Choose country & currency
2. **Step 2**: Choose a plan
   - Free, Basic, or Premium
3. **Step 3**: Invite team members (optional)

### 3. Test Multi-Tenancy

1. Create a product
2. Log out
3. Create another account
4. Create another organization
5. Verify the first user can't see the second organization's products ✅

### 4. Test Database

Run this query in Supabase SQL Editor:

```sql
-- Check organizations
SELECT * FROM organizations;

-- Check subscription plans
SELECT name, price_monthly_usd, regional_pricing FROM subscription_plans;

-- Check RLS is working
SELECT * FROM products; -- Should only show your organization's products
```

---

## 🐛 Troubleshooting

### "relation does not exist" error

**Solution**: Make sure you ran the `FRESH_DATABASE_SETUP.sql` script completely.

### Authentication not working

**Solution**:

1. Check your Site URL in Authentication settings
2. Verify `.env` has correct Supabase URL and anon key
3. Check browser console for errors

### RLS policy errors

**Solution**:

1. Make sure you're logged in
2. Check that your user profile was created
3. Verify you have an organization assigned

### Products/Sales not showing

**Solution**:

1. Make sure you completed onboarding
2. Check that `current_organization_id` is set in your user profile:
   ```sql
   SELECT * FROM user_profiles WHERE id = auth.uid();
   ```

---

## 📚 File Structure

```
Lenzro SaaS/
├── supabase/
│   ├── FRESH_DATABASE_SETUP.sql    ← Run this first!
│   └── migrations/
├── src/
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SaaSContext.tsx
│   ├── components/
│   │   ├── OnboardingFlow.tsx
│   │   ├── SubscriptionManagement.tsx
│   │   └── OrganizationSettings.tsx
│   ├── types/
│   │   └── saas.types.ts
│   └── App.tsx
├── .env.example                     ← Copy to .env
├── SETUP_GUIDE.md                   ← This file
└── package.json
```

---

## 🎯 Next Steps After Setup

### Phase 2: Mobile Enhancements (Current)

1. **Push Notifications**

   - Configure Firebase Cloud Messaging (FCM)
   - Set up notification handlers
   - Test on physical devices

2. **Offline Support**

   - Implement local storage sync
   - Queue transactions when offline
   - Sync when connection restored

3. **Mobile-Optimized UI**
   - Responsive layouts for small screens
   - Touch-friendly buttons
   - Native-like animations

**See**: `PHASE_2_MOBILE_DEVELOPMENT.md`

### Phase 3: Payment Integration

1. **PayPal Web Integration**

   - Checkout flow
   - Webhook handling
   - Subscription management

2. **Google Play Billing**

   - In-app subscriptions
   - Server-side verification

3. **Apple In-App Purchases**
   - StoreKit integration
   - Receipt validation

**See**: `PHASE_3_PAYMENT_INTEGRATION.md`

---

## 💡 Tips for Success

1. **Start Small**: Test with Free plan first
2. **Iterate**: Get user feedback early
3. **Monitor**: Set up error tracking (Sentry)
4. **Backup**: Enable Supabase daily backups
5. **Scale**: Upgrade Supabase plan as you grow

---

## 🆘 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **PayPal Developer**: https://developer.paypal.com/docs
- **React Docs**: https://react.dev
- **Capacitor Docs**: https://capacitorjs.com/docs

---

## 📄 Environment Variables Reference

Copy `.env.example` to `.env` and fill in:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# PAYPAL CONFIGURATION (Sandbox for testing)
# ============================================
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
VITE_PAYPAL_MODE=sandbox

# ============================================
# APP CONFIGURATION
# ============================================
VITE_APP_NAME=Lenzro
VITE_APP_URL=http://localhost:5173
VITE_DEFAULT_CURRENCY=KES
VITE_DEFAULT_COUNTRY=KE

# ============================================
# FIREBASE (For Push Notifications)
# ============================================
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789

# ============================================
# GOOGLE PLAY (For Android IAP)
# ============================================
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PLAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# ============================================
# APPLE (For iOS IAP)
# ============================================
APPLE_SHARED_SECRET=your_app_shared_secret
APPLE_TEAM_ID=your_team_id
```

---

## ✅ Setup Checklist

- [ ] Create new Supabase project
- [ ] Run `FRESH_DATABASE_SETUP.sql` in SQL Editor
- [ ] Enable authentication providers
- [ ] Configure URL redirects
- [ ] Get Supabase API credentials
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in Supabase credentials in `.env`
- [ ] Create PayPal Developer account
- [ ] Get PayPal sandbox credentials
- [ ] Fill in PayPal credentials in `.env`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test user registration
- [ ] Test onboarding flow
- [ ] Create test organization
- [ ] Add test products
- [ ] Verify RLS is working
- [ ] Test mobile builds (optional)

---

🎉 **Congratulations!** Your multi-industry, international SaaS platform is ready!

For detailed implementation guides, see:

- `PHASE_2_MOBILE_DEVELOPMENT.md` - Mobile app development
- `PHASE_3_PAYMENT_INTEGRATION.md` - Payment integration
- `IMPLEMENTATION_CHECKLIST.md` - Complete task list
