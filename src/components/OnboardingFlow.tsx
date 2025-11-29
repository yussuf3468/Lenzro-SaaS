import { useState } from "react";
import { useSaaS } from "../contexts/SaaSContext";
import { supabase } from "../lib/supabase";
import Login from "./Login";
import {
  Rocket,
  Building2,
  User,
  CheckCircle,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Shield,
  Clock,
  Package,
  Users,
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
  Menu,
  X,
  Play,
  Smartphone,
  Check,
} from "lucide-react";

export default function OnboardingFlow() {
  const { subscriptionPlans } = useSaaS();

  const [currentStep, setCurrentStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Step 1: Organization
  const [orgName, setOrgName] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Step 2: Owner
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Step 3: Plan
  const [selectedPlan, setSelectedPlan] = useState("free");

  // Success state for showing credentials
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from org name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Generate a secure random password
  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      setError("Please enter organization name");
      return;
    }
    if (!ownerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!ownerEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(orgName);
      const generatedPassword = generatePassword();

      // Step 1: Create the user account with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: ownerEmail.trim(),
          password: generatedPassword,
          options: {
            data: {
              full_name: ownerName.trim(),
              phone: ownerPhone.trim() || null,
            },
          },
        }
      );

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log("User account created:", authData.user.id);

      // Step 2: Create organization with the new user as owner
      const { data: orgData, error: createError } = await (supabase as any).rpc(
        "create_organization_with_owner",
        {
          org_name: orgName.trim(),
          org_slug: slug,
          owner_user_id: authData.user.id,
          owner_full_name: ownerName.trim(),
          owner_phone: ownerPhone.trim() || null,
        }
      );

      if (createError) {
        console.error("RPC Error:", createError);
        throw createError;
      }

      console.log("Organization created successfully:", orgData);

      // Store credentials to show to user
      setCredentials({
        email: ownerEmail.trim(),
        password: generatedPassword,
      });

      // Move to success step
      setCurrentStep(3);
    } catch (err: any) {
      console.error("Organization creation error:", err);

      // More descriptive error messages
      if (err.message?.includes("User already registered")) {
        setError(
          "This email is already registered. Please use a different email or contact support."
        );
      } else if (err.code === "PGRST202") {
        setError(
          "Database function not found. Please ensure the database is properly set up. Contact support if this persists."
        );
      } else if (
        err.message?.includes("duplicate") ||
        err.message?.includes("unique")
      ) {
        setError(
          "Organization name already exists. Please choose a different name."
        );
      } else {
        setError(
          err.message || "Failed to create organization. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = () => {
    // For now, just move to tutorial (payment in Phase 5)
    setCurrentStep(4);
  };

  const completeOnboarding = () => {
    window.location.reload(); // Refresh to show tenant dashboard
  };

  // Progress steps metadata
  const steps = [
    {
      id: 0,
      title: "Welcome",
      description: "Start here",
    },
    {
      id: 1,
      title: "Organization Details",
      description: "Your business information",
    },
    {
      id: 2,
      title: "Owner Information",
      description: "Tell us about yourself",
    },
    {
      id: 3,
      title: "Choose Your Plan",
      description: "Select the perfect plan",
    },
    {
      id: 4,
      title: "Welcome Tutorial",
      description: "Quick tour of features",
    },
  ];

  // If user clicks "Sign In", show the login page instead
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowLogin(false)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              ← Back to Home
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Lenzro
              </h1>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to access your dashboard
            </p>
          </div>
          <Login onLogin={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Lenzro
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-semibold -mt-1">
                  Business Management
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Contact
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="hidden sm:block px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Get Started Free
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block py-2 text-sm font-semibold text-gray-700"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block py-2 text-sm font-semibold text-gray-700"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="block py-2 text-sm font-semibold text-gray-700"
              >
                Testimonials
              </a>
              <a
                href="#contact"
                className="block py-2 text-sm font-semibold text-gray-700"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Only show on step 0 */}
      {currentStep === 0 && (
        <>
          <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Hero Content */}
                <div className="space-y-6 sm:space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-600">
                      #1 Business Management Platform in Kenya
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                    Grow Your Business{" "}
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      10x Faster
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                    Complete inventory management, sales tracking, and business
                    analytics in one powerful platform. Trusted by over{" "}
                    <span className="font-bold text-indigo-600">
                      10,000+ businesses
                    </span>{" "}
                    across East Africa.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-700 text-lg font-bold rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all flex items-center justify-center gap-3">
                      <Play className="w-5 h-5" />
                      <span>Watch Demo</span>
                    </button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Rated 4.9/5 by 10,000+ users
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Animated Dashboard Preview */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
                  <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                          <ShoppingCart className="w-6 h-6 text-indigo-600 mb-2" />
                          <p className="text-2xl font-black text-gray-900">
                            1,234
                          </p>
                          <p className="text-xs text-gray-600 font-semibold">
                            Sales Today
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
                          <p className="text-2xl font-black text-gray-900">
                            KES 45K
                          </p>
                          <p className="text-xs text-gray-600 font-semibold">
                            Revenue
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                          <Package className="w-6 h-6 text-purple-600 mb-2" />
                          <p className="text-2xl font-black text-gray-900">
                            567
                          </p>
                          <p className="text-xs text-gray-600 font-semibold">
                            Products
                          </p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-900">
                            Sales Performance
                          </p>
                          <span className="text-xs text-emerald-600 font-bold">
                            ↑ 23%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full w-[65%] bg-gradient-to-r from-emerald-600 to-green-600 rounded-full"></div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full w-[45%] bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="py-12 bg-white border-y border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    10K+
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">
                    Active Businesses
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                    1M+
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">
                    Transactions Daily
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    99.9%
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                    24/7
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">Support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                  Everything You Need to{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Scale Your Business
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Powerful features designed to help you manage, grow, and
                  succeed
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    icon: Package,
                    title: "Smart Inventory",
                    description:
                      "Track stock levels, get low-stock alerts, and manage products effortlessly",
                    color: "from-indigo-600 to-blue-600",
                  },
                  {
                    icon: ShoppingCart,
                    title: "Fast POS System",
                    description:
                      "Lightning-fast checkout with barcode scanning and multiple payment options",
                    color: "from-emerald-600 to-green-600",
                  },
                  {
                    icon: BarChart3,
                    title: "Real-time Analytics",
                    description:
                      "Powerful insights and reports to make data-driven business decisions",
                    color: "from-purple-600 to-pink-600",
                  },
                  {
                    icon: Users,
                    title: "Team Management",
                    description:
                      "Add unlimited staff with role-based access and permissions",
                    color: "from-orange-600 to-red-600",
                  },
                  {
                    icon: Smartphone,
                    title: "Mobile App",
                    description:
                      "Manage your business on-the-go with our native mobile apps",
                    color: "from-cyan-600 to-blue-600",
                  },
                  {
                    icon: Shield,
                    title: "Bank-level Security",
                    description:
                      "Your data is encrypted and protected with enterprise-grade security",
                    color: "from-gray-700 to-gray-900",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                      }}
                    ></div>
                    <div
                      className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div
            id="testimonials"
            className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 px-4"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                  Loved by Business Owners
                </h2>
                <p className="text-lg text-indigo-100">
                  See what our customers have to say
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    name: "Amina Hassan",
                    role: "Owner, Sabrin Electronics",
                    avatar: "AH",
                    content:
                      "Lenzro transformed how I manage my electronics shop. Sales tracking is effortless, and I can see my profits in real-time. Best investment I've made!",
                    rating: 5,
                  },
                  {
                    name: "John Kamau",
                    role: "Manager, Fresh Mart",
                    avatar: "JK",
                    content:
                      "We increased our efficiency by 300%! The inventory management is brilliant. No more stock-outs or overstocking. Highly recommended!",
                    rating: 5,
                  },
                  {
                    name: "Fatuma Ali",
                    role: "CEO, Fashion Hub",
                    avatar: "FA",
                    content:
                      "The mobile app is a game-changer. I can check my business performance anywhere. Customer support is amazing too. Worth every shilling!",
                    rating: 5,
                  },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-2xl shadow-xl"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-xl text-indigo-100 mb-8">
                  Join 10,000+ businesses already growing with Lenzro
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                  >
                    Start Free Trial - No Credit Card Required
                  </button>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8 text-indigo-100 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-300 py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black text-white">
                      Lenzro
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    The all-in-one business management platform for modern
                    entrepreneurs.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-4">Contact</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Have questions? We're here to help.
                  </p>
                  <p className="text-sm text-gray-300">support@lenzro.com</p>
                </div>
              </div>
              <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">
                  © 2025 Lenzro. Made with ❤️ in Kenya. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Onboarding Form Steps (Step 1+) */}
      {currentStep > 0 && (
        <div className="flex items-center justify-center min-h-screen px-4 py-20 sm:py-24">
          <div className="w-full max-w-4xl">
            {/* Modern Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Step {currentStep} of {steps.length - 1}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                    {steps[currentStep]?.title}
                  </h2>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Exit
                </button>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    style={{
                      width: `${(currentStep / (steps.length - 1)) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-600 to-primary-700 transition-all duration-500"
                  ></div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between mt-4">
                  {steps.slice(1).map((step) => (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step.id < currentStep
                            ? "bg-accent-600 text-white"
                            : step.id === currentStep
                            ? "bg-primary-600 text-white ring-4 ring-primary-100"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-600 mt-2 hidden sm:block">
                        {step.title.split(" ")[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Step Content Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 border border-gray-100">
              {/* Step 0: Welcome Message */}
              {currentStep === 0 && (
                <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-4 sm:mb-6">
                      <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                      Welcome to Lenzro! 🎉
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl font-medium text-gray-700 mb-2 px-3">
                      Your All-in-One Business Management Platform
                    </p>
                    <p className="text-gray-500 text-sm sm:text-base px-3">
                      Trusted by thousands of businesses worldwide
                    </p>
                  </div>

                  {/* Message from Creator - Premium Card */}
                  <div className="relative">
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-6 border border-gray-200">
                      <div className="flex items-start gap-3 sm:gap-4 lg:gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl lg:text-2xl">
                            YM
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                            <p className="text-xs sm:text-sm font-bold text-secondary-900">
                              A Message from Yussuf Muse
                            </p>
                            <span className="px-2 py-0.5 sm:py-1 bg-primary-100 text-primary-800 text-[10px] sm:text-xs font-semibold rounded-full w-fit">
                              FOUNDER
                            </span>
                          </div>
                          <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                            Hey there! 👋 I'm excited to have you here. I built
                            Lenzro to help business owners like you manage
                            inventory, track sales, and grow your business
                            effortlessly. Whether you're running a small shop or
                            managing multiple stores, Lenzro has everything you
                            need to succeed.{" "}
                            <span className="font-semibold text-primary-700">
                              Let's get you set up in less than 2 minutes!
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Features - Premium Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-6 sm:mt-8">
                    <div className="group relative">
                      <div className="relative text-center p-4 sm:p-5 lg:p-6 bg-white rounded-lg border border-gray-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 bg-emerald-600 rounded-lg mb-3 sm:mb-4">
                          <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-base sm:text-lg">
                          Easy Inventory
                        </h3>
                        <p className="text-sm text-gray-600">
                          Track products & stock levels
                        </p>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="relative text-center p-4 sm:p-5 lg:p-6 bg-white rounded-lg border border-gray-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 bg-primary-600 rounded-lg mb-3 sm:mb-4">
                          <ShoppingCart className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">
                          Fast Sales
                        </h3>
                        <p className="text-sm text-gray-600">
                          Quick checkout & payments
                        </p>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="relative text-center p-4 sm:p-5 lg:p-6 bg-white rounded-lg border border-gray-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 bg-secondary-600 rounded-lg mb-3 sm:mb-4">
                          <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">
                          Smart Reports
                        </h3>
                        <p className="text-sm text-gray-600">
                          Real-time business insights
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6 py-4 sm:py-5 lg:py-6 flex-wrap">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-xs sm:text-sm font-semibold">
                        Secure & Safe
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold">
                        10,000+ Users
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-semibold">
                        4.9/5 Rating
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 sm:py-4 rounded-lg font-semibold flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg transition-colors"
                  >
                    <span>Get Started - It's Free</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      onClick={() => setShowLogin(true)}
                      className="text-primary-600 hover:text-primary-700 font-bold hover:underline transition-colors"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              )}

              {/* Step 1: Organization Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                      <Building2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Let's start with your business details
                    </h3>
                    <p className="text-gray-500 text-sm">
                      This information helps us set up your account
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                        placeholder="e.g., Sabrin Electronics"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        This is your business name that customers will see
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Type{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                      >
                        <option value="">Select business type</option>
                        <option value="retail">🏪 Retail Store</option>
                        <option value="wholesale">📦 Wholesale</option>
                        <option value="electronics">💻 Electronics Shop</option>
                        <option value="grocery">🛒 Grocery/Supermarket</option>
                        <option value="pharmacy">💊 Pharmacy</option>
                        <option value="fashion">👕 Fashion/Clothing</option>
                        <option value="restaurant">🍽️ Restaurant/Cafe</option>
                        <option value="other">✨ Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(0)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={!orgName.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Owner Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
                      <User className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Tell us about yourself
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Owner information for{" "}
                      <span className="font-semibold text-indigo-600">
                        {orgName}
                      </span>
                    </p>
                  </div>{" "}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                        placeholder="e.g., Sabrin Mohamed"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                        placeholder="your@email.com"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        We'll send your login credentials to this email
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number (M-Pesa){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all"
                        placeholder="254712345678"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Required for M-Pesa payments (format: 254712345678)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateOrganization}
                      disabled={
                        !ownerName.trim() || !ownerEmail.trim() || loading
                      }
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Success & Credentials */}
              {currentStep === 3 && credentials && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      🎉 Account Created Successfully!
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Your organization{" "}
                      <span className="font-semibold text-indigo-600">
                        {orgName}
                      </span>{" "}
                      is ready
                    </p>
                  </div>

                  {/* Credentials Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Shield className="w-6 h-6 text-indigo-600 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">
                          Your Login Credentials
                        </h4>
                        <p className="text-sm text-gray-600">
                          Save these credentials securely. We've also sent them
                          to your email.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white rounded-xl p-4 border border-indigo-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          EMAIL
                        </label>
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                          <span className="font-mono text-sm text-gray-900">
                            {credentials.email}
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(credentials.email)
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          PASSWORD
                        </label>
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                          <span className="font-mono text-sm text-gray-900">
                            {credentials.password}
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                credentials.password
                              )
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800">
                        <strong>Important:</strong> Please save these
                        credentials now. You'll need them to log in to your
                        account.
                      </p>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      What's Next?
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Check your email for login instructions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Use the credentials above to log in</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Start adding products and managing inventory
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Explore all features with your free trial</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 3: Choose Your Plan (only show if no credentials) */}
              {currentStep === 3 && !credentials && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                      <Sparkles className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Choose your perfect plan
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">
                      Start with 14-day free trial • Upgrade anytime
                    </p>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">
                        No credit card required
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {subscriptionPlans.map((plan) => {
                      const isRecommended = plan.slug === "basic";
                      const isPro = plan.slug === "pro";
                      const isFree = plan.slug === "free";

                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.slug)}
                          className={`group relative p-5 sm:p-6 lg:p-8 border-2 rounded-2xl sm:rounded-3xl transition-all duration-300 text-left transform hover:-translate-y-2 ${
                            selectedPlan === plan.slug
                              ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 ring-4 ring-emerald-200 shadow-2xl scale-105"
                              : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-xl"
                          }`}
                        >
                          {isRecommended && (
                            <span className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
                              🔥 MOST POPULAR
                            </span>
                          )}
                          {isPro && (
                            <span className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
                              🚀 UNLIMITED
                            </span>
                          )}
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 mb-3 sm:mb-4">
                            {plan.name}
                          </h3>
                          <div className="mb-4 sm:mb-5 lg:mb-6">
                            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-700">
                              {isFree
                                ? "FREE"
                                : `KES ${(
                                    plan.price_monthly_kes || 0
                                  ).toLocaleString()}`}
                            </span>
                            {!isFree && (
                              <span className="text-gray-500 font-medium text-sm sm:text-base">
                                /month
                              </span>
                            )}
                          </div>
                          <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              </div>
                              <span className="font-semibold text-gray-700">
                                {plan.max_products === -1
                                  ? "♾️ Unlimited"
                                  : plan.max_products}{" "}
                                products
                              </span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              </div>
                              <span className="font-semibold text-gray-700">
                                {plan.max_users === -1
                                  ? "♾️ Unlimited"
                                  : plan.max_users}{" "}
                                team members
                              </span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              </div>
                              <span className="font-semibold text-gray-700">
                                {plan.max_storage_gb}GB storage
                              </span>
                            </li>
                            {plan.features &&
                              Array.isArray(plan.features) &&
                              plan.features.map(
                                (feature: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-3"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <span className="font-medium text-gray-600">
                                      {feature}
                                    </span>
                                  </li>
                                )
                              )}
                          </ul>
                          {selectedPlan === plan.slug && (
                            <div className="mt-4 sm:mt-5 lg:mt-6 flex items-center justify-center gap-1.5 sm:gap-2 text-emerald-600 font-bold text-sm sm:text-base">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Selected</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSelectPlan}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>No credit card • Cancel anytime • 14-day trial</span>
                  </div>
                </div>
              )}

              {/* Step 4: Welcome Tutorial */}
              {currentStep === 4 && (
                <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 lg:w-24 lg:h-24 mb-4 sm:mb-5 lg:mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full animate-spin-slow"></div>
                      <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Rocket className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3 px-2">
                      🎉 Welcome to {orgName}!
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-3">
                      Here's a quick tour of what you can do
                    </p>
                  </div>

                  {/* Tutorial Cards - Premium Design */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border-2 border-blue-100 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-5 shadow-lg">
                          <Package className="w-6 h-6 sm:w-6.5 sm:h-6.5 lg:w-7 lg:h-7 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 mb-2 sm:mb-3">
                          📦 Manage Products
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                          Add products with prices, stock levels, and photos.
                          Track inventory automatically.
                        </p>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-100 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                          <ShoppingCart className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">
                          💰 Record Sales
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Quick point-of-sale interface. Accept cash, M-Pesa, or
                          card payments.
                        </p>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                          <BarChart3 className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">
                          📊 View Reports
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Track sales, profits, top products, and business
                          performance in real-time.
                        </p>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-100 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                          <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3">
                          📈 Grow Your Business
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Add team members, manage expenses, and scale with
                          insights.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={completeOnboarding}
                    className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3.5 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg overflow-hidden transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Rocket className="relative w-5 h-5 sm:w-6 sm:h-6 animate-bounce-subtle" />
                    <span className="relative">Go to Dashboard</span>
                  </button>

                  <p className="text-center text-xs sm:text-sm text-gray-500 font-medium px-3">
                    💡 You can access help and tutorials anytime from the
                    dashboard
                  </p>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center mt-6 sm:mt-8 bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200">
              <p className="text-gray-600 text-xs sm:text-sm font-medium px-2">
                Need help? Contact us at{" "}
                <a
                  href="mailto:support@lenzro.app"
                  className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors"
                >
                  support@lenzro.app
                </a>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-500">
                <span>Secure & Encrypted</span>
                <span className="hidden sm:inline">•</span>
                <span>24/7 Support</span>
                <span className="hidden sm:inline">•</span>
                <span>Made with ❤️ in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
