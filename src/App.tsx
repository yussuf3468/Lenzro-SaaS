import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { SaaSProvider, useSaaS } from "./contexts/SaaSContext";
import {
  SuperAdminProvider,
  useSuperAdmin,
} from "./contexts/SuperAdminContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import SuperAdminDashboard from "./components/admin/SuperAdminDashboard";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import CategoryManagement from "./components/CategoryManagement";
import Sales from "./components/Sales";
import Returns from "./components/Returns";
import Search from "./components/Search";
import Reports from "./components/Reports";
import UserActivityDashboard from "./components/UserActivityDashboard";
import Orders from "./components/Orders";
import CustomerStoreNew from "./components/CustomerStoreNew";
import { Store, Settings } from "lucide-react";
import FinancialDashboard from "./components/FinancialDashboard";
import ExpenseManagement from "./components/ExpenseManagement";
import InitialInvestment from "./components/InitialInvestment";
import DebtManagement from "./components/DebtManagement";
import CustomerCredit from "./components/CustomerCredit";
import CyberServices from "./components/CyberServices";
import QueryDiagnostics from "./components/QueryDiagnostics";
import StaffDashboard from "./components/StaffDashboard";
import SubscriptionManagement from "./components/SubscriptionManagement";
import OrganizationSettings from "./components/OrganizationSettings";
import OnboardingFlow from "./components/OnboardingFlow";
import OrganizationSetupWizard from "./components/OrganizationSetupWizard";

function AppContent() {
  const [viewMode, setViewMode] = useState<"admin" | "customer">("admin");
  const { user, loading } = useAuth();
  const { currentOrganization, loading: saasLoading } = useSaaS();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ Load last active tab from localStorage (optional)
  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // ✅ Save current tab to localStorage (optional)
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  // ✅ Fixed logic: Only set default tab once when user logs in
  useEffect(() => {
    if (user) {
      setViewMode("admin");

      setActiveTab((prev) => {
        // Don't reset if user already has a tab open
        if (prev && prev !== "dashboard" && prev !== "staff-dashboard")
          return prev;

        // Default to dashboard for all users
        return "dashboard";
      });
    }
  }, [user]);

  if (loading || saasLoading || superAdminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-purple-900">Loading...</p>
          <p className="text-purple-700">Please wait...</p>
        </div>
      </div>
    );
  }

  // Customer view (no authentication required)
  if (viewMode === "customer") {
    return (
      <div className="relative">
        {/* View Toggle Button */}
        <button
          onClick={() => setViewMode("admin")}
          className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Admin Panel</span>
        </button>
        <CustomerStoreNew onAdminClick={() => setViewMode("admin")} />
      </div>
    );
  }

  // ✅ Show onboarding ONLY for users who are NOT logged in
  // Once they create account and log in, they should see their dashboard
  if (!user) {
    return <OnboardingFlow />;
  }

  // ✅ Show setup wizard for users with organizations that haven't completed setup
  if (user && currentOrganization && !currentOrganization.setup_completed) {
    return (
      <OrganizationSetupWizard
        organizationId={currentOrganization.id}
        organizationName={currentOrganization.name}
        onComplete={() => window.location.reload()}
      />
    );
  }

  // ✅ If user is logged in but has no organization, show error or dashboard
  // (This shouldn't happen since org is created during signup, but handle gracefully)
  if (user && !currentOrganization && !saasLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Organization Found
          </h2>
          <p className="text-gray-600 mb-6">
            Your account doesn't seem to be associated with an organization.
            Please contact support or create a new organization.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // ✅ PRIORITY 2: Super Admin Dashboard (for logged-in super admins with orgs)
  if (user && isSuperAdmin && viewMode === "admin") {
    return <SuperAdminDashboard />;
  }

  return (
    <div className="relative">
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "staff-dashboard" && <StaffDashboard />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "categories" && <CategoryManagement />}
        {activeTab === "sales" && <Sales />}
        {activeTab === "returns" && <Returns />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "search" && <Search />}
        {activeTab === "reports" && <Reports />}
        {activeTab === "user-activity" && <UserActivityDashboard />}
        {activeTab === "financial-dashboard" && <FinancialDashboard />}
        {activeTab === "expenses" && <ExpenseManagement />}
        {activeTab === "investments" && <InitialInvestment />}
        {activeTab === "debts" && <DebtManagement />}
        {activeTab === "customer-credit" && <CustomerCredit />}
        {activeTab === "cyber-services" && <CyberServices />}
        {activeTab === "subscription" && <SubscriptionManagement />}
        {activeTab === "organization" && <OrganizationSettings />}
      </Layout>

      {/* Dev-only diagnostics (hidden in production) */}
      {!import.meta.env.PROD && <QueryDiagnostics />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SuperAdminProvider>
        <SaaSProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </SaaSProvider>
      </SuperAdminProvider>
    </AuthProvider>
  );
}

export default App;
