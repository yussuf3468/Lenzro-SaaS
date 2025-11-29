-- ========================================
-- FIX DATABASE POLICIES AND FOREIGN KEYS
-- Run this in Supabase SQL Editor
-- ========================================

-- First, drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ========================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid recursion)
-- ========================================

-- Function to check if user is owner of an organization
CREATE OR REPLACE FUNCTION is_organization_owner(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id
      AND organization_members.user_id = user_id
      AND role = 'owner'
  );
$$;

-- Function to check if user is owner or admin of an organization
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id
      AND organization_members.user_id = user_id
      AND role IN ('owner', 'admin')
  );
$$;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE organization_members.user_id = user_id;
$$;

-- ========================================
-- ORGANIZATIONS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Organization owners can update their organization
CREATE POLICY "Owners can update organization"
  ON organizations
  FOR UPDATE
  USING (is_organization_owner(id, auth.uid()));

-- Policy: Organization owners can delete their organization
CREATE POLICY "Owners can delete organization"
  ON organizations
  FOR DELETE
  USING (is_organization_owner(id, auth.uid()));

-- Policy: Authenticated users can create organizations (handled by function)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- ORGANIZATION_MEMBERS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view their memberships"
  ON organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Organization owners can view all members
CREATE POLICY "Owners can view all members"
  ON organization_members
  FOR SELECT
  USING (is_organization_owner(organization_id, auth.uid()));

-- Policy: Organization owners/admins can insert members
CREATE POLICY "Owners and admins can add members"
  ON organization_members
  FOR INSERT
  WITH CHECK (is_organization_admin(organization_id, auth.uid()));

-- Policy: Organization owners/admins can update members
CREATE POLICY "Owners and admins can update members"
  ON organization_members
  FOR UPDATE
  USING (is_organization_admin(organization_id, auth.uid()));

-- Policy: Organization owners can delete members
CREATE POLICY "Owners can delete members"
  ON organization_members
  FOR DELETE
  USING (is_organization_owner(organization_id, auth.uid()));

-- ========================================
-- USER_PROFILES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Policy: Organization members can view profiles of other members
CREATE POLICY "Members can view org profiles"
  ON user_profiles
  FOR SELECT
  USING (
    id IN (
      SELECT om.user_id
      FROM organization_members om
      WHERE om.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ========================================
-- SUBSCRIPTION_PLANS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view subscription plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ========================================
-- SUBSCRIPTIONS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's subscription
CREATE POLICY "Users can view org subscription"
  ON subscriptions
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Owners can manage subscriptions
CREATE POLICY "Owners can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (is_organization_owner(organization_id, auth.uid()));

-- ========================================
-- PRODUCTS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's products
CREATE POLICY "Users can view org products"
  ON products
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Staff can manage products
CREATE POLICY "Staff can manage products"
  ON products
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- SALES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's sales
CREATE POLICY "Users can view org sales"
  ON sales
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Staff can manage sales
CREATE POLICY "Staff can manage sales"
  ON sales
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- ORDERS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's orders
CREATE POLICY "Users can view org orders"
  ON orders
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Staff can manage orders
CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- EXPENSES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's expenses
CREATE POLICY "Users can view org expenses"
  ON expenses
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Authorized staff can manage expenses
CREATE POLICY "Authorized staff can manage expenses"
  ON expenses
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- RETURNS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's returns
CREATE POLICY "Users can view org returns"
  ON returns
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Staff can manage returns
CREATE POLICY "Staff can manage returns"
  ON returns
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- CUSTOMER_CREDITS TABLE
-- ========================================

-- Enable RLS
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's credits
CREATE POLICY "Users can view org credits"
  ON customer_credits
  FOR SELECT
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- Policy: Staff can manage credits
CREATE POLICY "Staff can manage credits"
  ON customer_credits
  FOR ALL
  USING (organization_id IN (SELECT get_user_organizations(auth.uid())));

-- ========================================
-- VERIFY FOREIGN KEYS EXIST
-- ========================================

-- Drop existing foreign keys first to recreate them properly
DO $$
BEGIN
  ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
  ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_organization_id_fkey;
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_organization_id_fkey;
  ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_organization_id_fkey;
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_organization_id_fkey;
  ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_organization_id_fkey;
  ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_organization_id_fkey;
  ALTER TABLE customer_credits DROP CONSTRAINT IF EXISTS customer_credits_organization_id_fkey;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if constraints don't exist
END $$;

-- Add foreign keys with proper naming for PostgREST
DO $$ 
BEGIN
  -- organization_members -> organizations (named "organization" for PostgREST)
  ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- organization_members -> auth.users
  ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- subscriptions -> organizations
  ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- products -> organizations
  ALTER TABLE products
  ADD CONSTRAINT products_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- sales -> organizations
  ALTER TABLE sales
  ADD CONSTRAINT sales_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- orders -> organizations
  ALTER TABLE orders
  ADD CONSTRAINT orders_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- expenses -> organizations
  ALTER TABLE expenses
  ADD CONSTRAINT expenses_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- returns -> organizations
  ALTER TABLE returns
  ADD CONSTRAINT returns_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

  -- customer_credits -> organizations
  ALTER TABLE customer_credits
  ADD CONSTRAINT customer_credits_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
END $$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if policies are created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Success message
SELECT '✅ All policies and foreign keys have been created successfully!' as status;
