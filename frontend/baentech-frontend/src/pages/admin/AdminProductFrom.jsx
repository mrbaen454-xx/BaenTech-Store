import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  CreditCard,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Save,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Trash2,
  UploadCloud,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import {
  createAdminProductApi,
  getAdminCategoriesApi,
  getAdminProductByIdApi,
  updateAdminProductApi,
  uploadAdminProductImageApi,
} from "../../api/adminApi";

const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL || "";

const initialForm = {
  name: "",
  description: "",
  brand: "",
  price: "",
  stock: "",
  warranty: "",
  status: "ACTIVE",
  categoryId: "",
};

function AdminProductForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [oldImageUrl, setOldImageUrl] = useState("");

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = isEditMode ? "Edit Product" : "Add Product";
  const pageDescription = isEditMode
    ? "Update data produk yang sudah ada."
    : "Isi data produk baru sesuai kebutuhan backend.";

    const savedAdminProfile = JSON.parse(
      localStorage.getItem("adminProfile") || "{}",
    );

    const adminName =
      savedAdminProfile?.fullName ||
      user?.fullName ||
      user?.name ||
      user?.email ||
      "Admin";

    const adminProfileImage = savedAdminProfile?.profileImageUrl || "";

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const categoryData = await getAdminCategoriesApi();
        setCategories(Array.isArray(categoryData) ? categoryData : []);

        if (isEditMode) {
          const product = await getAdminProductByIdApi(id);

          setForm({
            name: product.name || "",
            description: product.description || "",
            brand: product.brand || "",
            price: product.price ?? "",
            stock: product.stock ?? "",
            warranty: product.warranty || "",
            status: product.status || "ACTIVE",
            categoryId: product.categoryId || product.category?.id || "",
          });

          const image = getProductImage(product);

          if (image) {
            setOldImageUrl(image);
            setImagePreview(image);
          }
        }
      } catch (err) {
        console.log(err);
        setError(
          isEditMode
            ? "Gagal mengambil detail produk."
            : "Gagal mengambil data kategori.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditMode]);

  const selectedCategoryName = useMemo(() => {
    const category = categories.find(
      (item) => String(item.id) === String(form.categoryId),
    );

    return category?.name || "-";
  }, [categories, form.categoryId]);

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview(oldImageUrl || "");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Nama produk wajib diisi.";
    }

    if (!form.description.trim()) {
      return "Deskripsi produk wajib diisi.";
    }

    if (!form.brand.trim()) {
      return "Brand produk wajib diisi.";
    }

    if (!form.categoryId) {
      return "Kategori produk wajib dipilih.";
    }

    if (Number(form.price) <= 0) {
      return "Harga produk harus lebih dari 0.";
    }

    if (Number(form.stock) < 0) {
      return "Stok produk tidak boleh kurang dari 0.";
    }

    const allowedStatus = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"];

    if (!allowedStatus.includes(form.status)) {
      return "Status produk tidak valid.";
    }

    return "";
  };

  const buildPayload = () => {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      warranty: form.warranty.trim(),
      status: form.status,
      categoryId: Number(form.categoryId),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();

      let savedProduct;

      if (isEditMode) {
        savedProduct = await updateAdminProductApi(id, payload);
      } else {
        savedProduct = await createAdminProductApi(payload);
      }

      const productId = savedProduct?.id || id;

      if (imageFile && productId) {
        await uploadAdminProductImageApi(productId, imageFile);
      }

      navigate("/admin/products");
    } catch (err) {
      console.log(
        "ERROR URL:",
        `${err.config?.baseURL || ""}${err.config?.url || ""}`,
      );
      console.log("ERROR METHOD:", err.config?.method);
      console.log("ERROR RESPONSE:", err.response?.data);
      console.log(err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Gagal menyimpan produk.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          aria-label="Tutup sidebar"
        />
      )}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent activeMenu="products" onLogout={handleLogout} />
      </aside>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 transition dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarContent
          activeMenu="products"
          onLogout={handleLogout}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                  Admin Panel
                </p>
                <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
              </button>

              <Link
                to="/admin/profile"
                className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 sm:flex"
              >
                {adminProfileImage ? (
                  <img
                    src={adminProfileImage}
                    alt={adminName}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <UserRound size={16} />
                  </div>
                )}

                <div className="leading-tight">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {adminName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Administrator
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                <Link
                  to="/admin/dashboard"
                  className="transition hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <Link
                  to="/admin/products"
                  className="transition hover:text-blue-600"
                >
                  Products
                </Link>
                <span>/</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {isEditMode ? "Edit" : "Add"}
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {pageTitle}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {pageDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Kembali
            </button>
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                Memuat form produk...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 xl:grid-cols-[1fr_320px]"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Informasi Produk
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Field disesuaikan dengan backend: name, description, brand,
                    price, stock, warranty, status, categoryId.
                  </p>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {error && (
                    <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                      <AlertCircle size={19} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Nama Produk" required>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Contoh: iPhone 15 Pro Max"
                        className="admin-input"
                      />
                    </FormField>

                    <FormField label="Brand" required>
                      <input
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        placeholder="Contoh: Apple"
                        className="admin-input"
                      />
                    </FormField>
                  </div>

                  <FormField label="Deskripsi" required>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Masukkan deskripsi produk..."
                      rows={6}
                      className="admin-input resize-none py-4"
                    />
                  </FormField>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Kategori" required>
                      <select
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        className="admin-input"
                      >
                        <option value="">Pilih kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Status" required>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="admin-input"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="OUT_OF_STOCK">Out Of Stock</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Harga" required>
                      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-blue-500">
                        <span className="flex items-center border-r border-slate-200 px-4 text-sm font-black text-slate-500 dark:border-slate-700">
                          Rp
                        </span>
                        <input
                          type="number"
                          name="price"
                          value={form.price}
                          onChange={handleChange}
                          min="0"
                          placeholder="0"
                          className="h-12 w-full bg-transparent px-4 text-sm font-bold text-slate-900 outline-none dark:text-white"
                        />
                      </div>
                    </FormField>

                    <FormField label="Stok" required>
                      <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                        className="admin-input"
                      />
                    </FormField>
                  </div>

                  <FormField label="Garansi">
                    <input
                      name="warranty"
                      value={form.warranty}
                      onChange={handleChange}
                      placeholder="Contoh: Garansi resmi 1 tahun"
                      className="admin-input"
                    />
                  </FormField>

                  <div>
                    <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                      Gambar Produk
                    </label>

                    <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_260px]">
                      <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-950/30">
                        <UploadCloud
                          size={42}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">
                          Klik untuk upload gambar
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          PNG, JPG, JPEG, WEBP
                        </p>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                          Preview
                        </p>

                        <div className="mt-3 flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <ImagePlus
                                size={34}
                                className="mx-auto text-slate-400"
                              />
                              <p className="mt-2 text-xs font-bold text-slate-400">
                                Belum ada gambar
                              </p>
                            </div>
                          )}
                        </div>

                        {imageFile && (
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                          >
                            <Trash2 size={15} />
                            Hapus pilihan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:justify-end sm:p-6">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={18} />
                    {saving
                      ? "Menyimpan..."
                      : isEditMode
                        ? "Update Product"
                        : "Save Product"}
                  </button>
                </div>
              </div>

              <ProductSummary
                form={form}
                selectedCategoryName={selectedCategoryName}
                imagePreview={imagePreview}
                isEditMode={isEditMode}
              />
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function SidebarContent({ activeMenu, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <div className="inline-flex cursor-default select-none">
          <img
            src={logo}
            alt="BaenTech Store"
            className="h-16 w-auto object-contain"
          />
        </div>

        <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
          Admin Workspace
        </p>
      </div>

      <nav className="space-y-2">
        <AdminNavLink
          to="/admin/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeMenu === "dashboard"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/products"
          icon={Package}
          label="Products"
          active={activeMenu === "products"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/categories"
          icon={Tag}
          label="Categories"
          active={activeMenu === "categories"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/orders"
          icon={ShoppingBag}
          label="Orders"
          active={activeMenu === "orders"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/payments"
          icon={CreditCard}
          label="Payments"
          active={activeMenu === "payments"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/customers"
          icon={Users}
          label="Customers"
          active={activeMenu === "customers"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/finance"
          icon={Wallet}
          label="Finance"
          active={activeMenu === "finance"}
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/reports"
          icon={BarChart3}
          label="Reports"
          active={activeMenu === "reports"}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-auto">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </div>
  );
}

function AdminNavLink({ to, icon: Icon, label, active, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <Icon size={19} />
      {label}
    </Link>
  );
}

function ProductSummary({
  form,
  selectedCategoryName,
  imagePreview,
  isEditMode,
}) {
  return (
    <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-24">
      <h3 className="text-lg font-black text-slate-950 dark:text-white">
        Product Summary
      </h3>

      <div className="mt-5 flex h-44 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Product preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <Package size={42} className="text-slate-400" />
        )}
      </div>

      <div className="mt-5 space-y-4">
        <SummaryItem label="Name" value={form.name || "-"} />
        <SummaryItem label="Brand" value={form.brand || "-"} />
        <SummaryItem label="Category" value={selectedCategoryName} />
        <SummaryItem label="Price" value={formatCurrency(form.price)} />
        <SummaryItem label="Stock" value={form.stock || "0"} />
        <SummaryItem label="Warranty" value={form.warranty || "-"} />

        <div>
          <p className="text-xs font-black text-slate-500 dark:text-slate-400">
            Status
          </p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {form.status === "OUT_OF_STOCK"
              ? "OUT OF STOCK"
              : form.status || "-"}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex gap-3">
          {isEditMode ? (
            <CheckCircle2
              size={20}
              className="shrink-0 text-blue-600 dark:text-blue-400"
            />
          ) : (
            <Search
              size={20}
              className="shrink-0 text-blue-600 dark:text-blue-400"
            />
          )}

          <p className="text-xs font-bold leading-relaxed text-blue-700 dark:text-blue-300">
            {isEditMode
              ? "Perubahan produk akan langsung dikirim ke backend melalui endpoint update."
              : "Setelah produk dibuat, gambar akan diupload ke endpoint image produk."}
          </p>
        </div>
      </div>
    </aside>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}

function getProductImage(product) {
  const image =
    product.imageUrl || product.image || product.photo || product.thumbnail;

  if (!image) {
    return "";
  }

  if (String(image).startsWith("http")) {
    return image;
  }

  return `${productBaseUrl}${image}`;
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default AdminProductForm;
