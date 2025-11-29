-- ============================================
-- SaaS Multi-Tenant Migration
-- Version: 1.0.0
-- Description: Transforms single-tenant ERP to multi-tenant SaaS
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 1: CORE SAAS TABLES
-- ============================================

-- Organizations (Tenants) Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
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
  
  -- Features
  features JSONB DEFAULT '{"api_access": false, "advanced_reports": false, "custom_branding": false, "priority_support": false}'::jsonb,
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  
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
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
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
  current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Limits
  max_users INTEGER,
  max_products INTEGER,
  max_storage_gb INTEGER,
  max_orders_per_month INTEGER,
  
  -- Features
  features JSONB DEFAULT '{}'::jsonb,
  
  -- Stripe IDs
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  
  -- Mobile IAP IDs
  google_play_product_id TEXT,
  apple_product_id TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Payment provider details
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
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
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  
  -- Payment method
  payment_method TEXT CHECK (payment_method IN ('stripe', 'google_play', 'apple_iap', 'paypal')),
  payment_method_details JSONB,
  
  -- Provider IDs
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  google_order_id TEXT,
  apple_receipt_data TEXT,
  
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
  metric_type TEXT NOT NULL CHECK (metric_type IN ('users', 'products', 'orders', 'storage', 'api_calls')),
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
  token TEXT UNIQUE NOT NULL,
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
-- PART 2: INSERT DEFAULT DATA
-- ============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_users, max_products, max_storage_gb, max_orders_per_month, features, display_order) VALUES
(
  'Free',
  'free',
  'Perfect for trying out our platform',
  0.00,
  0.00,
  1,
  100,
  1,
  50,
  '{"api_access": false, "advanced_reports": false, "custom_branding": false, "priority_support": false, "mobile_access": true}'::jsonb,
  1
),
(
  'Basic',
  'basic',
  'Great for small businesses',
  29.00,
  290.00,
  5,
  1000,
  10,
  500,
  '{"api_access": false, "advanced_reports": true, "custom_branding": false, "priority_support": true, "mobile_access": true}'::jsonb,
  2
),
(
  'Premium',
  'premium',
  'Best for growing businesses',
  99.00,
  990.00,
  999999,
  999999,
  100,
  999999,
  '{"api_access": true, "advanced_reports": true, "custom_branding": true, "priority_support": true, "mobile_access": true, "white_label": true}'::jsonb,
  3
);

-- ============================================
-- PART 3: ADD ORGANIZATION_ID TO EXISTING TABLES
-- ============================================

-- Add organization_id column to existing tables (if they don't have it)
DO $$ 
BEGIN
  -- Products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='organization_id') THEN
    ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
  END IF;
  
  -- Sales
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='organization_id') THEN
    ALTER TABLE sales ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_sales_organization ON sales(organization_id);
  END IF;
  
  -- Returns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='returns' AND column_name='organization_id') THEN
    ALTER TABLE returns ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_returns_organization ON returns(organization_id);
  END IF;
  
  -- Orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='organization_id') THEN
    ALTER TABLE orders ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_orders_organization ON orders(organization_id);
  END IF;
  
  -- Expenses (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='expenses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='organization_id') THEN
      ALTER TABLE expenses ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_expenses_organization ON expenses(organization_id);
    END IF;
  END IF;
  
  -- Customer Credits (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customer_credits') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_credits' AND column_name='organization_id') THEN
      ALTER TABLE customer_credits ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_customer_credits_organization ON customer_credits(organization_id);
    END IF;
  END IF;
  
END $$;

-- ============================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all SaaS tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- PART 5: UPDATE RLS FOR EXISTING TABLES
-- ============================================

-- Products RLS
DROP POLICY IF EXISTS "Users can only access their organization's products" ON products;
CREATE POLICY "Users can access organization products"
  ON products FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Sales RLS
DROP POLICY IF EXISTS "Users can access organization sales" ON sales;
CREATE POLICY "Users can access organization sales"
  ON sales FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Returns RLS
DROP POLICY IF EXISTS "Users can access organization returns" ON returns;
CREATE POLICY "Users can access organization returns"
  ON returns FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Orders RLS
DROP POLICY IF EXISTS "Users can access organization orders" ON orders;
CREATE POLICY "Users can access organization orders"
  ON orders FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PART 6: FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to create organization and add owner as member
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_owner_id UUID
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (p_name, p_slug, p_owner_id)
  RETURNING id INTO v_org_id;
  
  -- Add owner as member
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (v_org_id, p_owner_id, 'owner', NOW());
  
  -- Update user profile
  UPDATE user_profiles
  SET current_organization_id = v_org_id
  WHERE id = p_owner_id;
  
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
    ELSE
      v_current_count := 0;
  END CASE;
  
  RETURN v_current_count < v_max_limit;
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

-- ============================================
-- PART 7: INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

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
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

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

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'SaaS Multi-Tenant Migration Completed Successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your first organization using create_organization_with_owner()';
  RAISE NOTICE '2. Update environment variables with Stripe keys';
  RAISE NOTICE '3. Test RLS policies with different users';
  RAISE NOTICE '4. Configure subscription webhooks';
END $$;
