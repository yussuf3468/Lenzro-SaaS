import React, { useState } from "react";
import { useSaaS } from "../contexts/SaaSContext";
import { Check, AlertCircle, X } from "lucide-react";
import type { SubscriptionPlan, BillingCycle } from "../types/saas.types";

export default function SubscriptionManagement() {
  const { subscription, subscriptionPlans, currentOrganization, usageStats } =
    useSaaS();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const currentPlanSlug = currentOrganization?.subscription_tier || "free";
  const isTrialActive = currentOrganization?.subscription_status === "trial";

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      // TODO: Implement payment flow (Phase 3)
      console.log("Upgrading to:", selectedPlan.name, "Billing:", billingCycle);
      alert("Payment integration coming in Phase 3!");
    } catch (error) {
      console.error("Upgrade error:", error);
    }
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    return billingCycle === "monthly"
      ? plan.price_monthly_kes || 0
      : plan.price_yearly_kes || 0;
  };

  const isPlanUpgrade = (planSlug: string) => {
    const tiers = ["free", "basic", "premium", "enterprise"];
    const currentIndex = tiers.indexOf(currentPlanSlug);
    const planIndex = tiers.indexOf(planSlug);
    return planIndex > currentIndex;
  };

  const isCurrentPlan = (planSlug: string) => {
    return planSlug === currentPlanSlug;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscription</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isTrialActive
              ? `Trial ends ${new Date(
                  currentOrganization?.trial_ends_at || ""
                ).toLocaleDateString()}`
              : "Manage your subscription and billing"}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 font-medium">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Trial Warning */}
      {isTrialActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium text-sm">Trial Period Active</p>
            <p className="text-amber-700 text-sm mt-1">
              Your trial ends on{" "}
              {new Date(
                currentOrganization?.trial_ends_at || ""
              ).toLocaleDateString()}
              . Upgrade to continue using all features.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Overview */}
      {subscription && (
        <div className="bg-gray-900 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                Current Plan
              </p>
              <h2 className="text-2xl font-semibold mt-1 capitalize">
                {currentOrganization?.subscription_tier || "Free"}
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                Renews on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <button className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Manage Billing
            </button>
          </div>

          {/* Usage Stats */}
          {usageStats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-xs font-medium">Users</p>
                <p className="text-lg font-semibold mt-1">
                  {usageStats.current_users}
                  <span className="text-gray-500 text-sm font-normal">
                    {" "}/ {usageStats.max_users === 999999 ? "∞" : usageStats.max_users}
                  </span>
                </p>
                <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full"
                    style={{
                      width: `${Math.min(usageStats.users_usage_percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-xs font-medium">Products</p>
                <p className="text-lg font-semibold mt-1">
                  {usageStats.current_products}
                  <span className="text-gray-500 text-sm font-normal">
                    {" "}/ {usageStats.max_products === 999999 ? "∞" : usageStats.max_products}
                  </span>
                </p>
                <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full"
                    style={{
                      width: `${Math.min(usageStats.products_usage_percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-xs font-medium">Orders / Month</p>
                <p className="text-lg font-semibold mt-1">
                  {usageStats.current_orders_this_month}
                  <span className="text-gray-500 text-sm font-normal">
                    {" "}/ {usageStats.max_orders_per_month === 999999 ? "∞" : usageStats.max_orders_per_month}
                  </span>
                </p>
                <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full"
                    style={{
                      width: `${Math.min(usageStats.orders_usage_percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-xs font-medium">Storage</p>
                <p className="text-lg font-semibold mt-1">
                  {usageStats.current_storage_gb} GB
                  <span className="text-gray-500 text-sm font-normal">
                    {" "}/ {usageStats.max_storage_gb} GB
                  </span>
                </p>
                <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full"
                    style={{
                      width: `${Math.min(usageStats.storage_usage_percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Plans
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...subscriptionPlans]
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((plan) => {
              const isCurrent = isCurrentPlan(plan.slug);
              const isUpgrade = isPlanUpgrade(plan.slug);
              const price = getPlanPrice(plan);
              const isRecommended = plan.slug === "professional" && !isCurrent;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-lg border transition-shadow hover:shadow-md ${
                    isCurrent
                      ? "border-gray-900 ring-1 ring-gray-900"
                      : isRecommended
                      ? "border-primary-500 ring-1 ring-primary-500"
                      : "border-gray-200"
                  }`}
                >
                  <div className="p-5">
                    {/* Badges */}
                    {isCurrent && (
                      <span className="inline-block bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded mb-3">
                        Current
                      </span>
                    )}
                    {isRecommended && (
                      <span className="inline-block bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded mb-3">
                        Recommended
                      </span>
                    )}
                    {!isCurrent && !isRecommended && (
                      <div className="h-6 mb-3" />
                    )}

                    {/* Plan Header */}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2 min-h-[40px]">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mt-4 mb-5">
                      {price === 0 ? (
                        <div>
                          <span className="text-3xl font-semibold text-gray-900">
                            Free
                          </span>
                          <p className="text-gray-500 text-sm mt-1">
                            No credit card required
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline">
                            <span className="text-sm text-gray-500">KES</span>
                            <span className="text-3xl font-semibold text-gray-900 ml-1">
                              {price.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">
                              /{billingCycle === "monthly" ? "mo" : "yr"}
                            </span>
                          </div>
                          {billingCycle === "yearly" &&
                            plan.price_yearly_kes &&
                            plan.price_yearly_kes > 0 &&
                            plan.price_monthly_kes && (
                              <p className="text-green-600 text-sm mt-1">
                                Save KES{" "}
                                {(
                                  plan.price_monthly_kes * 12 -
                                  plan.price_yearly_kes
                                ).toLocaleString()}
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-5">
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span>
                          {plan.max_users === -1 ||
                          plan.max_users === 999999 ||
                          plan.max_users > 1000
                            ? "Unlimited"
                            : plan.max_users}{" "}
                          {plan.max_users === 1 ? "user" : "users"}
                        </span>
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span>
                          {plan.max_products === -1 ||
                          plan.max_products === 999999 ||
                          plan.max_products > 10000
                            ? "Unlimited"
                            : plan.max_products.toLocaleString()}{" "}
                          products
                        </span>
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span>{plan.max_storage_gb} GB storage</span>
                      </li>
                      {plan.max_orders_per_month !== null &&
                        plan.max_orders_per_month !== undefined && (
                          <li className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span>
                              {plan.max_orders_per_month === -1 ||
                              plan.max_orders_per_month === 999999 ||
                              plan.max_orders_per_month > 10000
                                ? "Unlimited"
                                : plan.max_orders_per_month.toLocaleString()}{" "}
                              orders/month
                            </span>
                          </li>
                        )}
                      {plan.features?.advanced_reports && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Advanced reports</span>
                        </li>
                      )}
                      {plan.features?.api_access && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>API access</span>
                        </li>
                      )}
                      {plan.features?.priority_support && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Priority support</span>
                        </li>
                      )}
                      {plan.features?.custom_branding && (
                        <li className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Custom branding</span>
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() =>
                        !isCurrent && isUpgrade && handleUpgrade(plan)
                      }
                      disabled={isCurrent || !isUpgrade}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isUpgrade
                          ? isRecommended
                            ? "bg-primary-600 hover:bg-primary-700 text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCurrent
                        ? "Current Plan"
                        : isUpgrade
                        ? `Upgrade to ${plan.name}`
                        : "Downgrade"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade to {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Plan</span>
                  <span className="font-medium text-gray-900">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Billing cycle</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {billingCycle}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-900 font-medium">Total</span>
                  <span className="text-xl font-semibold text-gray-900">
                    KES {getPlanPrice(selectedPlan).toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                Confirm Upgrade
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center pb-5">
              Payment integration coming in Phase 3
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
