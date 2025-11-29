import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useSaaS } from "../contexts/SaaSContext";
import type { Product } from "../types";

/**
 * Custom hook for cached Supabase queries
 * Reduces egress costs by caching data client-side
 *
 * @example
 * const { data: products } = useSupabaseQuery('products', () =>
 *   supabase.from('products').select('*')
 * );
 */
export function useSupabaseQuery<T = any>(
  key: string | string[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      // Ensure we never return undefined - return empty array for null array data
      if (data === null || data === undefined) {
        return [] as T; // For array queries, return empty array
      }
      return data as T;
    },
    staleTime: Infinity, // ❌ NEVER auto-refetch - cache forever!
    gcTime: 60 * 60 * 1000, // 1 hour - keep cache in memory longer
    refetchOnWindowFocus: false, // ❌ Don't refetch on window focus
    refetchOnMount: false, // ❌ Don't refetch on mount
    refetchOnReconnect: false, // ❌ Don't refetch on reconnect
    ...options,
  });
}

/**
 * Custom hook for queries that return data directly (not wrapped in {data, error})
 * Use this for custom queries that handle errors internally
 */
export function useSupabaseQueryDirect<T = any>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const data = await queryFn();
      // Ensure we never return undefined
      if (data === null || data === undefined) {
        return [] as T; // For array queries, return empty array
      }
      return data;
    },
    staleTime: Infinity, // ❌ NEVER auto-refetch - cache forever!
    gcTime: 60 * 60 * 1000, // 1 hour - keep cache in memory longer
    refetchOnWindowFocus: false, // ❌ Don't refetch on window focus
    refetchOnMount: false, // ❌ Don't refetch on mount
    refetchOnReconnect: false, // ❌ Don't refetch on reconnect
    ...options,
  });
}

/**
 * Hook for products data with caching (MULTI-TENANT)
 */
export function useProducts() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<Product[]>(
    ["products", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };

      const { data, error } = await (supabase as any)
        .from("products")
        .select(
          `
          *,
          category:product_categories(name, color, icon)
        `
        )
        .eq("organization_id", currentOrganization.id);

      return { data, error };
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for sales data with caching (MULTI-TENANT)
 * Use manual refresh button to update data and save egress costs
 */
export function useSales() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["sales", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("sales")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for orders data with caching (MULTI-TENANT)
 */
export function useOrders() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["orders", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("orders")
        .select("*, order_items(*)")
        .eq("organization_id", currentOrganization.id);
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for pending orders count (MULTI-TENANT)
 */
export function usePendingOrdersCount() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQueryDirect(
    ["pending-orders-count", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return 0;

      const { count, error } = await (supabase as any)
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .in("status", ["pending", "confirmed"]);

      if (error) {
        console.error("Error fetching pending orders count:", error);
        return 0;
      }

      return count ?? 0;
    },
    {
      enabled: !!currentOrganization,
      staleTime: Infinity,
      refetchInterval: false,
    }
  );
}

/**
 * Hook for customer credits with caching (MULTI-TENANT)
 */
export function useCustomerCredits() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQueryDirect(
    ["customer-credits", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return [];

      const { data: credits, error } = await (supabase as any)
        .from("customer_credits")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return credits || [];
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for credit payments with caching (MULTI-TENANT)
 */
export function useCreditPayments() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQueryDirect(
    ["credit-payments", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return [];

      const { data: payments, error } = await (supabase as any)
        .from("credit_payments")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return payments || [];
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for expenses with caching (MULTI-TENANT)
 */
export function useExpenses() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["expenses", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("expenses")
        .select("*, expense_categories(name)")
        .eq("organization_id", currentOrganization.id);
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for debts with caching (MULTI-TENANT)
 */
export function useDebts() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["debts", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("debts")
        .select("*")
        .eq("organization_id", currentOrganization.id);
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for publicly visible products (published and in stock) with caching (MULTI-TENANT)
 */
export function usePublicProducts() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<Product[]>(
    ["public-products", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("products")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .eq("published", true)
        .gt("quantity_in_stock", 0)
        .order("featured", { ascending: false })
        .order("name");
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for featured products list (limited) with caching (MULTI-TENANT)
 */
export function useFeaturedProducts(limit = 8) {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<Product[]>(
    ["featured-products", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("products")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .gt("quantity_in_stock", 0)
        .order("quantity_in_stock", { ascending: true })
        .limit(limit);
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for initial investments data with caching (MULTI-TENANT)
 */
export function useInitialInvestments() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["initial-investments", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("initial_investments")
        .select("*")
        .eq("organization_id", currentOrganization.id);
    },
    {
      enabled: !!currentOrganization,
    }
  );
}

/**
 * Hook for returns data with caching (MULTI-TENANT)
 */
export function useReturns() {
  const { currentOrganization } = useSaaS();

  return useSupabaseQuery<any[]>(
    ["returns", currentOrganization?.id],
    async () => {
      if (!currentOrganization) return { data: [], error: null };
      return await (supabase as any)
        .from("returns")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("return_date", { ascending: false });
    },
    {
      enabled: !!currentOrganization,
    }
  );
}
