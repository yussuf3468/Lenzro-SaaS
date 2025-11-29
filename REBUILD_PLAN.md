# 🏗️ LENZRO SAAS - CLEAN REBUILD PLAN

## 🎯 Vision

**Multi-tenant SaaS Platform for Business Management**

### Actors:

1. **Super Admin** (Yussuf Muse) - Platform owner, manages all tenants
2. **Tenant Owners** (e.g., Sabrin Mohamed) - Business owners who sign up
3. **Tenant Staff** - Employees under each business

---

## 📊 User Flow

### 1. Super Admin Dashboard (Yussuf Muse)

```
Login → Super Admin Dashboard
├── View All Tenants (Organizations)
├── View Revenue/Analytics
├── Manage Subscription Plans
├── View System Health
└── Support Tickets
```

### 2. Tenant Signup Flow

```
Landing Page → Sign Up
├── Step 1: Organization Details
│   ├── Organization Name (e.g., "Sabrin Electronics")
│   └── Business Type (Retail/Service/etc)
│
├── Step 2: Owner Details
│   ├── Full Name (e.g., "Sabrin Mohamed")
│   ├── Email
│   ├── Phone Number (for M-Pesa)
│   └── Password
│
├── Step 3: Choose Plan
│   ├── Free (100 products, 3 users)
│   ├── Basic ($10/mo - 500 products, 10 users)
│   └── Pro ($25/mo - Unlimited)
│
└── Step 4: Welcome Tutorial
    ├── Quick tour of dashboard
    ├── Add first product
    ├── Make first sale
    └── View reports
```

### 3. Tenant Dashboard

```
Login → Tenant Dashboard
├── Products (FREE: Max 100)
├── Sales
├── Orders
├── Inventory
├── Reports
└── Settings
    ├── Team Members
    ├── Subscription
    └── Billing
```

---

## 🗄️ Database Schema

### Core Tables

#### 1. `super_admins`

```sql
- id (uuid, pk)
- email (text, unique)
- full_name (text)
- created_at (timestamp)
```

#### 2. `organizations` (Tenants)

```sql
- id (uuid, pk)
- name (text) -- "Sabrin Electronics"
- slug (text, unique) -- "sabrin-electronics"
- owner_id (uuid, fk → auth.users)
- subscription_plan_id (uuid, fk → subscription_plans)
- subscription_status (enum: trial, active, suspended, cancelled)
- trial_ends_at (timestamp)
- phone_number (text) -- For M-Pesa
- max_products (int) -- 100 for free
- max_users (int) -- 3 for free
- product_count (int, default 0) -- Current count
- user_count (int, default 0) -- Current count
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. `organization_members`

```sql
- id (uuid, pk)
- organization_id (uuid, fk → organizations)
- user_id (uuid, fk → auth.users)
- role (enum: owner, admin, staff)
- invited_by (uuid, fk → auth.users)
- created_at (timestamp)
```

#### 4. `subscription_plans`

```sql
- id (uuid, pk)
- name (text) -- "Free", "Basic", "Pro"
- price_monthly_kes (int) -- 0, 1000, 2500
- price_yearly_kes (int) -- 0, 10000, 25000
- max_products (int) -- 100, 500, -1 (unlimited)
- max_users (int) -- 3, 10, -1
- max_storage_gb (int) -- 1, 10, 100
- features (jsonb) -- Array of features
- is_active (boolean)
- sort_order (int)
```

#### 5. `subscriptions`

```sql
- id (uuid, pk)
- organization_id (uuid, fk → organizations)
- plan_id (uuid, fk → subscription_plans)
- status (enum: trial, active, past_due, cancelled)
- billing_cycle (enum: monthly, yearly)
- current_period_start (timestamp)
- current_period_end (timestamp)
- cancel_at_period_end (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 6. `payments`

```sql
- id (uuid, pk)
- organization_id (uuid, fk → organizations)
- subscription_id (uuid, fk → subscriptions)
- amount (int) -- In KES
- currency (text) -- "KES" or "USD"
- payment_method (enum: mpesa, paypal)
- mpesa_phone (text) -- If M-Pesa
- mpesa_receipt (text) -- M-Pesa confirmation code
- paypal_transaction_id (text) -- If PayPal
- status (enum: pending, completed, failed, refunded)
- paid_at (timestamp)
- created_at (timestamp)
```

#### 7. `products`

```sql
- id (uuid, pk)
- organization_id (uuid, fk → organizations) -- TENANT ISOLATION
- name (text)
- sku (text)
- category (text)
- buying_price (decimal)
- selling_price (decimal)
- quantity_in_stock (int)
- reorder_level (int)
- image_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 8. `sales`

```sql
- id (uuid, pk)
- organization_id (uuid, fk → organizations) -- TENANT ISOLATION
- product_id (uuid, fk → products)
- quantity_sold (int)
- selling_price (decimal)
- total_sale (decimal)
- profit (decimal)
- payment_method (enum: cash, mpesa, card)
- sold_by (uuid, fk → auth.users)
- created_at (timestamp)
```

---

## 🔐 Row Level Security (RLS) Policies

### No Recursion - Use SECURITY DEFINER Functions

```sql
-- Helper function to get user's organizations (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_orgs(user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE organization_members.user_id = $1;
$$;

-- Products RLS
CREATE POLICY "Users see org products"
  ON products
  FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- Sales RLS
CREATE POLICY "Users see org sales"
  ON sales
  FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));
```

---

## 💰 Payment Integration

### M-Pesa STK Push (Priority 1)

```typescript
// services/mpesa.ts
async function initiateMpesaPayment({
  phone: string, // 254712345678
  amount: number, // 1000 (KES)
  accountRef: string, // organization_id
  description: string, // "Basic Plan - Monthly"
}) {
  // 1. Call M-Pesa Daraja API
  // 2. Return CheckoutRequestID
  // 3. User receives STK push on phone
  // 4. User enters PIN
  // 5. Callback updates payment status
}
```

### PayPal (Priority 2 - Later)

- Standard checkout flow
- USD pricing
- Webhook for payment confirmation

---

## 🎨 UI Components to Build

### 1. Super Admin Dashboard

```tsx
// src/components/admin/SuperAdminDashboard.tsx
- Tenant list with stats
- Revenue chart
- System metrics
- Subscription overview
```

### 2. Onboarding Flow

```tsx
// src/components/onboarding/OnboardingWizard.tsx
- Step 1: OrganizationForm
- Step 2: OwnerDetailsForm
- Step 3: PlanSelector
- Step 4: WelcomeTutorial
```

### 3. Product Limit Warning

```tsx
// src/components/ProductLimitWarning.tsx
"You've reached 100/100 products (Free Plan).
Upgrade to Basic for 500 products."
[Upgrade Now]
```

### 4. M-Pesa Payment Modal

```tsx
// src/components/payment/MpesaPaymentModal.tsx
- Phone input (254...)
- Amount display
- "Send STK Push" button
- Payment status indicator
```

---

## 📁 File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── TenantList.tsx
│   │   └── RevenueChart.tsx
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx
│   │   ├── OrganizationForm.tsx
│   │   ├── OwnerForm.tsx
│   │   ├── PlanSelector.tsx
│   │   └── WelcomeTutorial.tsx
│   ├── tenant/
│   │   ├── TenantDashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── SaleForm.tsx
│   │   └── Reports.tsx
│   ├── payment/
│   │   ├── MpesaPaymentModal.tsx
│   │   ├── PayPalButton.tsx
│   │   └── SubscriptionManager.tsx
│   └── shared/
│       ├── ProductLimitWarning.tsx
│       ├── UsageBar.tsx
│       └── PlanBadge.tsx
├── contexts/
│   ├── SuperAdminContext.tsx
│   ├── TenantContext.tsx
│   └── SubscriptionContext.tsx
├── services/
│   ├── mpesa.ts
│   ├── paypal.ts
│   ├── subscription.ts
│   └── tenant.ts
├── hooks/
│   ├── useTenant.ts
│   ├── useSubscription.ts
│   └── useProductLimit.ts
└── types/
    ├── admin.types.ts
    ├── tenant.types.ts
    ├── subscription.types.ts
    └── payment.types.ts
```

---

## 🚀 Implementation Steps

### Phase 1: Database Setup (Day 1)

- [ ] Create clean database schema
- [ ] Write RLS policies with SECURITY DEFINER
- [ ] Create subscription plans
- [ ] Test policies for no recursion

### Phase 2: Super Admin (Day 2)

- [ ] SuperAdminContext
- [ ] SuperAdminDashboard component
- [ ] Tenant management UI
- [ ] Analytics/metrics

### Phase 3: Onboarding (Day 3)

- [ ] OnboardingWizard component
- [ ] Organization creation
- [ ] Owner signup
- [ ] Plan selection
- [ ] Welcome tutorial

### Phase 4: Tenant Dashboard (Day 4-5)

- [ ] TenantContext with limits
- [ ] Product management
- [ ] Sales tracking
- [ ] Usage warnings

### Phase 5: M-Pesa Integration (Day 6-7)

- [ ] M-Pesa service setup
- [ ] STK push implementation
- [ ] Callback handling
- [ ] Payment tracking

### Phase 6: Testing & Polish (Day 8)

- [ ] E2E testing
- [ ] Limit enforcement testing
- [ ] Payment flow testing
- [ ] Bug fixes

---

## ✅ Success Criteria

1. ✅ Super admin can view all tenants
2. ✅ New tenant signup completes in <2 minutes
3. ✅ Product limit enforced (100 for free)
4. ✅ M-Pesa payment works end-to-end
5. ✅ No infinite recursion errors
6. ✅ Data completely isolated per tenant
7. ✅ Upgrade flow smooth (Free → Basic)

---

## 🔧 Technical Constraints

- PostgreSQL functions marked SECURITY DEFINER
- Query keys include organization_id for caching
- All Supabase queries use `(supabase as any)` for TypeScript
- Phone numbers in international format (254...)
- M-Pesa minimum: 10 KES
- Trial period: 14 days

---

**Next Step: Get approval, then start Phase 1 (Database Setup)**
