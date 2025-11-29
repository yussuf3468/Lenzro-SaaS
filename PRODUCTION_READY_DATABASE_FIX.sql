-- =====================================================
-- PRODUCTION READY DATABASE FIX
-- =====================================================
-- This script fixes missing columns and adds modular organization features
-- Run this in your Supabase SQL editor

-- 1. Add missing display_order column to subscription_plans
-- =====================================================
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Ensure subscription plans have proper data
-- Update or insert subscription plans with proper pricing
INSERT INTO subscription_plans (name, slug, description, price_monthly_kes, price_yearly_kes, max_products, max_users, max_storage_gb, features, sort_order, display_order, is_active)
VALUES
  ('Free', 'free', 'Perfect for getting started', 0, 0, 100, 3, 1, 
   '["100 products", "3 team members", "1GB storage", "Basic reports", "Email support"]'::jsonb, 1, 1, true),
  ('Basic', 'basic', 'For growing businesses', 4999, 49990, 500, 10, 10,
   '["500 products", "10 team members", "10GB storage", "Advanced reports", "Priority support", "Custom branding"]'::jsonb, 2, 2, true),
  ('Professional', 'professional', 'For established businesses', 10000, 100000, 2000, 25, 50,
   '["2000 products", "25 team members", "50GB storage", "Advanced analytics", "24/7 support", "Custom branding", "API access"]'::jsonb, 3, 3, true),
  ('Enterprise', 'enterprise', 'For large organizations', 20000, 200000, -1, -1, 200,
   '["Unlimited products", "Unlimited users", "200GB storage", "Premium analytics", "Dedicated support", "White label", "API access", "Custom integrations"]'::jsonb, 4, 4, true)
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_kes = EXCLUDED.price_monthly_kes,
  price_yearly_kes = EXCLUDED.price_yearly_kes,
  max_products = EXCLUDED.max_products,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Create cyber_services table
-- =====================================================
CREATE TABLE IF NOT EXISTS cyber_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cyber_services_org ON cyber_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_cyber_services_date ON cyber_services(date DESC);

-- Enable RLS
ALTER TABLE cyber_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cyber_services
CREATE POLICY "Users can view cyber_services in their organization"
  ON cyber_services FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cyber_services in their organization"
  ON cyber_services FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cyber_services in their organization"
  ON cyber_services FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cyber_services in their organization"
  ON cyber_services FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Create organization_modules table (NEW)
-- =====================================================
-- This table stores which modules each organization has enabled
CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL CHECK (module_name IN (
    'inventory',
    'orders',
    'customers',
    'cyber_services',
    'analytics',
    'staff',
    'suppliers',
    'reports',
    'pos',
    'ecommerce'
  )),
  enabled BOOLEAN DEFAULT TRUE,
  configured BOOLEAN DEFAULT FALSE, -- Whether the module has been set up
  configuration JSONB DEFAULT '{}'::jsonb, -- Module-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_org_modules_org ON organization_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_modules_enabled ON organization_modules(organization_id, enabled);

-- Enable RLS
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_modules
CREATE POLICY "Users can view modules in their organization"
  ON organization_modules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage modules"
  ON organization_modules FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 4. Add setup_completed flag to organizations
-- =====================================================
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN (
  'retail',
  'cyber_cafe',
  'restaurant',
  'service_provider',
  'wholesale',
  'ecommerce',
  'other'
));

-- 5. Create function to initialize default modules based on business type
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_organization_modules(
  p_organization_id UUID,
  p_business_type TEXT
)
RETURNS void AS $$
BEGIN
  -- Common modules for all business types
  INSERT INTO organization_modules (organization_id, module_name, enabled)
  VALUES 
    (p_organization_id, 'customers', TRUE),
    (p_organization_id, 'staff', TRUE),
    (p_organization_id, 'analytics', TRUE),
    (p_organization_id, 'reports', TRUE);
  
  -- Retail-specific modules
  IF p_business_type IN ('retail', 'wholesale') THEN
    INSERT INTO organization_modules (organization_id, module_name, enabled)
    VALUES 
      (p_organization_id, 'inventory', TRUE),
      (p_organization_id, 'orders', TRUE),
      (p_organization_id, 'suppliers', TRUE),
      (p_organization_id, 'pos', TRUE);
  END IF;
  
  -- Cyber cafe specific modules
  IF p_business_type = 'cyber_cafe' THEN
    INSERT INTO organization_modules (organization_id, module_name, enabled)
    VALUES 
      (p_organization_id, 'cyber_services', TRUE);
  END IF;
  
  -- E-commerce modules
  IF p_business_type IN ('ecommerce', 'retail') THEN
    INSERT INTO organization_modules (organization_id, module_name, enabled)
    VALUES 
      (p_organization_id, 'ecommerce', TRUE);
  END IF;
  
  -- Restaurant modules
  IF p_business_type = 'restaurant' THEN
    INSERT INTO organization_modules (organization_id, module_name, enabled)
    VALUES 
      (p_organization_id, 'inventory', TRUE),
      (p_organization_id, 'orders', TRUE),
      (p_organization_id, 'pos', TRUE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to check if organization has module enabled
-- =====================================================
CREATE OR REPLACE FUNCTION has_module(
  p_organization_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_modules
    WHERE organization_id = p_organization_id
    AND module_name = p_module_name
    AND enabled = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_modules_updated_at
  BEFORE UPDATE ON organization_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cyber_services_updated_at
  BEFORE UPDATE ON cyber_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON organization_modules TO authenticated;
GRANT ALL ON cyber_services TO authenticated;

-- Done!
SELECT 'Database schema fixed successfully!' AS status;

-- =====================================================
-- 9. Create product_categories table (NEW)
-- =====================================================
-- This allows organizations to create and manage their own product categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Hex color for UI display
  icon TEXT, -- Icon name or emoji
  parent_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL, -- For nested categories
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_org ON product_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(organization_id, is_active);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Users can view categories in their organization"
  ON product_categories FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories in their organization"
  ON product_categories FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories in their organization"
  ON product_categories FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories in their organization"
  ON product_categories FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- 10. Add category_id to products table
-- =====================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- 11. Create default categories for existing organizations
-- =====================================================
-- Insert default categories for organizations that don't have any
INSERT INTO product_categories (organization_id, name, description, color, icon, display_order)
SELECT DISTINCT 
  o.id as organization_id,
  'General' as name,
  'General products' as description,
  '#6366f1' as color,
  '📦' as icon,
  0 as display_order
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_categories pc WHERE pc.organization_id = o.id
)
ON CONFLICT (organization_id, name) DO NOTHING;

-- 12. Function to initialize default categories for new organizations
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_default_categories(p_organization_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if organization already has categories
  IF NOT EXISTS (SELECT 1 FROM product_categories WHERE organization_id = p_organization_id) THEN
    -- Insert default categories
    INSERT INTO product_categories (organization_id, name, description, color, icon, display_order)
    VALUES 
      (p_organization_id, 'General', 'General products', '#6366f1', '📦', 0),
      (p_organization_id, 'Electronics', 'Electronic devices and accessories', '#3b82f6', '💻', 1),
      (p_organization_id, 'Clothing', 'Apparel and fashion items', '#ec4899', '👕', 2),
      (p_organization_id, 'Food & Beverages', 'Food items and drinks', '#10b981', '🍔', 3),
      (p_organization_id, 'Books & Stationery', 'Books, notebooks, and office supplies', '#f59e0b', '📚', 4);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Update trigger for product_categories
-- =====================================================
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON product_categories TO authenticated;

-- Done with categories!
SELECT 'Product categories system created successfully!' AS status;
