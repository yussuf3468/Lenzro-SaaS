import React, { useState } from "react";
import { useSaaS } from "../contexts/SaaSContext";
import { Check, Zap, Crown, AlertCircle, TrendingUp } from "lucide-react";
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

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case "free":
        return <Check className="w-8 h-8 text-gray-500" />;
      case "basic":
        return <Zap className="w-8 h-8 text-blue-600" />;
      case "professional":
        return <TrendingUp className="w-8 h-8 text-primary-600" />;
      case "enterprise":
        return <Crown className="w-8 h-8 text-purple-600" />;
      default:
        return <Check className="w-8 h-8 text-gray-500" />;
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
            <p className="text-gray-600 mt-2">
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
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-600 font-semibold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Trial Warning */}
        {isTrialActive && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-medium">Trial Period Active</p>
              <p className="text-amber-700 text-sm mt-1">
                Your trial ends on{" "}
                {new Date(
                  currentOrganization?.trial_ends_at || ""
                ).toLocaleDateString()}
                . Upgrade now to continue using all features.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Plan Overview */}
      {subscription && (
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                Current Plan
              </p>
              <h2 className="text-3xl font-bold mt-2">
                {currentOrganization?.subscription_tier || "Free"}
              </h2>
              <p className="text-blue-100 mt-2">
                Renews on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors">
              Manage Billing
            </button>
          </div>

          {/* Usage Stats */}
          {usageStats && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm">Users</p>
                <p className="text-2xl font-bold mt-1">
                  {usageStats.current_users} /{" "}
                  {usageStats.max_users === 999999 ? "∞" : usageStats.max_users}
                </p>
                <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        usageStats.users_usage_percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm">Products</p>
                <p className="text-2xl font-bold mt-1">
                  {usageStats.current_products} /{" "}
                  {usageStats.max_products === 999999
                    ? "∞"
                    : usageStats.max_products}
                </p>
                <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        usageStats.products_usage_percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm">Orders (This Month)</p>
                <p className="text-2xl font-bold mt-1">
                  {usageStats.current_orders_this_month} /{" "}
                  {usageStats.max_orders_per_month === 999999
                    ? "∞"
                    : usageStats.max_orders_per_month}
                </p>
                <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        usageStats.orders_usage_percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm">Storage</p>
                <p className="text-2xl font-bold mt-1">
                  {usageStats.current_storage_gb} GB /{" "}
                  {usageStats.max_storage_gb} GB
                </p>
                <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        usageStats.storage_usage_percentage,
                        100
                      )}%`,
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Available Plans
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...subscriptionPlans]
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((plan) => {
              const isCurrent = isCurrentPlan(plan.slug);
              const isUpgrade = isPlanUpgrade(plan.slug);
              const price = getPlanPrice(plan);

              const isPremium =
                plan.slug === "professional" || plan.slug === "enterprise";

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
                    isCurrent
                      ? "ring-2 ring-primary-500 border-2 border-primary-500"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Top accent bar */}
                  <div
                    className={`h-2 ${
                      plan.slug === "free"
                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                        : plan.slug === "basic"
                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                        : plan.slug === "professional"
                        ? "bg-gradient-to-r from-primary-500 to-primary-700"
                        : "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                    }`}
                  ></div>

                  <div className="p-8">
                    {/* Current Plan Badge */}
                    {isCurrent && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          ✓ ACTIVE
                        </span>
                      </div>
                    )}

                    {/* Recommended Badge */}
                    {plan.slug === "professional" && !isCurrent && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                          ⭐ POPULAR
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                          plan.slug === "free"
                            ? "bg-gray-100"
                            : plan.slug === "basic"
                            ? "bg-blue-50"
                            : plan.slug === "professional"
                            ? "bg-primary-50"
                            : "bg-gradient-to-br from-purple-50 to-pink-50"
                        }`}
                      >
                        {getPlanIcon(plan.slug)}
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center py-6 border-y border-gray-100">
                      {price === 0 ? (
                        <div>
                          <div className="text-5xl font-black text-gray-900 mb-2">
                            FREE
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            Forever free plan
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline justify-center">
                            <span className="text-2xl font-semibold text-gray-400">
                              KES
                            </span>
                            <span className="text-5xl font-black text-gray-900 mx-2">
                              {price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 font-medium mt-2">
                            per {billingCycle === "monthly" ? "month" : "year"}
                          </div>
                          {billingCycle === "yearly" &&
                            plan.price_yearly_kes &&
                            plan.price_yearly_kes > 0 &&
                            plan.price_monthly_kes && (
                              <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                <span>💰</span>
                                <span>
                                  Save KES{" "}
                                  {(
                                    plan.price_monthly_kes * 12 -
                                    plan.price_yearly_kes
                                  ).toLocaleString()}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mt-6 space-y-3">
                      <li className="flex items-start text-sm text-gray-700">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                          <Check className="w-3 h-3 text-accent-600" />
                        </div>
                        <span>
                          <span className="font-semibold text-gray-900">
                            {plan.max_users === -1 ||
                            plan.max_users === 999999 ||
                            plan.max_users > 1000
                              ? "Unlimited"
                              : plan.max_users}
                          </span>{" "}
                          team {plan.max_users === 1 ? "member" : "members"}
                        </span>
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                          <Check className="w-3 h-3 text-accent-600" />
                        </div>
                        <span>
                          <span className="font-semibold text-gray-900">
                            {plan.max_products === -1 ||
                            plan.max_products === 999999 ||
                            plan.max_products > 10000
                              ? "Unlimited"
                              : plan.max_products.toLocaleString()}
                          </span>{" "}
                          products
                        </span>
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                          <Check className="w-3 h-3 text-accent-600" />
                        </div>
                        <span>
                          <span className="font-semibold text-gray-900">
                            {plan.max_storage_gb} GB
                          </span>{" "}
                          storage
                        </span>
                      </li>
                      {plan.max_orders_per_month !== null &&
                        plan.max_orders_per_month !== undefined && (
                          <li className="flex items-start text-sm text-gray-700">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                              <Check className="w-3 h-3 text-accent-600" />
                            </div>
                            <span>
                              <span className="font-semibold text-gray-900">
                                {plan.max_orders_per_month === -1 ||
                                plan.max_orders_per_month === 999999 ||
                                plan.max_orders_per_month > 10000
                                  ? "Unlimited"
                                  : plan.max_orders_per_month.toLocaleString()}
                              </span>{" "}
                              orders/month
                            </span>
                          </li>
                        )}
                      {plan.features?.advanced_reports && (
                        <li className="flex items-start text-sm text-gray-700">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                            <Check className="w-3 h-3 text-accent-600" />
                          </div>
                          <span>Advanced reports</span>
                        </li>
                      )}
                      {plan.features?.api_access && (
                        <li className="flex items-start text-sm text-gray-700">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                            <Check className="w-3 h-3 text-accent-600" />
                          </div>
                          <span>API access</span>
                        </li>
                      )}
                      {plan.features?.priority_support && (
                        <li className="flex items-start text-sm text-gray-700">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                            <Check className="w-3 h-3 text-accent-600" />
                          </div>
                          <span>Priority support</span>
                        </li>
                      )}
                      {plan.features?.custom_branding && (
                        <li className="flex items-start text-sm text-gray-700">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mr-3 mt-0.5">
                            <Check className="w-3 h-3 text-accent-600" />
                          </div>
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
                      className={`w-full mt-8 py-4 rounded-xl font-bold text-base transition-all duration-300 ${
                        isCurrent
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isUpgrade
                          ? plan.slug === "professional"
                            ? "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                            : plan.slug === "enterprise"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                            : "bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                          : "bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isCurrent
                        ? "✓ Current Plan"
                        : isUpgrade
                        ? plan.slug === "free"
                          ? "Get Started Free"
                          : `Upgrade to ${plan.name}`
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <h3 className="text-2xl font-bold text-gray-900">Upgrade Plan</h3>
            </div>

            <p className="text-gray-600 mb-6">
              You're upgrading to{" "}
              <span className="font-semibold">{selectedPlan.name}</span> plan.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Plan:</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlan.name}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Billing:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {billingCycle}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-semibold">Total:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${getPlanPrice(selectedPlan)}/
                  {billingCycle === "monthly" ? "mo" : "yr"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                Confirm Upgrade
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Payment integration coming in Phase 3
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
