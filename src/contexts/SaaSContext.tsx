import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type {
  SaaSContextType,
  Organization,
  OrganizationMember,
  OrganizationModule,
  Subscription,
  SubscriptionPlan,
  UsageStats,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  UpgradeSubscriptionRequest,
  UsageMetricType,
  ModuleName,
  SubscriptionError,
} from "../types/saas.types";

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // State
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [organizationModules, setOrganizationModules] = useState<
    OrganizationModule[]
  >([]);
  const [currentUserRole, setCurrentUserRole] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ============================================
  // Fetch subscription plans (public)
  // ============================================
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
    }
  }, []);

  // ============================================
  // Fetch user's organizations
  // ============================================
  const fetchOrganizations = useCallback(async () => {
    if (!user) return;

    try {
      // First, get the user's organization memberships
      const { data: memberships, error: memberError } = await (supabase as any)
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setOrganizations([]);
        return;
      }

      // Then fetch the actual organizations
      const orgIds = memberships.map((m: any) => m.organization_id);
      const { data: orgsData, error: orgsError } = await (supabase as any)
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      if (orgsError) throw orgsError;

      setOrganizations(orgsData || []);

      // Set current organization
      if (orgsData && orgsData.length > 0) {
        // Get user's preferred organization
        const { data: profileData } = await (supabase as any)
          .from("user_profiles")
          .select("current_organization_id")
          .eq("id", user.id)
          .single();

        const currentOrgId = profileData?.current_organization_id;
        const currentOrg =
          orgsData.find((org: any) => org.id === currentOrgId) || orgsData[0];
        setCurrentOrganization(currentOrg);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError(err as Error);
    }
  }, [user]);

  // ============================================
  // Fetch organization members
  // ============================================
  const fetchMembers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      // Fetch members
      const { data: membersData, error: membersError } = await (supabase as any)
        .from("organization_members")
        .select("*")
        .eq("organization_id", currentOrganization.id);

      if (membersError) throw membersError;

      // Fetch user profiles for all members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m: any) => m.user_id);
        const { data: profilesData, error: profilesError } = await (
          supabase as any
        )
          .from("user_profiles")
          .select("*")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Merge member data with profiles
        const membersWithProfiles = membersData.map((member: any) => ({
          ...member,
          user_profiles:
            profilesData?.find((p: any) => p.id === member.user_id) || null,
        }));

        setMembers(membersWithProfiles);

        // Set current user's role
        if (user) {
          const currentUserMember = membersWithProfiles.find(
            (m: any) => m.user_id === user.id
          );
          setCurrentUserRole(currentUserMember?.role || null);
        }
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  }, [currentOrganization, user]);

  // ============================================
  // Fetch subscription
  // ============================================
  const fetchSubscription = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      // Fetch subscription
      const { data: subscriptionData, error: subError } = await (
        supabase as any
      )
        .from("subscriptions")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .eq("status", "active")
        .single();

      if (subError && subError.code !== "PGRST116") throw subError;

      if (subscriptionData) {
        // Fetch the plan details
        const { data: planData, error: planError } = await (supabase as any)
          .from("subscription_plans")
          .select("*")
          .eq("id", subscriptionData.plan_id)
          .single();

        if (planError) throw planError;

        // Merge subscription with plan
        const subscriptionWithPlan = {
          ...subscriptionData,
          plan: planData,
        };

        setSubscription(subscriptionWithPlan);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  }, [currentOrganization]);

  // ============================================
  // Fetch usage stats
  // ============================================
  const fetchUsageStats = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      // Get current counts
      const [productsCount, ordersCount, membersCount] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrganization.id),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrganization.id)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrganization.id),
      ]);

      const stats: UsageStats = {
        current_users: membersCount.count || 0,
        max_users: currentOrganization.max_users,
        current_products: productsCount.count || 0,
        max_products: currentOrganization.max_products,
        current_orders_this_month: ordersCount.count || 0,
        max_orders_per_month: currentOrganization.max_orders_per_month,
        current_storage_gb: 0, // TODO: Calculate storage usage
        max_storage_gb: currentOrganization.max_storage_gb,
        users_usage_percentage: Math.round(
          ((membersCount.count || 0) / currentOrganization.max_users) * 100
        ),
        products_usage_percentage: Math.round(
          ((productsCount.count || 0) / currentOrganization.max_products) * 100
        ),
        orders_usage_percentage: Math.round(
          ((ordersCount.count || 0) /
            currentOrganization.max_orders_per_month) *
            100
        ),
        storage_usage_percentage: 0,
      };

      setUsageStats(stats);
    } catch (err) {
      console.error("Error fetching usage stats:", err);
    }
  }, [currentOrganization]);

  // ============================================
  // Organization Modules
  // ============================================
  const fetchModules = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await (supabase as any)
        .from("organization_modules")
        .select("*")
        .eq("organization_id", currentOrganization.id);

      if (error) throw error;
      setOrganizationModules(data || []);
    } catch (err) {
      console.error("Error fetching organization modules:", err);
    }
  }, [currentOrganization]);

  const hasModule = useCallback(
    (moduleName: ModuleName): boolean => {
      return organizationModules.some(
        (m) => m.module_name === moduleName && m.enabled
      );
    },
    [organizationModules]
  );

  // ============================================
  // Initialize
  // ============================================
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchSubscriptionPlans();
      if (user) {
        await fetchOrganizations();
      }
      setLoading(false);
    };

    initialize();
  }, [user, fetchSubscriptionPlans, fetchOrganizations]);

  useEffect(() => {
    if (currentOrganization) {
      fetchMembers();
      fetchSubscription();
      fetchUsageStats();
      fetchModules();
    }
  }, [
    currentOrganization,
    fetchMembers,
    fetchSubscription,
    fetchUsageStats,
    fetchModules,
  ]);

  // ============================================
  // Organization management
  // ============================================
  const createOrganization = useCallback(
    async (data: CreateOrganizationRequest): Promise<Organization> => {
      if (!user) throw new Error("User not authenticated");

      try {
        // Call Supabase function to create organization with owner
        const { data: orgData, error } = await supabase.rpc(
          "create_organization_with_owner",
          {
            p_name: data.name,
            p_slug: data.slug,
            p_owner_id: user.id,
          }
        );

        if (error) throw error;

        // Fetch the created organization
        const { data: org, error: fetchError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", orgData)
          .single();

        if (fetchError) throw fetchError;

        // Refresh organizations list
        await fetchOrganizations();

        return org;
      } catch (err) {
        console.error("Error creating organization:", err);
        throw err;
      }
    },
    [user, fetchOrganizations]
  );

  const updateOrganization = useCallback(
    async (data: UpdateOrganizationRequest): Promise<Organization> => {
      if (!currentOrganization) throw new Error("No organization selected");

      try {
        const { data: updated, error } = await supabase
          .from("organizations")
          .update(data)
          .eq("id", currentOrganization.id)
          .select()
          .single();

        if (error) throw error;

        setCurrentOrganization(updated);
        await fetchOrganizations();

        return updated;
      } catch (err) {
        console.error("Error updating organization:", err);
        throw err;
      }
    },
    [currentOrganization, fetchOrganizations]
  );

  const switchOrganization = useCallback(
    async (orgId: string) => {
      if (!user) return;

      const org = organizations.find((o) => o.id === orgId);
      if (!org) throw new Error("Organization not found");

      try {
        // Update user profile
        await supabase
          .from("user_profiles")
          .update({ current_organization_id: orgId })
          .eq("id", user.id);

        setCurrentOrganization(org);
      } catch (err) {
        console.error("Error switching organization:", err);
        throw err;
      }
    },
    [user, organizations]
  );

  // ============================================
  // Member management
  // ============================================
  const inviteMember = useCallback(
    async (data: InviteMemberRequest) => {
      if (!currentOrganization || !user)
        throw new Error("No organization selected");

      try {
        // Generate invitation token
        const token = crypto.randomUUID();

        const { error } = await supabase.from("invitations").insert({
          organization_id: currentOrganization.id,
          email: data.email,
          role: data.role,
          invited_by: user.id,
          token,
        });

        if (error) throw error;

        // TODO: Send invitation email with token
        console.log("Invitation sent to:", data.email, "with token:", token);
      } catch (err) {
        console.error("Error inviting member:", err);
        throw err;
      }
    },
    [currentOrganization, user]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!currentOrganization) throw new Error("No organization selected");

      try {
        const { error } = await supabase
          .from("organization_members")
          .delete()
          .eq("id", memberId)
          .eq("organization_id", currentOrganization.id);

        if (error) throw error;

        await fetchMembers();
      } catch (err) {
        console.error("Error removing member:", err);
        throw err;
      }
    },
    [currentOrganization, fetchMembers]
  );

  const updateMemberRole = useCallback(
    async (data: UpdateMemberRoleRequest) => {
      if (!currentOrganization) throw new Error("No organization selected");

      try {
        const { error } = await supabase
          .from("organization_members")
          .update({ role: data.role })
          .eq("id", data.member_id)
          .eq("organization_id", currentOrganization.id);

        if (error) throw error;

        await fetchMembers();
      } catch (err) {
        console.error("Error updating member role:", err);
        throw err;
      }
    },
    [currentOrganization, fetchMembers]
  );

  // ============================================
  // Subscription management
  // ============================================
  const createSubscription = useCallback(
    async (data: CreateSubscriptionRequest): Promise<Subscription> => {
      if (!currentOrganization) throw new Error("No organization selected");

      try {
        // TODO: Implement PayPal/IAP integration
        // This is a placeholder - actual implementation in Phase 3
        throw new Error("Subscription creation not yet implemented");
      } catch (err) {
        console.error("Error creating subscription:", err);
        throw err;
      }
    },
    [currentOrganization]
  );

  const cancelSubscription = useCallback(
    async (data: CancelSubscriptionRequest) => {
      if (!subscription) throw new Error("No active subscription");

      try {
        // TODO: Implement PayPal cancellation
        throw new Error("Subscription cancellation not yet implemented");
      } catch (err) {
        console.error("Error cancelling subscription:", err);
        throw err;
      }
    },
    [subscription]
  );

  const upgradeSubscription = useCallback(
    async (data: UpgradeSubscriptionRequest): Promise<Subscription> => {
      if (!subscription) throw new Error("No active subscription");

      try {
        // TODO: Implement PayPal upgrade
        throw new Error("Subscription upgrade not yet implemented");
      } catch (err) {
        console.error("Error upgrading subscription:", err);
        throw err;
      }
    },
    [subscription]
  );

  // ============================================
  // Usage limits
  // ============================================
  const checkLimit = useCallback(
    (limitType: UsageMetricType): boolean => {
      if (!currentOrganization || !usageStats) return false;

      switch (limitType) {
        case "users":
          return usageStats.current_users < usageStats.max_users;
        case "products":
          return usageStats.current_products < usageStats.max_products;
        case "orders":
          return (
            usageStats.current_orders_this_month <
            usageStats.max_orders_per_month
          );
        case "storage":
          return usageStats.current_storage_gb < usageStats.max_storage_gb;
        default:
          return true;
      }
    },
    [currentOrganization, usageStats]
  );

  const value: SaaSContextType = {
    currentOrganization,
    organizations,
    switchOrganization,
    createOrganization,
    updateOrganization,
    members,
    inviteMember,
    removeMember,
    updateMemberRole,
    subscription,
    subscriptionPlans,
    createSubscription,
    cancelSubscription,
    upgradeSubscription,
    usageStats,
    checkLimit,
    organizationModules,
    hasModule,
    fetchModules,
    currentUserRole,
    loading,
    error,
  };

  return <SaaSContext.Provider value={value}>{children}</SaaSContext.Provider>;
}

export function useSaaS() {
  const context = useContext(SaaSContext);
  if (context === undefined) {
    throw new Error("useSaaS must be used within a SaaSProvider");
  }
  return context;
}
