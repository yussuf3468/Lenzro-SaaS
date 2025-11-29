// ============================================================================
// SUPER ADMIN TYPES
// ============================================================================
// Types for super admin dashboard and functionality

export interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface TenantStats {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  subscription_status:
    | "trial"
    | "active"
    | "past_due"
    | "suspended"
    | "cancelled";
  subscription_plan: string;
  trial_ends_at: string | null;
  product_count: number;
  max_products: number;
  user_count: number;
  max_users: number;
  total_sales: number;
  total_revenue: number;
  created_at: string;
}

export interface SystemMetrics {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_users: number;
  total_products: number;
  total_sales: number;
  total_revenue: number;
  monthly_revenue: number;
  growth_rate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  new_tenants: number;
  churned_tenants: number;
}

export interface PlanDistribution {
  plan_name: string;
  tenant_count: number;
  revenue: number;
  percentage: number;
}
