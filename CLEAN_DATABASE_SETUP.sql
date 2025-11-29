-- ============================================================================
-- LENZRO SAAS - CLEAN DATABASE SETUP
-- ============================================================================
-- Purpose: Complete multi-tenant SaaS database with super admin support
-- Author: Yussuf Muse
-- Date: November 29, 2025
-- 
-- CRITICAL: Uses SECURITY DEFINER functions to prevent infinite recursion
-- ============================================================================

-- WARNING: This script will DROP ALL existing tables and recreate them
-- Make sure to backup your data before running this script!

-- Clean slate: Drop existing objects
-- First drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Drop all indexes that start with idx_
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes 
              WHERE schemaname = 'public' 
              AND indexname LIKE 'idx_%') 
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname || ' CASCADE';
    END LOOP;
END $$;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_product_count ON products;
DROP TRIGGER IF EXISTS trigger_update_user_count ON organization_members;
DROP TRIGGER IF EXISTS trigger_check_product_limit ON products;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_orgs(uuid);
DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS is_org_owner(uuid, uuid);
DROP FUNCTION IF EXISTS is_org_admin(uuid, uuid);
DROP FUNCTION IF EXISTS can_manage_org(uuid, uuid);
DROP FUNCTION IF EXISTS check_product_limit();
DROP FUNCTION IF EXISTS update_product_count();
DROP FUNCTION IF EXISTS update_user_count();
DROP FUNCTION IF EXISTS create_organization_with_owner(text, text, text, text, text);

-- Drop tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS customer_credits CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================================================
-- 1. SUPER ADMINS TABLE
-- ============================================================================
CREATE TABLE super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX idx_super_admins_email ON super_admins(email);

-- RLS for super_admins (only super admins can see this table)
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view themselves"
  ON super_admins
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 2. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly_kes integer NOT NULL DEFAULT 0,
  price_yearly_kes integer NOT NULL DEFAULT 0,
  max_products integer NOT NULL DEFAULT 100, -- -1 for unlimited
  max_users integer NOT NULL DEFAULT 3,      -- -1 for unlimited
  max_storage_gb integer NOT NULL DEFAULT 1, -- -1 for unlimited
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for active plans
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active, sort_order);

-- RLS for subscription_plans (everyone can view, only super admin can modify)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 4. ORGANIZATIONS TABLE (Tenants)
-- ============================================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
  subscription_plan_id uuid REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  phone_number text, -- For M-Pesa payments
  business_type text,
  
  -- Limits from subscription plan (denormalized for performance)
  max_products integer DEFAULT 100,
  max_users integer DEFAULT 3,
  max_storage_gb integer DEFAULT 1,
  
  -- Current usage counters
  product_count integer DEFAULT 0 CHECK (product_count >= 0),
  user_count integer DEFAULT 1 CHECK (user_count >= 0), -- Owner counts as 1
  storage_used_mb integer DEFAULT 0 CHECK (storage_used_mb >= 0),
  
  -- Settings
  settings jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_trial ON organizations(trial_ends_at) WHERE subscription_status = 'trial';

-- RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. ORGANIZATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);

-- RLS for organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE RESTRICT NOT NULL,
  status text DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount integer NOT NULL, -- In cents (KES or USD)
  currency text DEFAULT 'KES' CHECK (currency IN ('KES', 'USD')),
  payment_method text NOT NULL CHECK (payment_method IN ('mpesa', 'paypal', 'card')),
  
  -- M-Pesa specific
  mpesa_phone text,
  mpesa_receipt text,
  mpesa_transaction_id text,
  
  -- PayPal specific
  paypal_transaction_id text,
  paypal_payer_id text,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  failure_reason text,
  paid_at timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. PRODUCTS TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL,
  sku text,
  barcode text,
  category text,
  description text,
  
  -- Pricing
  buying_price numeric(12, 2) DEFAULT 0,
  selling_price numeric(12, 2) NOT NULL,
  
  -- Inventory
  quantity_in_stock integer DEFAULT 0 CHECK (quantity_in_stock >= 0),
  reorder_level integer DEFAULT 10,
  
  -- Media
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  
  -- Flags
  is_active boolean DEFAULT true,
  track_inventory boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, sku)
);

-- Indexes
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_category ON products(organization_id, category);
CREATE INDEX idx_products_sku ON products(organization_id, sku);
CREATE INDEX idx_products_active ON products(organization_id, is_active);

-- RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. SALES TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  
  quantity_sold integer NOT NULL CHECK (quantity_sold > 0),
  selling_price numeric(12, 2) NOT NULL,
  total_sale numeric(12, 2) NOT NULL,
  profit numeric(12, 2),
  
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'credit')),
  customer_name text,
  customer_phone text,
  
  sold_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sales_org ON sales(organization_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(organization_id, created_at DESC);
CREATE INDEX idx_sales_sold_by ON sales(sold_by);

-- RLS for sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. ORDERS TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  order_number text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  
  total_amount numeric(12, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  
  items jsonb NOT NULL, -- Array of {product_id, name, quantity, price, total}
  
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, order_number)
);

-- Indexes
CREATE INDEX idx_orders_org ON orders(organization_id);
CREATE INDEX idx_orders_status ON orders(organization_id, status);
CREATE INDEX idx_orders_date ON orders(organization_id, created_at DESC);
CREATE INDEX idx_orders_number ON orders(organization_id, order_number);

-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. EXPENSES TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  description text NOT NULL,
  category text,
  amount numeric(12, 2) NOT NULL,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank')),
  
  receipt_url text,
  notes text,
  
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expense_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_date ON expenses(organization_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(organization_id, category);

-- RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. RETURNS TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  
  quantity_returned integer NOT NULL CHECK (quantity_returned > 0),
  refund_amount numeric(12, 2) NOT NULL,
  reason text,
  
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_returns_org ON returns(organization_id);
CREATE INDEX idx_returns_product ON returns(product_id);
CREATE INDEX idx_returns_date ON returns(organization_id, created_at DESC);

-- RLS for returns
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 13. CUSTOMER CREDITS TABLE (Multi-tenant)
-- ============================================================================
CREATE TABLE customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  customer_name text NOT NULL,
  customer_phone text,
  
  total_credit numeric(12, 2) NOT NULL,
  amount_paid numeric(12, 2) DEFAULT 0,
  balance numeric(12, 2) NOT NULL,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  due_date date,
  
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_credits_org ON customer_credits(organization_id);
CREATE INDEX idx_customer_credits_status ON customer_credits(organization_id, status);
CREATE INDEX idx_customer_credits_customer ON customer_credits(organization_id, customer_phone);

-- RLS for customer_credits
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (NO INFINITE RECURSION)
-- ============================================================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins 
    WHERE super_admins.user_id = $1
  );
$$;

-- Function to get user's organizations
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

-- Function to check if user is organization owner
CREATE OR REPLACE FUNCTION is_org_owner(user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.user_id = $1
      AND organization_members.organization_id = $2
      AND organization_members.role = 'owner'
  );
$$;

-- Function to check if user is organization admin
CREATE OR REPLACE FUNCTION is_org_admin(user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.user_id = $1
      AND organization_members.organization_id = $2
      AND organization_members.role IN ('owner', 'admin')
  );
$$;

-- Function to check if user can manage organization
CREATE OR REPLACE FUNCTION can_manage_org(user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_super_admin($1) OR is_org_admin($1, $2);
$$;

-- ============================================================================
-- RLS POLICIES (Using SECURITY DEFINER functions)
-- ============================================================================

-- ORGANIZATIONS
CREATE POLICY "Users see their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Super admins see all organizations"
  ON organizations FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Owners can update their organizations"
  ON organizations FOR UPDATE
  USING (is_org_owner(auth.uid(), id));

-- ORGANIZATION MEMBERS
CREATE POLICY "Users see members of their organizations"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Super admins see all members"
  ON organization_members FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  USING (is_org_admin(auth.uid(), organization_id));

-- SUBSCRIPTIONS
CREATE POLICY "Users see their org subscriptions"
  ON subscriptions FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Super admins see all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_super_admin(auth.uid()));

-- PAYMENTS
CREATE POLICY "Users see their org payments"
  ON payments FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Super admins see all payments"
  ON payments FOR SELECT
  USING (is_super_admin(auth.uid()));

-- PRODUCTS
CREATE POLICY "Users see their org products"
  ON products FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users manage their org products"
  ON products FOR ALL
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- SALES
CREATE POLICY "Users see their org sales"
  ON sales FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users create sales in their org"
  ON sales FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- ORDERS
CREATE POLICY "Users see their org orders"
  ON orders FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users manage their org orders"
  ON orders FOR ALL
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- EXPENSES
CREATE POLICY "Users see their org expenses"
  ON expenses FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users create expenses in their org"
  ON expenses FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- RETURNS
CREATE POLICY "Users see their org returns"
  ON returns FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users create returns in their org"
  ON returns FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- CUSTOMER CREDITS
CREATE POLICY "Users see their org credits"
  ON customer_credits FOR SELECT
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

CREATE POLICY "Users manage their org credits"
  ON customer_credits FOR ALL
  USING (organization_id IN (SELECT get_user_orgs(auth.uid())));

-- ============================================================================
-- TRIGGERS FOR USAGE COUNTERS
-- ============================================================================

-- Update product count when products are added/removed
CREATE OR REPLACE FUNCTION update_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizations 
    SET product_count = product_count + 1,
        updated_at = now()
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations 
    SET product_count = GREATEST(0, product_count - 1),
        updated_at = now()
    WHERE id = OLD.organization_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_product_count
AFTER INSERT OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_count();

-- Update user count when members are added/removed
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizations 
    SET user_count = user_count + 1,
        updated_at = now()
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations 
    SET user_count = GREATEST(0, user_count - 1),
        updated_at = now()
    WHERE id = OLD.organization_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_user_count
AFTER INSERT OR DELETE ON organization_members
FOR EACH ROW EXECUTE FUNCTION update_user_count();

-- ============================================================================
-- FUNCTION: CHECK PRODUCT LIMIT
-- ============================================================================
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_max_products integer;
  org_current_count integer;
BEGIN
  -- Get organization limits
  SELECT max_products, product_count 
  INTO org_max_products, org_current_count
  FROM organizations
  WHERE id = NEW.organization_id;
  
  -- Check if unlimited (-1)
  IF org_max_products = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Check if limit reached
  IF org_current_count >= org_max_products THEN
    RAISE EXCEPTION 'Product limit reached. You have % products (max: %). Please upgrade your plan.', 
      org_current_count, org_max_products
    USING HINT = 'upgrade_required',
          ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_product_limit
BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION check_product_limit();

-- ============================================================================
-- FUNCTION: CREATE ORGANIZATION WITH OWNER
-- ============================================================================
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name text,
  org_slug text,
  owner_user_id uuid,
  owner_full_name text,
  owner_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  free_plan_id uuid;
BEGIN
  -- Get free plan ID
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE slug = 'free'
  LIMIT 1;
  
  -- Create organization
  INSERT INTO organizations (
    name,
    slug,
    owner_id,
    subscription_plan_id,
    phone_number,
    max_products,
    max_users,
    user_count
  ) VALUES (
    org_name,
    org_slug,
    owner_user_id,
    free_plan_id,
    owner_phone,
    100,
    3,
    1 -- Owner counts as 1
  ) RETURNING id INTO new_org_id;
  
  -- Create user profile if not exists
  INSERT INTO user_profiles (user_id, email, full_name, phone_number)
  VALUES (
    owner_user_id,
    (SELECT email FROM auth.users WHERE id = owner_user_id),
    owner_full_name,
    owner_phone
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone_number = COALESCE(EXCLUDED.phone_number, user_profiles.phone_number);
  
  -- Add owner as organization member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    new_org_id,
    owner_user_id,
    'owner'
  );
  
  -- Create subscription
  INSERT INTO subscriptions (
    organization_id,
    plan_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    new_org_id,
    free_plan_id,
    'trial',
    now(),
    now() + interval '14 days'
  );
  
  RETURN new_org_id;
END;
$$;

-- ============================================================================
-- SEED DATA: SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO subscription_plans (name, slug, description, price_monthly_kes, price_yearly_kes, max_products, max_users, max_storage_gb, features, sort_order) VALUES
(
  'Free',
  'free',
  'Perfect for getting started',
  0,
  0,
  100,
  3,
  1,
  '["100 products", "3 team members", "1GB storage", "Basic reports", "Email support"]'::jsonb,
  1
),
(
  'Basic',
  'basic',
  'For growing businesses',
  1000,
  10000,
  500,
  10,
  10,
  '["500 products", "10 team members", "10GB storage", "Advanced reports", "Priority support", "Custom branding"]'::jsonb,
  2
),
(
  'Pro',
  'pro',
  'For established businesses',
  2500,
  25000,
  -1,
  -1,
  100,
  '["Unlimited products", "Unlimited team members", "100GB storage", "Advanced analytics", "24/7 priority support", "Custom branding", "API access", "White label"]'::jsonb,
  3
);

-- ============================================================================
-- SEED DATA: SUPER ADMIN (Yussuf Muse)
-- ============================================================================
-- NOTE: Replace 'your-user-id-here' with your actual auth.users ID
-- Run this after your first login:
-- INSERT INTO super_admins (user_id, email, full_name)
-- VALUES ('your-user-id-here', 'admin@lenzro.com', 'Yussuf Muse');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Allow anon to view subscription plans
GRANT SELECT ON subscription_plans TO anon;

-- ============================================================================
-- COMPLETED!
-- ============================================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Update super_admins table with your user_id
-- 3. Test creating an organization
-- 4. Verify RLS policies work correctly
-- ============================================================================
