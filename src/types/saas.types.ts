// ============================================
// SaaS Multi-Tenant Type Definitions
// ============================================

export type SubscriptionTier = "free" | "basic" | "premium" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "trial"
  | "past_due"
  | "incomplete"
  | "trialing"
  | "unpaid";

export type OrganizationRole =
  | "owner"
  | "admin"
  | "manager"
  | "staff"
  | "viewer";

export type PaymentMethod =
  | "paypal"
  | "google_play"
  | "apple_iap"
  | "mpesa"
  | "bank_transfer";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type UsageMetricType =
  | "users"
  | "products"
  | "orders"
  | "storage"
  | "api_calls";

export type BusinessType =
  | "retail"
  | "cyber_cafe"
  | "restaurant"
  | "service_provider"
  | "wholesale"
  | "ecommerce"
  | "other";

export type ModuleName =
  | "inventory"
  | "orders"
  | "customers"
  | "cyber_services"
  | "analytics"
  | "staff"
  | "suppliers"
  | "reports"
  | "pos"
  | "ecommerce";

// ============================================
// Database Table Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;

  // Business Configuration
  business_type: BusinessType | null;
  setup_completed: boolean;

  // Subscription
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  subscription_start_date: string;
  subscription_end_date: string | null;

  // Limits
  max_users: number;
  max_products: number;
  max_storage_gb: number;
  max_orders_per_month: number;

  // Features
  features: {
    api_access: boolean;
    advanced_reports: boolean;
    custom_branding: boolean;
    priority_support: boolean;
    mobile_access: boolean;
    white_label?: boolean;
  };

  // Metadata
  settings: Record<string, any>;
  logo_url: string | null;
  primary_color: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganizationModule {
  id: string;
  organization_id: string;
  module_name: ModuleName;
  enabled: boolean;
  configured: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  permissions: string[];
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;

  // Joined data (when fetching with user info)
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  current_organization_id: string | null;
  onboarding_completed: boolean;
  email_verified: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Joined data
  current_organization?: Organization;
  organizations?: OrganizationMember[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly?: number; // Legacy field
  price_yearly?: number | null; // Legacy field
  price_monthly_kes: number; // Actual database field
  price_yearly_kes: number | null; // Actual database field
  currency: string;

  // Limits
  max_users: number | null;
  max_products: number | null;
  max_storage_gb: number | null;
  max_orders_per_month: number | null;

  // Features
  features: Record<string, any>;

  // Provider IDs
  paypal_plan_id_monthly: string | null;
  paypal_plan_id_yearly: string | null;
  google_play_product_id: string | null;
  apple_product_id: string | null;

  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string | null;

  // Payment providers
  paypal_subscription_id: string | null;
  paypal_payer_id: string | null;
  google_purchase_token: string | null;
  apple_transaction_id: string | null;

  // Status
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;

  // Trial
  trial_start: string | null;
  trial_end: string | null;

  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Joined data
  plan?: SubscriptionPlan;
  organization?: Organization;
}

export interface PaymentTransaction {
  id: string;
  organization_id: string;
  subscription_id: string | null;

  // Transaction
  amount: number;
  currency: string;
  status: PaymentStatus;

  // Payment method
  payment_method: PaymentMethod | null;
  payment_method_details: Record<string, any> | null;

  // Provider IDs
  paypal_transaction_id: string | null;
  paypal_order_id: string | null;
  google_order_id: string | null;
  apple_receipt_data: string | null;

  // Invoice
  invoice_url: string | null;
  receipt_url: string | null;

  // Metadata
  description: string | null;
  metadata: Record<string, any>;

  processed_at: string | null;
  created_at: string;

  // Joined data
  organization?: Organization;
  subscription?: Subscription;
}

export interface UsageTracking {
  id: string;
  organization_id: string;
  metric_type: UsageMetricType;
  metric_value: number;
  period_start: string;
  period_end: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;

  // Joined data
  organization?: Organization;
  inviter?: UserProfile;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;

  // Joined data
  user?: UserProfile;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

export interface CreateOrganizationResponse {
  organization: Organization;
  member: OrganizationMember;
}

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: Record<string, any>;
  logo_url?: string;
  primary_color?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: OrganizationRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface UpdateMemberRoleRequest {
  member_id: string;
  role: OrganizationRole;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  billing_cycle: BillingCycle;
  payment_method: PaymentMethod;
  payment_token?: string; // PayPal order ID or token
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  client_secret?: string; // For PayPal order confirmation
}

export interface CancelSubscriptionRequest {
  cancel_immediately?: boolean;
}

export interface UpgradeSubscriptionRequest {
  new_plan_id: string;
  billing_cycle?: BillingCycle;
}

export interface UsageStats {
  current_users: number;
  max_users: number;
  current_products: number;
  max_products: number;
  current_orders_this_month: number;
  max_orders_per_month: number;
  current_storage_gb: number;
  max_storage_gb: number;

  // Percentages
  users_usage_percentage: number;
  products_usage_percentage: number;
  orders_usage_percentage: number;
  storage_usage_percentage: number;
}

// ============================================
// Stripe Webhook Types
// ============================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export type PayPalWebhookType =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed";

// ============================================
// Mobile IAP Types
// ============================================

export interface GooglePlayPurchase {
  orderId: string;
  packageName: string;
  productId: string;
  purchaseTime: number;
  purchaseState: number;
  purchaseToken: string;
  acknowledged: boolean;
}

export interface AppleIAPReceipt {
  transactionId: string;
  productId: string;
  transactionDate: string;
  originalTransactionId: string;
  receiptData: string;
}

export interface ValidatePurchaseRequest {
  platform: "android" | "ios";
  purchaseToken?: string; // Android
  receiptData?: string; // iOS
  productId: string;
}

export interface ValidatePurchaseResponse {
  valid: boolean;
  subscription?: Subscription;
  error?: string;
}

// ============================================
// Context Types (for React)
// ============================================

export interface SaaSContextType {
  // Organization
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (
    data: CreateOrganizationRequest
  ) => Promise<Organization>;
  updateOrganization: (
    data: UpdateOrganizationRequest
  ) => Promise<Organization>;

  // Members
  members: OrganizationMember[];
  inviteMember: (data: InviteMemberRequest) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (data: UpdateMemberRoleRequest) => Promise<void>;

  // Subscription
  subscription: Subscription | null;
  subscriptionPlans: SubscriptionPlan[];
  createSubscription: (
    data: CreateSubscriptionRequest
  ) => Promise<Subscription>;
  cancelSubscription: (data: CancelSubscriptionRequest) => Promise<void>;
  upgradeSubscription: (
    data: UpgradeSubscriptionRequest
  ) => Promise<Subscription>;

  // Usage
  usageStats: UsageStats | null;
  checkLimit: (limitType: UsageMetricType) => boolean;

  // Modules
  organizationModules: OrganizationModule[];
  hasModule: (moduleName: ModuleName) => boolean;
  fetchModules: () => Promise<void>;

  // User Role
  currentUserRole: OrganizationRole | null;

  // Loading states
  loading: boolean;
  error: Error | null;
}

// ============================================
// Utility Types
// ============================================

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================
// Error Types
// ============================================

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code:
      | "LIMIT_EXCEEDED"
      | "PAYMENT_FAILED"
      | "SUBSCRIPTION_INACTIVE"
      | "UNKNOWN",
    public details?: any
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public requiredRole?: OrganizationRole) {
    super(message);
    this.name = "AuthorizationError";
  }
}
