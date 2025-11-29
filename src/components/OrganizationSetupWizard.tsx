import React, { useState } from "react";
import {
  Building2,
  ShoppingCart,
  Wifi,
  Utensils,
  Package,
  Globe,
  Briefcase,
  Check,
  ArrowRight,
  Store,
  Users,
  BarChart3,
  FileText,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Module {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
}

interface BusinessType {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultModules: string[];
}

const businessTypes: BusinessType[] = [
  {
    value: "retail",
    label: "Retail Shop",
    description: "Physical store selling products to customers",
    icon: <Store className="w-8 h-8" />,
    defaultModules: [
      "inventory",
      "orders",
      "customers",
      "pos",
      "suppliers",
      "staff",
      "analytics",
      "reports",
    ],
  },
  {
    value: "cyber_cafe",
    label: "Cyber Cafe",
    description: "Internet cafe offering computer and printing services",
    icon: <Wifi className="w-8 h-8" />,
    defaultModules: [
      "cyber_services",
      "customers",
      "staff",
      "analytics",
      "reports",
    ],
  },
  {
    value: "restaurant",
    label: "Restaurant",
    description: "Food service business with orders and inventory",
    icon: <Utensils className="w-8 h-8" />,
    defaultModules: [
      "inventory",
      "orders",
      "customers",
      "pos",
      "staff",
      "analytics",
      "reports",
    ],
  },
  {
    value: "wholesale",
    label: "Wholesale",
    description: "Bulk selling to other businesses",
    icon: <Package className="w-8 h-8" />,
    defaultModules: [
      "inventory",
      "orders",
      "customers",
      "suppliers",
      "staff",
      "analytics",
      "reports",
    ],
  },
  {
    value: "ecommerce",
    label: "E-Commerce",
    description: "Online store selling products",
    icon: <Globe className="w-8 h-8" />,
    defaultModules: [
      "inventory",
      "orders",
      "customers",
      "ecommerce",
      "suppliers",
      "staff",
      "analytics",
      "reports",
    ],
  },
  {
    value: "service_provider",
    label: "Service Provider",
    description: "Offering professional services",
    icon: <Briefcase className="w-8 h-8" />,
    defaultModules: ["customers", "staff", "analytics", "reports"],
  },
];

const allModules: Module[] = [
  {
    name: "inventory",
    label: "Inventory Management",
    description: "Track products, stock levels, and manage items",
    icon: <Package className="w-5 h-5" />,
  },
  {
    name: "orders",
    label: "Order Management",
    description: "Process sales, manage orders and transactions",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  {
    name: "customers",
    label: "Customer Management",
    description: "Manage customer data and relationships",
    icon: <Users className="w-5 h-5" />,
    required: true,
  },
  {
    name: "cyber_services",
    label: "Cyber Services",
    description: "Manage internet cafe services and computer usage",
    icon: <Wifi className="w-5 h-5" />,
  },
  {
    name: "pos",
    label: "Point of Sale",
    description: "Fast checkout and payment processing",
    icon: <Store className="w-5 h-5" />,
  },
  {
    name: "ecommerce",
    label: "E-Commerce",
    description: "Online store and web orders",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    name: "suppliers",
    label: "Supplier Management",
    description: "Track suppliers and purchase orders",
    icon: <Truck className="w-5 h-5" />,
  },
  {
    name: "staff",
    label: "Staff Management",
    description: "Manage employees and access control",
    icon: <Users className="w-5 h-5" />,
    required: true,
  },
  {
    name: "analytics",
    label: "Analytics",
    description: "Business insights and dashboards",
    icon: <BarChart3 className="w-5 h-5" />,
    required: true,
  },
  {
    name: "reports",
    label: "Reports",
    description: "Generate business reports",
    icon: <FileText className="w-5 h-5" />,
    required: true,
  },
];

interface Props {
  organizationId: string;
  organizationName: string;
  onComplete: () => void;
}

export default function OrganizationSetupWizard({
  organizationId,
  organizationName,
  onComplete,
}: Props) {
  const [step, setStep] = useState(1);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBusinessTypeSelect = (type: string) => {
    const business = businessTypes.find((b) => b.value === type);
    if (business) {
      setSelectedBusinessType(type);
      setSelectedModules(business.defaultModules);
    }
  };

  const toggleModule = (moduleName: string) => {
    const module = allModules.find((m) => m.name === moduleName);
    if (module?.required) return; // Can't toggle required modules

    setSelectedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      // Update organization with business type and setup completed
      const { error: orgError } = await (supabase as any)
        .from("organizations")
        .update({
          business_type: selectedBusinessType,
          setup_completed: true,
        })
        .eq("id", organizationId);

      if (orgError) throw orgError;

      // Initialize modules using the database function
      const { error: moduleError } = await (supabase as any).rpc(
        "initialize_organization_modules",
        {
          p_organization_id: organizationId,
          p_business_type: selectedBusinessType,
        }
      );

      if (moduleError) throw moduleError;

      // Enable/disable custom selected modules
      for (const moduleName of allModules.map((m) => m.name)) {
        const shouldBeEnabled = selectedModules.includes(moduleName);

        // Upsert module state
        await (supabase as any).from("organization_modules").upsert(
          {
            organization_id: organizationId,
            module_name: moduleName,
            enabled: shouldBeEnabled,
          },
          {
            onConflict: "organization_id,module_name",
          }
        );
      }

      onComplete();
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <Building2 className="w-12 h-12 mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            Welcome to {organizationName}!
          </h1>
          <p className="text-indigo-100">
            Let's customize your system to match your business needs
          </p>
        </div>

        {/* Progress */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span className="ml-2 font-medium">Business Type</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div
              className={`flex items-center ${
                step >= 2 ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                {step > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span className="ml-2 font-medium">Select Modules</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">
                What type of business are you?
              </h2>
              <p className="text-gray-600 mb-6">
                This helps us recommend the right features for you
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleBusinessTypeSelect(type.value)}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                      selectedBusinessType === type.value
                        ? "border-indigo-600 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          selectedBusinessType === type.value
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{type.label}</h3>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                      {selectedBusinessType === type.value && (
                        <Check className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedBusinessType}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your Modules</h2>
              <p className="text-gray-600 mb-6">
                We've pre-selected modules based on your business type.
                Customize as needed.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allModules.map((module) => {
                  const isSelected = selectedModules.includes(module.name);
                  const isRequired = module.required;

                  return (
                    <button
                      key={module.name}
                      onClick={() => toggleModule(module.name)}
                      disabled={isRequired}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      } ${
                        isRequired
                          ? "opacity-75 cursor-not-allowed"
                          : "hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {module.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{module.label}</h3>
                            {isRequired && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {module.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-600 font-semibold hover:text-gray-800 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || selectedModules.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                  {!loading && <Check className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
