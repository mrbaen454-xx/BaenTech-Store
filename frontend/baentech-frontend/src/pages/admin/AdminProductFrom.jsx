import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Save,
  ShoppingBag,
  Sun,
  Tag,
  Truck,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const productBaseUrl =
  import.meta.env.VITE_PRODUCT_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const productAxios = axios.create({
  baseURL: productBaseUrl,
});

productAxios.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("authToken");

    if (token) {
      const cleanToken = token.startsWith("Bearer ")
        ? token.replace("Bearer ", "")
        : token;

      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const PRODUCT_STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"];

const initialForm = {
  name: "",
  brand: "",
  categoryId: "",
  price: "",
  stock: "",
  warranty: "",
  status: "ACTIVE",
  description: "",
};

function AdminProductFrom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const savedAdminProfile = getSavedAdminProfile();

  const adminName =
    savedAdminProfile?.fullName ||
    user?.fullName ||
    user?.name ||
    user?.email ||
    "Admin";

  const adminProfileImage = savedAdminProfile?.profileImageUrl || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(isEditMode);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const menus = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/admin/dashboard",
      path: "/admin/dashboard",
    },
    {
      name: "Products",
      icon: Package,
      active: location.pathname.startsWith("/admin/products"),
      path: "/admin/products",
    },
    {
      name: "Categories",
      icon: Tag,
      active: location.pathname === "/admin/categories",
      path: "/admin/categories",
    },
    {
      name: "Orders",
      icon: ShoppingBag,
      active: location.pathname === "/admin/orders",
      path: "/admin/orders",
    },
    {
      name: "Payments",
      icon: CreditCard,
      active: location.pathname === "/admin/payments",
      path: "/admin/payments",
    },
    {
      name: "Shipping",
      icon: Truck,
      active: location.pathname === "/admin/shipping",
      path: "/admin/shipping",
    },
    {
      name: "Reports",
      icon: BarChart3,
      active: location.pathname === "/admin/reports",
      path: "/admin/reports",
    },
  ];

  useEffect(() => {
    fetchCategories();

    if (isEditMode) {
      fetchProductDetail();
    }
  }, [id]);

  const selectedCategory = useMemo(() => {
    return categories.find(
      (category) => String(category.id) === String(formData.categoryId),
    );
  }, [categories, formData.categoryId]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const response = await productAxios.get("/api/categories");
      setCategories(normalizeListResponse(response.data));
    } catch (err) {
      console.log("ERROR FETCH CATEGORIES:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil data categories.",
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await productAxios.get(`/api/products/${id}`);
      const product = normalizeObjectResponse(response.data);

      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        categoryId: product.categoryId || product.category?.id || "",
        price: product.price || "",
        stock: product.stock ?? "",
        warranty: product.warranty || "",
        status: product.status || "ACTIVE",
        description: product.description || "",
      });

      setImagePreview(getProductImageUrl(product.imageUrl));
    } catch (err) {
      console.log("ERROR FETCH PRODUCT DETAIL:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil detail product.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.price || !formData.stock) {
      setError("Nama, brand, harga, dan stok wajib diisi.");
      return;
    }

    if (!formData.categoryId) {
      setError("Kategori wajib dipilih.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        price: Number(formData.price),
        stock: Number(formData.stock),
        warranty: formData.warranty,
        status: formData.status,
        categoryId: Number(formData.categoryId),
      };

      const productResponse = isEditMode
        ? await productAxios.put(`/api/products/${id}`, payload)
        : await productAxios.post("/api/products", payload);

      const savedProduct = normalizeObjectResponse(productResponse.data);
      const productId = savedProduct.id || id;

      if (imageFile && productId) {
        const imagePayload = new FormData();
        imagePayload.append("file", imageFile);

        await productAxios.post(`/api/products/${productId}/image`, imagePayload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccessMessage(
        isEditMode ? "Product berhasil diperbarui." : "Product berhasil dibuat.",
      );

      setTimeout(() => {
        navigate("/admin/products");
      }, 700);
    } catch (err) {
      console.log("ERROR SAVE PRODUCT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menyimpan product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const SidebarContent = () => {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-6">
          <div className="inline-flex select-none">
            <BrandLogo to="/admin/dashboard" />
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-2 px-4">
          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.name}
                to={menu.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  menu.active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-400"
                }`}
              >
                <Icon size={21} />
                <span>{menu.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={21} />
            Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white transition duration-300 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="lg:ml-72">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="sticky top-3 z-30 rounded-[2rem] border border-slate-200 bg-white/85 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white">
                    {isEditMode ? "Edit Product" : "Add Product"}
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Products / {isEditMode ? "Edit" : "Add"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-yellow-300"
                >
                  {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
                </button>

                <Link
                  to="/admin/profile"
                  className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 sm:flex"
                >
                  {adminProfileImage ? (
                    <img
                      src={adminProfileImage}
                      alt={adminName}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50">
                      <Users size={18} />
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {adminName}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Administrator
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                {isEditMode ? "Update Product" : "Create Product"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Isi data produk sesuai field backend: name, brand, price, stock,
                warranty, status, dan categoryId.
              </p>
            </div>

            <Link
              to="/admin/products"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Back to Products
            </Link>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-green-100 px-5 py-4 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]"
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Product Information
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Data utama produk yang akan ditampilkan ke user.
                </p>
              </div>

              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Memuat detail product...
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Product Name" required>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Contoh: Laptop Lenovo ThinkPad"
                      className="field-input"
                    />
                  </FormField>

                  <FormField label="Brand" required>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Contoh: Lenovo"
                      className="field-input"
                    />
                  </FormField>

                  <FormField label="Category" required>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="field-input"
                    >
                      <option value="">
                        {categoriesLoading ? "Loading..." : "Pilih category"}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name || category.categoryName}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Status">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="field-input"
                    >
                      {PRODUCT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Price" required>
                    <input
                      type="number"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Contoh: 7500000"
                      className="field-input"
                    />
                  </FormField>

                  <FormField label="Stock" required>
                    <input
                      type="number"
                      min="0"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="Contoh: 10"
                      className="field-input"
                    />
                  </FormField>

                  <FormField label="Warranty">
                    <input
                      type="text"
                      name="warranty"
                      value={formData.warranty}
                      onChange={handleChange}
                      placeholder="Contoh: 1 Tahun"
                      className="field-input"
                    />
                  </FormField>

                  <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                    <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-300">
                      Selected Category
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                      {selectedCategory?.name ||
                        selectedCategory?.categoryName ||
                        "Belum dipilih"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Description">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="6"
                        placeholder="Tulis deskripsi produk..."
                        className="field-input min-h-36 resize-none py-3"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Product Image
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Upload gambar setelah produk dibuat/disimpan.
                  </p>
                </div>

                <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-950/30">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-56 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                        <ImagePlus size={30} />
                      </div>
                      <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">
                        Click to upload product image
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        JPG, PNG, atau WEBP
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imageFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <UploadCloud size={18} />
                    <span>{imageFile.name}</span>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Action
                </h3>

                <div className="mt-5 space-y-3">
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={18} />
                    {saving
                      ? "Saving..."
                      : isEditMode
                        ? "Update Product"
                        : "Create Product"}
                  </button>

                  <Link
                    to="/admin/products"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: rgb(51 65 85);
          outline: none;
          transition: 150ms ease;
        }

        .field-input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 4px rgb(59 130 246 / 0.12);
        }

        .dark .field-input {
          border-color: rgb(51 65 85);
          background: rgb(2 6 23);
          color: white;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function normalizeObjectResponse(data) {
  if (data?.data) return data.data;
  return data;
}

function getSavedAdminProfile() {
  try {
    return JSON.parse(localStorage.getItem("adminProfile") || "{}");
  } catch {
    return {};
  }
}

function getProductImageUrl(imageUrl) {
  if (!imageUrl) return "";

  if (String(imageUrl).startsWith("http")) {
    return imageUrl;
  }

  if (String(imageUrl).startsWith("/")) {
    return `${productBaseUrl}${imageUrl}`;
  }

  return imageUrl;
}

export default AdminProductFrom;
