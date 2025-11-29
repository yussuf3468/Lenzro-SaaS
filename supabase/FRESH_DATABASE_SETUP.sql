-- ============================================
-- LENZRO SAAS PLATFORM - FRESH DATABASE SETUP
-- Multi-Industry Business Management SaaS
-- International Support with Multi-Currency
-- Version: 2.0.0
-- Date: November 28, 2025
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor in Supabase Dashboard
-- 3. Copy and paste this ENTIRE script
-- 4. Click "Run" to execute
-- 5. Wait for completion message
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- ============================================
-- PART 1: CORE SAAS TABLES
-- ============================================

-- Organizations (Tenants) Table - Multi-Industry
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business details (Multi-Industry)
  industry TEXT CHECK (industry IN ('retail', 'bookshop', 'restaurant', 'salon', 'pharmacy', 'grocery', 'electronics', 'clothing', 'hardware', 'services', 'other')),
  business_type TEXT CHECK (business_type IN ('b2b', 'b2c', 'both')),
  country TEXT DEFAULT 'KE', -- ISO country code
  currency TEXT DEFAULT 'KES', -- ISO currency code
  timezone TEXT DEFAULT 'Africa/Nairobi',
  language TEXT DEFAULT 'en',
  
  -- Subscription details
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial', 'past_due')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
  subscription_end_date TIMESTAMPTZ,
  
  -- Usage limits
  max_users INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 1,
  max_orders_per_month INTEGER DEFAULT 50,
  max_locations INTEGER DEFAULT 1,
  
  -- Features
  features JSONB DEFAULT '{"api_access": false, "advanced_reports": false, "custom_branding": false, "priority_support": false, "multi_location": false, "multi_currency": false}'::jsonb,
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  
  -- Contact information
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  department TEXT,
  job_title TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  country TEXT,
  current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans Table - International Pricing
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing (stored in USD, converted at checkout)
  price_monthly_usd DECIMAL(10,2) NOT NULL,
  price_yearly_usd DECIMAL(10,2),
  
  -- Regional pricing overrides
  regional_pricing JSONB DEFAULT '{}'::jsonb, -- {"KE": {"monthly": 3000, "yearly": 30000, "currency": "KES"}}
  
  -- Limits
  max_users INTEGER,
  max_products INTEGER,
  max_storage_gb INTEGER,
  max_orders_per_month INTEGER,
  max_locations INTEGER,
  
  -- Features
  features JSONB DEFAULT '{}'::jsonb,
  
  -- PayPal IDs (replacing Stripe)
  paypal_plan_id_monthly TEXT,
  paypal_plan_id_yearly TEXT,
  
  -- Mobile IAP IDs
  google_play_product_id TEXT,
  apple_product_id TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Payment provider details (PayPal instead of Stripe)
  paypal_subscription_id TEXT UNIQUE,
  paypal_payer_id TEXT,
  google_purchase_token TEXT,
  apple_transaction_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'incomplete', 'trialing')),
  
  -- Billing cycle
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  
  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Pricing info
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions Table - PayPal Support
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  
  -- Payment method
  payment_method TEXT CHECK (payment_method IN ('paypal', 'google_play', 'apple_iap', 'mpesa', 'bank_transfer')),
  payment_method_details JSONB,
  
  -- Provider IDs
  paypal_transaction_id TEXT,
  paypal_order_id TEXT,
  google_order_id TEXT,
  apple_receipt_data TEXT,
  mpesa_receipt TEXT,
  
  -- Invoice
  invoice_url TEXT,
  receipt_url TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metrics
  metric_type TEXT NOT NULL CHECK (metric_type IN ('users', 'products', 'orders', 'storage', 'api_calls', 'locations')),
  metric_value INTEGER NOT NULL DEFAULT 0,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, metric_type, period_start)
);

-- Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'staff', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: BUSINESS DATA TABLES (Multi-Industry)
-- ============================================

-- Products/Services Table (Generic for all industries)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic details
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  description TEXT,
  category TEXT,
  
  -- Pricing
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Inventory
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'unit',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE, -- Services don't track inventory
  
  -- Images
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Tax
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_inclusive BOOLEAN DEFAULT FALSE,
  
  -- Location (multi-location support)
  location_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales/Transactions Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Sale details
  sale_number TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'credit', 'other')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Items
  items JSONB NOT NULL, -- [{product_id, name, quantity, price}]
  
  -- Staff
  served_by UUID REFERENCES auth.users(id),
  
  -- Location
  location_id UUID,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Returns Table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id),
  
  -- Return details
  return_number TEXT UNIQUE,
  reason TEXT,
  
  -- Amounts
  refund_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Items
  items JSONB NOT NULL,
  
  -- Staff
  processed_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table (for businesses that take orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Order details
  order_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Items
  items JSONB NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  
  -- Delivery
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_date TIMESTAMPTZ,
  
  -- Staff
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Expense details
  description TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_method TEXT,
  receipt_url TEXT,
  
  -- Staff
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Date
  expense_date DATE DEFAULT CURRENT_DATE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Credits Table
CREATE TABLE IF NOT EXISTS customer_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Credit details
  total_credit DECIMAL(10,2) DEFAULT 0,
  used_credit DECIMAL(10,2) DEFAULT 0,
  available_credit DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Transactions
  transactions JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations Table (for multi-location businesses)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Location details
  name TEXT NOT NULL,
  code TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: INSERT DEFAULT DATA
-- ============================================

-- Insert default subscription plans with international pricing
INSERT INTO subscription_plans (
  name, slug, description, 
  price_monthly_usd, price_yearly_usd,
  regional_pricing,
  max_users, max_products, max_storage_gb, max_orders_per_month, max_locations,
  features, display_order
) VALUES
(
  'Free Starter',
  'free',
  'Perfect for trying out the platform',
  0.00,
  0.00,
  '{"KE": {"monthly": 0, "yearly": 0, "currency": "KES"}, "US": {"monthly": 0, "yearly": 0, "currency": "USD"}, "GB": {"monthly": 0, "yearly": 0, "currency": "GBP"}}'::jsonb,
  1,
  100,
  1,
  50,
  1,
  '{"api_access": false, "advanced_reports": false, "custom_branding": false, "priority_support": false, "mobile_access": true, "multi_location": false, "multi_currency": false}'::jsonb,
  1
),
(
  'Business Basic',
  'basic',
  'Great for small to medium businesses',
  29.00,
  290.00,
  '{"KE": {"monthly": 3000, "yearly": 30000, "currency": "KES"}, "US": {"monthly": 29, "yearly": 290, "currency": "USD"}, "GB": {"monthly": 25, "yearly": 250, "currency": "GBP"}}'::jsonb,
  5,
  1000,
  10,
  500,
  3,
  '{"api_access": false, "advanced_reports": true, "custom_branding": false, "priority_support": true, "mobile_access": true, "multi_location": true, "multi_currency": false}'::jsonb,
  2
),
(
  'Business Premium',
  'premium',
  'Best for growing and established businesses',
  99.00,
  990.00,
  '{"KE": {"monthly": 10000, "yearly": 100000, "currency": "KES"}, "US": {"monthly": 99, "yearly": 990, "currency": "USD"}, "GB": {"monthly": 85, "yearly": 850, "currency": "GBP"}}'::jsonb,
  999999,
  999999,
  100,
  999999,
  999999,
  '{"api_access": true, "advanced_reports": true, "custom_branding": true, "priority_support": true, "mobile_access": true, "white_label": true, "multi_location": true, "multi_currency": true, "advanced_analytics": true}'::jsonb,
  3
);

-- ============================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Organization members policies
CREATE POLICY "Members can view their organization's members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- Subscriptions policies
CREATE POLICY "Organization members can view subscriptions"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Payment transactions policies
CREATE POLICY "Organization members can view payments"
  ON payment_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Usage tracking policies
CREATE POLICY "Organization members can view usage"
  ON usage_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Invitations policies
CREATE POLICY "Organization admins can manage invitations"
  ON invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Audit logs policies
CREATE POLICY "Organization members can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Business data policies (products, sales, orders, etc.)
CREATE POLICY "Organization members can access products"
  ON products FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access sales"
  ON sales FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access returns"
  ON returns FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access orders"
  ON orders FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access expenses"
  ON expenses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access customer credits"
  ON customer_credits FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can access locations"
  ON locations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PART 5: FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to create organization and add owner as member
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_owner_id UUID,
  p_industry TEXT DEFAULT 'other',
  p_country TEXT DEFAULT 'KE',
  p_currency TEXT DEFAULT 'KES'
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO organizations (name, slug, owner_id, industry, country, currency)
  VALUES (p_name, p_slug, p_owner_id, p_industry, p_country, p_currency)
  RETURNING id INTO v_org_id;
  
  -- Add owner as member
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (v_org_id, p_owner_id, 'owner', NOW());
  
  -- Update user profile
  UPDATE user_profiles
  SET current_organization_id = v_org_id
  WHERE id = p_owner_id;
  
  -- Create default location
  INSERT INTO locations (organization_id, name, is_primary)
  VALUES (v_org_id, 'Main Location', TRUE);
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_organization_id UUID,
  p_limit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Get current organization limits
  SELECT 
    CASE p_limit_type
      WHEN 'users' THEN max_users
      WHEN 'products' THEN max_products
      WHEN 'orders' THEN max_orders_per_month
      WHEN 'locations' THEN max_locations
      ELSE 0
    END
  INTO v_max_limit
  FROM organizations
  WHERE id = p_organization_id;
  
  -- Get current count based on limit type
  CASE p_limit_type
    WHEN 'users' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM organization_members
      WHERE organization_id = p_organization_id;
    WHEN 'products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM products
      WHERE organization_id = p_organization_id;
    WHEN 'orders' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM orders
      WHERE organization_id = p_organization_id
      AND created_at >= date_trunc('month', NOW());
    WHEN 'locations' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM locations
      WHERE organization_id = p_organization_id;
    ELSE
      v_current_count := 0;
  END CASE;
  
  RETURN v_current_count < v_max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization currency
CREATE OR REPLACE FUNCTION get_organization_currency(p_organization_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_currency TEXT;
BEGIN
  SELECT currency INTO v_currency
  FROM organizations
  WHERE id = p_organization_id;
  
  RETURN COALESCE(v_currency, 'USD');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_credits_updated_at BEFORE UPDATE ON customer_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country);

-- Organization members
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_org ON user_profiles(current_organization_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal ON subscriptions(paypal_subscription_id);

-- Payment transactions
CREATE INDEX IF NOT EXISTS idx_payments_org ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payment_transactions(created_at);

-- Usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_org ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_period ON usage_tracking(period_start, period_end);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location_id);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_org ON sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_phone);

-- Returns
CREATE INDEX IF NOT EXISTS idx_returns_org ON returns(organization_id);
CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_created ON returns(created_at);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Customer credits
CREATE INDEX IF NOT EXISTS idx_customer_credits_org ON customer_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_credits_phone ON customer_credits(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_credits_email ON customer_credits(customer_email);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- ============================================
-- PART 7: STORAGE SETUP
-- ============================================

-- Create storage buckets (run this in Supabase Storage section or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('organization-logos', 'organization-logos', true),
  ('product-images', 'product-images', true),
  ('user-avatars', 'user-avatars', true),
  ('receipts', 'receipts', false),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organization logos
CREATE POLICY "Organization members can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-logos' AND
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id::text = (storage.foldername(name))[1]
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can view organization logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-logos');

-- Storage policies for product images
CREATE POLICY "Organization members can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Storage policies for user avatars
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '╔══════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   LENZRO SAAS PLATFORM - DATABASE SETUP COMPLETE!   ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All tables created successfully';
  RAISE NOTICE '✅ Row Level Security (RLS) enabled';
  RAISE NOTICE '✅ Default subscription plans added';
  RAISE NOTICE '✅ Functions and triggers configured';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Storage buckets configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '1. Go to Authentication > Providers in Supabase';
  RAISE NOTICE '2. Enable Email provider';
  RAISE NOTICE '3. Configure site URL and redirect URLs';
  RAISE NOTICE '4. Get your Project URL and anon key';
  RAISE NOTICE '5. Update your .env file with credentials';
  RAISE NOTICE '6. Run: npm install';
  RAISE NOTICE '7. Run: npm run dev';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Documentation:';
  RAISE NOTICE '- See SETUP_GUIDE.md for detailed instructions';
  RAISE NOTICE '- See .env.example for environment variables';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your multi-industry SaaS platform is ready!';
END $$;
