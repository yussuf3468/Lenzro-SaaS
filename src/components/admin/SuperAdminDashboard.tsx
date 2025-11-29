// ============================================================================
// SUPER ADMIN DASHBOARD
// ============================================================================
// Dashboard for Yussuf Muse to manage all tenants and view system metrics

import React, { useEffect, useState } from "react";
import { useSuperAdmin } from "../../contexts/SuperAdminContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Building2,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Ban,
  Play,
  Trash2,
  Eye,
  LogOut,
} from "lucide-react";
import type { TenantStats } from "../../types/admin.types";

export default function SuperAdminDashboard() {
  const {
    isSuperAdmin,
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
  } = useSuperAdmin();

  const { signOut } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<TenantStats | null>(
    null
  );

  useEffect(() => {
    if (isSuperAdmin) {
      refreshData();
    }
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Ban className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have super admin permissions.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.owner_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || tenant.subscription_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      trial: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-green-100 text-green-800 border-green-200",
      past_due: "bg-yellow-100 text-yellow-800 border-yellow-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const icons = {
      trial: Clock,
      active: CheckCircle,
      past_due: AlertCircle,
      suspended: Ban,
      cancelled: XCircle,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles]
        }`}
      >
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all tenants and view system metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {systemMetrics.total_tenants}
                </p>
              </div>
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="text-green-600">
                ✓ {systemMetrics.active_tenants} Active
              </span>
              <span className="text-blue-600">
                ◷ {systemMetrics.trial_tenants} Trial
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {systemMetrics.total_users}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-600" />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Across all organizations
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {systemMetrics.total_products.toLocaleString()}
                </p>
              </div>
              <Package className="w-12 h-12 text-green-600" />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {systemMetrics.total_sales.toLocaleString()} sales recorded
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(systemMetrics.total_revenue)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-600" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <TrendingUp
                className={`w-4 h-4 ${
                  systemMetrics.growth_rate >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
              <span
                className={
                  systemMetrics.growth_rate >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {systemMetrics.growth_rate.toFixed(1)}% vs last month
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants by name, owner, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tenant.owner_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tenant.owner_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                      {tenant.subscription_plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tenant.subscription_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tenant.product_count}/
                      {tenant.max_products === -1 ? "∞" : tenant.max_products}{" "}
                      products
                    </div>
                    <div className="text-sm text-gray-500">
                      {tenant.user_count}/
                      {tenant.max_users === -1 ? "∞" : tenant.max_users} users
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(tenant.total_revenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tenant.total_sales} sales
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(tenant.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {tenant.subscription_status === "suspended" ? (
                        <button
                          onClick={() => activateTenant(tenant.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendTenant(tenant.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tenants found</p>
          </div>
        )}
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTenant.name}
                </h2>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Slug</p>
                  <p className="font-medium">{selectedTenant.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedTenant.subscription_status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner</p>
                  <p className="font-medium">{selectedTenant.owner_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTenant.owner_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium">
                    {selectedTenant.subscription_plan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Products</p>
                  <p className="font-medium">
                    {selectedTenant.product_count} /{" "}
                    {selectedTenant.max_products === -1
                      ? "Unlimited"
                      : selectedTenant.max_products}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="font-medium">
                    {selectedTenant.user_count} /{" "}
                    {selectedTenant.max_users === -1
                      ? "Unlimited"
                      : selectedTenant.max_users}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="font-medium">{selectedTenant.total_sales}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="font-medium">
                    {formatCurrency(selectedTenant.total_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {formatDate(selectedTenant.created_at)}
                  </p>
                </div>
                {selectedTenant.trial_ends_at && (
                  <div>
                    <p className="text-sm text-gray-600">Trial Ends</p>
                    <p className="font-medium">
                      {formatDate(selectedTenant.trial_ends_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
