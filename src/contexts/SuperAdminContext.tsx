// ============================================================================
// SUPER ADMIN CONTEXT
// ============================================================================
// Context for super admin functionality - separate from tenant context

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type {
  SuperAdmin,
  TenantStats,
  SystemMetrics,
} from "../types/admin.types";

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  superAdminData: SuperAdmin | null;
  tenants: TenantStats[];
  systemMetrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTenants: () => Promise<void>;
  fetchSystemMetrics: () => Promise<void>;
  suspendTenant: (tenantId: string) => Promise<void>;
  activateTenant: (tenantId: string) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(
  undefined
);

export function SuperAdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminData, setSuperAdminData] = useState<SuperAdmin | null>(null);
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is super admin
  useEffect(() => {
    if (!user) {
      setIsSuperAdmin(false);
      setSuperAdminData(null);
      setLoading(false);
      return;
    }

    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from("super_admins")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Not found - not a super admin
          setIsSuperAdmin(false);
          setSuperAdminData(null);
        } else {
          throw fetchError;
        }
      } else {
        setIsSuperAdmin(true);
        setSuperAdminData(data);
      }
    } catch (err: any) {
      console.error("Error checking super admin status:", err);
      setError(err.message);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    if (!isSuperAdmin) return;

    try {
      setError(null);

      // Fetch all organizations
      const { data: orgs, error: orgsError } = await (supabase as any)
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;
      if (!orgs || orgs.length === 0) {
        setTenants([]);
        return;
      }

      const orgIds = orgs.map((o: any) => o.id);
      const ownerIds = orgs.map((o: any) => o.owner_id);
      const planIds = orgs
        .map((o: any) => o.subscription_plan_id)
        .filter(Boolean);

      // Fetch owner profiles
      const { data: profiles } = await (supabase as any)
        .from("user_profiles")
        .select("user_id, full_name, email")
        .in("user_id", ownerIds);

      const profileMap = new Map(
        profiles?.map((p: any) => [
          p.user_id,
          { name: p.full_name, email: p.email },
        ]) || []
      );

      // Fetch subscription plans
      const { data: plans } = await (supabase as any)
        .from("subscription_plans")
        .select("id, name")
        .in("id", planIds);

      const planMap = new Map(plans?.map((p: any) => [p.id, p.name]) || []);

      // Fetch subscriptions
      const { data: subscriptions } = await (supabase as any)
        .from("subscriptions")
        .select("organization_id, status, current_period_end")
        .in("organization_id", orgIds);

      const subscriptionMap = new Map(
        subscriptions?.map((s: any) => [s.organization_id, s]) || []
      );

      // Fetch sales totals for each org
      const { data: salesData } = await (supabase as any)
        .from("sales")
        .select("organization_id, total_sale")
        .in("organization_id", orgIds);

      const salesByOrg =
        salesData?.reduce((acc: any, sale: any) => {
          if (!acc[sale.organization_id]) {
            acc[sale.organization_id] = { count: 0, revenue: 0 };
          }
          acc[sale.organization_id].count++;
          acc[sale.organization_id].revenue += parseFloat(sale.total_sale || 0);
          return acc;
        }, {}) || {};

      // Transform to TenantStats
      const tenantsData: TenantStats[] = orgs.map((org: any) => {
        const profile = profileMap.get(org.owner_id) || {
          name: "Unknown",
          email: "Unknown",
        };
        const plan = planMap.get(org.subscription_plan_id) || "Free";
        const subscription = subscriptionMap.get(org.id);

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          owner_email: profile.email,
          owner_name: profile.name,
          subscription_status: org.subscription_status,
          subscription_plan: plan,
          trial_ends_at: org.trial_ends_at,
          product_count: org.product_count,
          max_products: org.max_products,
          user_count: org.user_count,
          max_users: org.max_users,
          total_sales: salesByOrg[org.id]?.count || 0,
          total_revenue: salesByOrg[org.id]?.revenue || 0,
          created_at: org.created_at,
        };
      });

      setTenants(tenantsData);
    } catch (err: any) {
      console.error("Error fetching tenants:", err);
      setError(err.message);
    }
  };

  const fetchSystemMetrics = async () => {
    if (!isSuperAdmin) return;

    try {
      setError(null);

      // Get organization counts by status
      const { data: orgs } = await (supabase as any)
        .from("organizations")
        .select("subscription_status");

      const total_tenants = orgs?.length || 0;
      const active_tenants =
        orgs?.filter((o: any) => o.subscription_status === "active").length ||
        0;
      const trial_tenants =
        orgs?.filter((o: any) => o.subscription_status === "trial").length || 0;
      const suspended_tenants =
        orgs?.filter((o: any) => o.subscription_status === "suspended")
          .length || 0;

      // Get total users (organization members)
      const { count: total_users } = await (supabase as any)
        .from("organization_members")
        .select("*", { count: "exact", head: true });

      // Get total products
      const { count: total_products } = await (supabase as any)
        .from("products")
        .select("*", { count: "exact", head: true });

      // Get total sales and revenue
      const { data: sales } = await (supabase as any)
        .from("sales")
        .select("total_sale");

      const total_sales = sales?.length || 0;
      const total_revenue =
        sales?.reduce(
          (sum: number, s: any) => sum + parseFloat(s.total_sale || 0),
          0
        ) || 0;

      // Get monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: monthlySales } = await (supabase as any)
        .from("sales")
        .select("total_sale")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const monthly_revenue =
        monthlySales?.reduce(
          (sum: number, s: any) => sum + parseFloat(s.total_sale || 0),
          0
        ) || 0;

      // Calculate growth rate (compare to previous 30 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: previousSales } = await (supabase as any)
        .from("sales")
        .select("total_sale")
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString());

      const previous_revenue =
        previousSales?.reduce(
          (sum: number, s: any) => sum + parseFloat(s.total_sale || 0),
          0
        ) || 0;
      const growth_rate =
        previous_revenue > 0
          ? ((monthly_revenue - previous_revenue) / previous_revenue) * 100
          : 0;

      setSystemMetrics({
        total_tenants,
        active_tenants,
        trial_tenants,
        suspended_tenants,
        total_users: total_users || 0,
        total_products: total_products || 0,
        total_sales,
        total_revenue,
        monthly_revenue,
        growth_rate,
      });
    } catch (err: any) {
      console.error("Error fetching system metrics:", err);
      setError(err.message);
    }
  };

  const suspendTenant = async (tenantId: string) => {
    if (!isSuperAdmin) throw new Error("Unauthorized");

    try {
      const { error } = await (supabase as any)
        .from("organizations")
        .update({ subscription_status: "suspended" })
        .eq("id", tenantId);

      if (error) throw error;

      // Refresh data
      await fetchTenants();
      await fetchSystemMetrics();
    } catch (err: any) {
      console.error("Error suspending tenant:", err);
      throw err;
    }
  };

  const activateTenant = async (tenantId: string) => {
    if (!isSuperAdmin) throw new Error("Unauthorized");

    try {
      const { error } = await (supabase as any)
        .from("organizations")
        .update({ subscription_status: "active" })
        .eq("id", tenantId);

      if (error) throw error;

      // Refresh data
      await fetchTenants();
      await fetchSystemMetrics();
    } catch (err: any) {
      console.error("Error activating tenant:", err);
      throw err;
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!isSuperAdmin) throw new Error("Unauthorized");

    if (
      !confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Cascade delete will handle all related records
      const { error } = await (supabase as any)
        .from("organizations")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;

      // Refresh data
      await fetchTenants();
      await fetchSystemMetrics();
    } catch (err: any) {
      console.error("Error deleting tenant:", err);
      throw err;
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchTenants(), fetchSystemMetrics()]);
  };

  const value: SuperAdminContextType = {
    isSuperAdmin,
    superAdminData,
    tenants,
    systemMetrics,
    loading,
    error,
    fetchTenants,
    fetchSystemMetrics,
    suspendTenant,
    activateTenant,
    deleteTenant,
    refreshData,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }
  return context;
}
