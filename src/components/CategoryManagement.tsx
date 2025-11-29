import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Folder, Grid } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSaaS } from "../contexts/SaaSContext";

interface Category {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const COLOR_OPTIONS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#ec4899", label: "Pink" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#06b6d4", label: "Cyan" },
];

const ICON_OPTIONS = [
  "📦",
  "💻",
  "👕",
  "🍔",
  "📚",
  "🏠",
  "🚗",
  "⚽",
  "🎮",
  "📱",
  "🎨",
  "💊",
  "🛋️",
  "🔧",
  "🎵",
  "📷",
  "🌿",
  "💍",
  "🧸",
  "🍕",
];

export default function CategoryManagement() {
  const { currentOrganization } = useSaaS();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "📦",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentOrganization) {
      fetchCategories();
    }
  }, [currentOrganization]);

  const fetchCategories = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("product_categories")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!currentOrganization) return;
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setError("");
      const { error } = await (supabase as any)
        .from("product_categories")
        .insert({
          organization_id: currentOrganization.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          icon: formData.icon,
          display_order: categories.length,
        });

      if (error) throw error;

      setFormData({ name: "", description: "", color: "#6366f1", icon: "📦" });
      setShowAddForm(false);
      fetchCategories();
    } catch (err: any) {
      console.error("Error adding category:", err);
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Category>) => {
    try {
      setError("");
      const { error } = await (supabase as any)
        .from("product_categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error updating category:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Products in this category will become uncategorized."
      )
    ) {
      return;
    }

    try {
      setError("");
      const { error } = await (supabase as any)
        .from("product_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchCategories();
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="w-7 h-7 text-indigo-600" />
            Product Categories
          </h2>
          <p className="text-gray-600 mt-1">
            Organize your products with custom categories
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {showAddForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {showAddForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white border-2 border-indigo-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Electronics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    className={`w-10 h-10 rounded-lg transition-all ${
                      formData.color === color.value
                        ? "ring-2 ring-offset-2 ring-indigo-600 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      formData.icon === icon
                        ? "bg-indigo-100 ring-2 ring-indigo-600 scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Category
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Grid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Categories Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first category to organize your products
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-white border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: category.color }}
            >
              {editingId === category.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    defaultValue={category.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== category.name) {
                        handleUpdate(category.id, {
                          name: e.target.value.trim(),
                        });
                      } else {
                        setEditingId(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-600">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(category.id)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleUpdate(category.id, {
                          is_active: !category.is_active,
                        })
                      }
                      className={`ml-auto px-3 py-1 text-xs rounded-full font-medium ${
                        category.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
