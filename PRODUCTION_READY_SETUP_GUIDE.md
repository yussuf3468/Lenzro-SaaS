# 🚀 Production-Ready Setup Guide

This guide will help you make your Lenzro SaaS application production-ready with modular features based on business type.

## 📋 Prerequisites Checklist

- [ ] Supabase account created
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Test accounts removed
- [ ] Dummy data cleaned

## 🗄️ Step 1: Run Database Migrations

### 1.1 Apply the Production-Ready Schema

1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `PRODUCTION_READY_DATABASE_FIX.sql` from your project root
4. Copy and paste the entire SQL script
5. Click **Run** to execute

This will:

- ✅ Add missing `display_order` column to `subscription_plans`
- ✅ Create `cyber_services` table with proper RLS policies
- ✅ Create `organization_modules` table for modular features
- ✅ Add `setup_completed` and `business_type` to organizations
- ✅ Create helper functions for module management

### 1.2 Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organization_modules', 'cyber_services')
ORDER BY table_name;
```

You should see both tables listed.

### 1.3 Verify Columns Were Added

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
  AND column_name = 'display_order';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('setup_completed', 'business_type');
```

## 🎯 Step 2: Test the New Organization Flow

### 2.1 Clear Test Data (Optional)

If you have test organizations, you may want to start fresh:

```sql
-- CAUTION: This will delete ALL organization data!
-- Only run this in development/testing environments

DELETE FROM organization_modules;
DELETE FROM organization_members;
DELETE FROM organizations;
```

### 2.2 Test New User Signup

1. **Sign Out** from any current session
2. Visit your app homepage
3. Click **"Get Started Free"**
4. Fill in the organization creation form:
   - Organization Name: "Test Retail Shop"
   - Owner Email: Use a valid email
   - Auto-generated password will be displayed
5. **Important**: Copy the credentials shown on screen
6. Click **"Go to Login"**
7. Sign in with the credentials

### 2.3 Complete Organization Setup Wizard

After signing in, you should see the **Organization Setup Wizard**:

1. **Step 1: Choose Business Type**

   - Select your business type (e.g., Retail Shop, Cyber Cafe, Restaurant)
   - Click **Continue**

2. **Step 2: Select Modules**

   - Review pre-selected modules based on business type
   - Toggle modules on/off as needed (except required ones)
   - Click **Complete Setup**

3. **Verify Dashboard**
   - You should now see only the modules you enabled
   - Sidebar should only show relevant menu items

## 🔧 Step 3: Configure Each Business Type

### Retail Shop Configuration

**Business Type**: `retail`

**Default Modules**:

- ✅ Inventory Management
- ✅ Order Management
- ✅ Customer Management
- ✅ POS (Point of Sale)
- ✅ Supplier Management
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Physical stores selling products

### Cyber Cafe Configuration

**Business Type**: `cyber_cafe`

**Default Modules**:

- ✅ Cyber Services
- ✅ Customer Management
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Internet cafes, printing services, computer usage tracking

### Restaurant Configuration

**Business Type**: `restaurant`

**Default Modules**:

- ✅ Inventory Management
- ✅ Order Management
- ✅ Customer Management
- ✅ POS
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Food service businesses

### E-Commerce Configuration

**Business Type**: `ecommerce`

**Default Modules**:

- ✅ Inventory Management
- ✅ Order Management
- ✅ Customer Management
- ✅ E-Commerce Platform
- ✅ Supplier Management
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Online stores

### Wholesale Configuration

**Business Type**: `wholesale`

**Default Modules**:

- ✅ Inventory Management
- ✅ Order Management
- ✅ Customer Management
- ✅ Supplier Management
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Bulk selling to other businesses

### Service Provider Configuration

**Business Type**: `service_provider`

**Default Modules**:

- ✅ Customer Management
- ✅ Staff Management
- ✅ Analytics
- ✅ Reports

**Use Case**: Professional services (consulting, etc.)

## 🧪 Step 4: Testing Module Functionality

### Test Module Visibility

1. **Sign in** to your organization
2. **Check Sidebar**: Only enabled modules should appear
3. **Try to access** disabled modules by URL - should show error or redirect

### Test Module Toggle (Admin Only)

Currently, modules are set during initial setup. To change modules later:

```sql
-- Enable a module
INSERT INTO organization_modules (organization_id, module_name, enabled)
VALUES ('your-org-id', 'ecommerce', TRUE)
ON CONFLICT (organization_id, module_name)
DO UPDATE SET enabled = TRUE;

-- Disable a module
UPDATE organization_modules
SET enabled = FALSE
WHERE organization_id = 'your-org-id'
  AND module_name = 'cyber_services';
```

## 🧹 Step 5: Clean Up Dummy Data

### Remove Test Credentials

1. **Remove hardcoded emails** from Layout.tsx:

```typescript
// Before (REMOVE THIS):
const isAdmin = user?.email === "galiyowabi@gmail.com";
const isStaff = user?.email === "khalid123@gmail.com";

// After (Use role-based checks):
const isAdmin = user?.role === "owner" || user?.role === "admin";
const isStaff = user?.role === "staff";
```

2. **Remove test users from database**:

```sql
-- List all users (to find test accounts)
SELECT id, email FROM auth.users;

-- Delete test users (replace with actual test user IDs)
DELETE FROM auth.users WHERE email LIKE '%test%';
```

### Check for Placeholder Links

Search your codebase for:

- `href="#"` - Replace with real navigation or remove
- `onClick={() => {}}` - Remove non-functional buttons
- `// TODO` comments - Address or remove
- Hardcoded test data - Replace with real data or fetch from DB

## 🔒 Step 6: Security Checklist

- [ ] All RLS policies enabled on tables
- [ ] No hardcoded credentials in code
- [ ] Environment variables in `.env` (not committed to git)
- [ ] API keys stored securely in Supabase secrets
- [ ] Admin routes protected by role checks
- [ ] File upload validation in place

## 📊 Step 7: Performance Optimization

### Enable Query Caching

Already implemented in `usePendingOrdersCount` hook:

```typescript
// Uses React Query with 2-minute cache
const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
```

### Monitor Database Egress

1. Go to **Supabase Dashboard > Settings > Billing**
2. Check **Database Egress** usage
3. Optimize queries that fetch large amounts of data
4. Use pagination for large lists

## 🚨 Common Issues & Solutions

### Issue: "Column display_order does not exist"

**Solution**: Run the `PRODUCTION_READY_DATABASE_FIX.sql` migration

### Issue: "Could not find table cyber_services"

**Solution**: Run the migration to create the table

### Issue: Setup wizard keeps showing after completion

**Solution**: Check that `setup_completed` is set to `TRUE`:

```sql
UPDATE organizations
SET setup_completed = TRUE
WHERE id = 'your-org-id';
```

### Issue: Modules not showing in sidebar

**Solution**: Verify modules are enabled:

```sql
SELECT * FROM organization_modules
WHERE organization_id = 'your-org-id'
  AND enabled = TRUE;
```

## 📱 Step 8: Mobile Responsiveness

Test on different devices:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## 🎨 Step 9: Branding Customization

Organizations can customize:

- Logo: Stored in `organizations.logo_url`
- Primary Color: Stored in `organizations.primary_color`
- Settings: Stored in `organizations.settings` (JSONB)

## ✅ Production Deployment Checklist

- [ ] Database migrations applied
- [ ] All test data removed
- [ ] Dummy credentials removed
- [ ] Environment variables configured
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Analytics integrated (e.g., Google Analytics)
- [ ] Backup strategy implemented
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Email service configured (for credentials)
- [ ] Payment gateway tested
- [ ] Terms of Service added
- [ ] Privacy Policy added

## 🎉 You're Production Ready!

Your Lenzro SaaS application is now:

- ✅ Modular based on business type
- ✅ Free of dummy data
- ✅ Properly secured with RLS
- ✅ Optimized for performance
- ✅ Ready for real customers

## 📞 Support

If you encounter issues:

1. Check the console for errors
2. Verify database schema matches expected structure
3. Check Supabase logs for RLS policy errors
4. Review this guide for missed steps

## 🔄 Future Enhancements

Consider adding:

- UI for admins to toggle modules without SQL
- Module-specific onboarding tutorials
- Usage analytics per module
- Module marketplace for plugins
- White-label options per organization
- Multi-language support beyond Somali
- Mobile app with React Native

---

**Last Updated**: November 29, 2025
**Version**: 1.0.0
