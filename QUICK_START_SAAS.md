# 🚀 Quick Start Guide - SaaS Transformation

## Prerequisites

✅ Node.js 18+ installed
✅ npm or yarn package manager
✅ Supabase account (https://supabase.com)
✅ Git installed

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and region
4. Set database password (save this!)

### 2.2 Run Database Migration

1. Go to Supabase Dashboard > SQL Editor
2. Open `supabase/migrations/001_saas_multi_tenant_setup.sql`
3. Copy all content
4. Paste in SQL Editor
5. Click "Run"
6. Wait for completion message

### 2.3 Get API Keys

1. Go to Project Settings > API
2. Copy:
   - `Project URL` → VITE_SUPABASE_URL
   - `anon public` key → VITE_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

---

## Step 3: Configure Environment Variables

### 3.1 Create .env file

```bash
cp .env.example .env
```

### 3.2 Update .env

```env
# Required for Phase 1
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for later phases)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# ... (see .env.example for all options)
```

---

## Step 4: Update Supabase Types (Optional)

Generate TypeScript types from your database:

```bash
npx supabase gen types typescript --project-id your-project-ref > src/lib/database.types.ts
```

---

## Step 5: Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

---

## Step 6: Test the Application

### 6.1 Create First User

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Or use the signup form in the app

### 6.2 Complete Onboarding

1. Login with your credentials
2. Create your first organization
3. Choose a subscription plan (starts with free trial)
4. Optionally invite team members

### 6.3 Verify Multi-Tenancy

```sql
-- Check in Supabase SQL Editor
SELECT * FROM organizations;
SELECT * FROM organization_members;
SELECT * FROM user_profiles;
```

---

## Step 7: Build for Production

### Web Build

```bash
npm run build
```

### Android Build

```bash
npm run android:bundle
```

### iOS Build

```bash
npm run ios:sync
```

---

## Common Issues & Solutions

### Issue: "Supabase URL not configured"

**Solution**: Make sure `.env` file exists and contains valid Supabase credentials.

### Issue: Database migration fails

**Solution**:

1. Check Supabase logs for errors
2. Ensure you have necessary permissions
3. Try running migration in smaller chunks

### Issue: "Organization not found after login"

**Solution**: Complete the onboarding flow to create your first organization.

### Issue: Android build fails

**Solution**:

```bash
npm run android:clean
npm run android:sync
```

---

## Development Workflow

### Daily Development

```bash
npm run dev          # Start dev server
npm run typecheck    # Check TypeScript errors
npm run lint         # Check code quality
```

### Before Committing

```bash
npm run typecheck    # No TypeScript errors
npm run lint         # No linting errors
npm run build        # Build succeeds
```

### Testing Mobile

```bash
npm run android      # Open Android Studio
npm run ios          # Open Xcode (Mac only)
```

---

## Next Steps

1. ✅ **Phase 1 Complete**: Multi-tenancy & basic SaaS features
2. 🔄 **Start Phase 2**: Mobile app enhancements
   - Read `PHASE_2_MOBILE_DEVELOPMENT.md`
   - Implement push notifications
   - Add offline support
3. 💳 **Then Phase 3**: Payment integration
   - Read `PHASE_3_PAYMENT_INTEGRATION.md`
   - Set up Stripe
   - Implement IAP
4. 📚 **Follow**: `IMPLEMENTATION_CHECKLIST.md` for complete roadmap

---

## Project Structure

```
src/
├── components/          # React components
│   ├── OnboardingFlow.tsx
│   ├── SubscriptionManagement.tsx
│   └── OrganizationSettings.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── SaaSContext.tsx    # ⭐ New SaaS state management
├── types/              # TypeScript types
│   └── saas.types.ts      # ⭐ SaaS type definitions
├── utils/              # Utility functions
├── lib/                # External libraries config
│   └── supabase.ts
└── mobile/             # Mobile-specific code (Phase 2)

supabase/
└── migrations/
    └── 001_saas_multi_tenant_setup.sql  # ⭐ Database schema

docs/
├── SAAS_TRANSFORMATION_GUIDE.md
├── PHASE_2_MOBILE_DEVELOPMENT.md
├── PHASE_3_PAYMENT_INTEGRATION.md
└── IMPLEMENTATION_CHECKLIST.md
```

---

## Resources

- 📖 **Documentation**: Check all `.md` files in root directory
- 🐛 **Issues**: Report in GitHub Issues
- 💬 **Support**: support@lenzro.app
- 🌟 **Updates**: Watch GitHub repository for updates

---

## Tips for Success

1. **Start Small**: Complete Phase 1 fully before moving to Phase 2
2. **Test Often**: Test each feature as you build it
3. **Document**: Keep notes of any customizations you make
4. **Security First**: Never commit `.env` file to Git
5. **Backup**: Regular database backups before major changes
6. **Version Control**: Commit frequently with clear messages

---

## Get Help

Need assistance? Here's how to get help:

1. **Check Documentation**: Read relevant phase guide
2. **Search Issues**: Check if someone had same problem
3. **Ask Community**: Post in discussions/forum
4. **Contact Support**: Email for urgent issues

---

**You're all set! Start building your SaaS empire! 🚀💼**

_Last updated: Phase 1 Complete_
