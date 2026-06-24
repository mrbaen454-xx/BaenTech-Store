import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Edit3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Sun,
  Tag,
  Trash2,
  Truck,
  Users,
  X,
  XCircle,
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

function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteProduct, setSelectedDeleteProduct] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

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
      name: "Product Reviews",
      icon: MessageSquareText,
      active: location.pathname.startsWith("/admin/product-reviews"),
      path: "/admin/product-reviews",
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
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await productAxios.get("/api/products");
      const productList = normalizeListResponse(response.data);

      const productsWithReviewSummary = await Promise.all(
        productList.map(async (product) => {
          const productId = product.id || product.productId;

          if (!productId) {
            return {
              ...product,
              averageRating: 0,
              totalReviews: 0,
            };
          }

          try {
            const summaryResponse = await productAxios.get(
              `/api/products/${productId}/reviews/summary`,
            );
            const summary = normalizeObjectResponse(summaryResponse.data);

            return {
              ...product,
              averageRating: Number(summary.averageRating || 0),
              totalReviews: Number(summary.totalReviews || 0),
            };
          } catch (summaryError) {
            console.log(
              `Gagal mengambil rating produk ${productId}:`,
              summaryError,
            );

            return {
              ...product,
              averageRating: 0,
              totalReviews: 0,
            };
          }
        }),
      );

      setProducts(productsWithReviewSummary);
    } catch (err) {
      console.log("ERROR FETCH PRODUCTS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil data products. Pastikan product-service sudah berjalan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const categories = useMemo(() => {
    const unique = new Set();

    products.forEach((product) => {
      const categoryName = product.categoryName || product.category?.name;

      if (categoryName) {
        unique.add(categoryName);
      }
    });

    return Array.from(unique).sort();
  }, [products]);

  const normalizedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      _id: product.id || product.productId,
      _name: product.name || product.productName || "Product",
      _brand: product.brand || "-",
      _categoryName:
        product.categoryName || product.category?.name || "Uncategorized",
      _price: Number(product.price || product.productPrice || 0),
      _stock: Number(product.stock || product.qty || 0),
      _status: String(product.status || "ACTIVE").toUpperCase(),
      _imageUrl:
        product.imageUrl || product.image || product.productImage || "",
      _updatedAt: product.updatedAt || product.createdAt || null,
      _averageRating: Number(
        product.averageRating || product.ratingAverage || product.rating || 0,
      ),
      _totalReviews: Number(
        product.totalReviews ||
          product.reviewCount ||
          product.reviewsCount ||
          0,
      ),
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return normalizedProducts.filter((product) => {
      const text = `${product._name} ${product._brand} ${product._categoryName}`.toLowerCase();
      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || product._status === statusFilter;
      const matchCategory =
        categoryFilter === "ALL" || product._categoryName === categoryFilter;

      return matchKeyword && matchStatus && matchCategory;
    });
  }, [normalizedProducts, keyword, statusFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalProducts = normalizedProducts.length;
  const activeProducts = normalizedProducts.filter(
    (product) => product._status === "ACTIVE",
  ).length;
  const inactiveProducts = normalizedProducts.filter(
    (product) => product._status === "INACTIVE",
  ).length;
  const outOfStockProducts = normalizedProducts.filter(
    (product) => product._status === "OUT_OF_STOCK" || product._stock <= 0,
  ).length;
  const lowStockProducts = normalizedProducts.filter(
    (product) => product._stock > 0 && product._stock <= 5,
  ).length;
  const reviewedProducts = normalizedProducts.filter(
    (product) => product._totalReviews > 0,
  ).length;

  const openDeleteModal = (product) => {
    setSelectedDeleteProduct(product);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setSelectedDeleteProduct(null);
    setDeleteModalOpen(false);
  };

  const handleConfirmDeleteProduct = async () => {
    const productId = selectedDeleteProduct?._id;

    if (!productId) {
      setError("ID product tidak ditemukan.");
      closeDeleteModal();
      return;
    }

    try {
      setDeletingId(productId);
      setError("");
      setSuccessMessage("");

      await productAxios.delete(`/api/products/${productId}`);
      await fetchProducts();

      setSuccessMessage("Product berhasil dihapus.");
      setSelectedDeleteProduct(null);
      setDeleteModalOpen(false);
    } catch (err) {
      console.log("ERROR DELETE PRODUCT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menghapus product.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  };

  const goPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
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
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
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
                    ? "bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-950/40 dark:text-blue-400"
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
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
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
      {deleteModalOpen && selectedDeleteProduct && (
        <DeleteProductModal
          product={selectedDeleteProduct}
          deleting={deletingId === selectedDeleteProduct._id}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDeleteProduct}
        />
      )}

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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <h1 className="text-xl font-black text-slate-950 dark:text-white">
                    Products
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Products
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-yellow-300"
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
                Product Management
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-500 dark:text-slate-400">
                Kelola produk elektronik BaenTech Store, stok, kategori, status,
                gambar produk, dan akses ulasan produk.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/admin/product-reviews"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3 text-sm font-black text-yellow-700 transition hover:-translate-y-0.5 hover:border-yellow-400 hover:shadow-lg dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300"
              >
                <MessageSquareText size={18} />
                Product Reviews
              </Link>

              <button
                type="button"
                onClick={fetchProducts}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <Link
                to="/admin/products/create"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Product
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-2xl bg-green-100 px-5 py-4 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {successMessage}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-6">
            <StatCard
              title="Total Products"
              value={totalProducts}
              subtitle="Semua produk"
              icon={Package}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Active"
              value={activeProducts}
              subtitle="Produk aktif"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />
            <StatCard
              title="Inactive"
              value={inactiveProducts}
              subtitle="Produk nonaktif"
              icon={XCircle}
              color="red"
              loading={loading}
            />
            <StatCard
              title="Reviews"
              value={reviewedProducts}
              subtitle="Produk berulasan"
              icon={MessageSquareText}
              color="yellow"
              loading={loading}
            />
            <StatCard
              title="Low Stock"
              value={lowStockProducts}
              subtitle="Stok 1 sampai 5"
              icon={AlertTriangle}
              color="orange"
              loading={loading}
            />
            <StatCard
              title="Out of Stock"
              value={outOfStockProducts}
              subtitle="Stok habis"
              icon={XCircle}
              color="red"
              loading={loading}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.5fr]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950 sm:rounded-full">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search product, brand, category..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:rounded-full"
              >
                <option value="ALL">All Status</option>
                {PRODUCT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:rounded-full"
              >
                <option value="ALL">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="h-12 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 active:scale-[0.98] sm:rounded-full"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Brand</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Rating</th>
                    <th className="px-5 py-4">Updated</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Memuat data products...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Product tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <ProductImage product={product} />
                            <div>
                              <p className="font-black text-slate-950 dark:text-white">
                                {product._name}
                              </p>
                              <p className="mt-0.5 line-clamp-1 max-w-xs text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {product.description || "Tidak ada deskripsi"}
                              </p>
                              <p className="mt-0.5 text-xs font-bold text-slate-400">
                                ID: {product._id || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {product._brand}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                            {product._categoryName}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {formatCurrency(product._price)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StockBadge stock={product._stock} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge value={product._status} />
                        </td>

                        <td className="px-5 py-4">
                          <ProductReviewSummary
                            averageRating={product._averageRating}
                            totalReviews={product._totalReviews}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                            <CalendarDays
                              size={16}
                              className="mt-0.5 text-slate-400"
                            />
                            <span>{formatDate(product._updatedAt)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/products/${product._id}/reviews`}
                              title="Lihat ulasan"
                              aria-label={`Lihat ulasan ${product._name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-200 text-yellow-600 transition hover:bg-yellow-50 dark:border-yellow-900 dark:hover:bg-yellow-950/30"
                            >
                              <MessageSquareText size={16} />
                            </Link>

                            <Link
                              to={`/admin/products/edit/${product._id}`}
                              title="Edit produk"
                              aria-label={`Edit ${product._name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            >
                              <Edit3 size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(product)}
                              disabled={deletingId === product._id}
                              title="Hapus produk"
                              aria-label={`Hapus ${product._name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {paginatedProducts.length} of {filteredProducts.length}{" "}
                products
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevPage}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-blue-600 bg-blue-600 px-3 text-sm font-black text-white"
                >
                  {currentPage}
                </button>

                <button
                  type="button"
                  onClick={goNextPage}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductImage({ product }) {
  const imageUrl = getProductImageUrl(product._imageUrl);

  if (!imageUrl) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Package size={24} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product._name}
      className="h-16 w-16 shrink-0 rounded-2xl border border-slate-100 object-cover dark:border-slate-800"
    />
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorClass = getStatColorClass(color);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
              {value}
            </p>
          )}
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProductReviewSummary({ averageRating, totalReviews }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300">
        <Star size={13} className="fill-current" />
        {Number(averageRating || 0).toFixed(1)}
      </div>
      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
        {Number(totalReviews || 0)} ulasan
      </p>
    </div>
  );
}

function StockBadge({ stock }) {
  if (Number(stock) <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-600 dark:bg-red-950/40 dark:text-red-300">
        Habis
      </span>
    );
  }

  if (Number(stock) <= 5) {
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300">
        {stock} left
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700 dark:bg-green-950/40 dark:text-green-300">
      {stock} stock
    </span>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "").toUpperCase();

  if (status === "ACTIVE") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700 dark:bg-green-950/40 dark:text-green-300">
        ACTIVE
      </span>
    );
  }

  if (status === "OUT_OF_STOCK") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-950/40 dark:text-red-300">
        OUT OF STOCK
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {status || "INACTIVE"}
    </span>
  );
}

function DeleteProductModal({ product, deleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-600 dark:text-red-400">
              Hapus Product
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              {product._name}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Product yang sudah dihapus tidak bisa dikembalikan dari halaman
              admin. Pastikan data ini memang ingin dihapus.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={17} />
            {deleting ? "Menghapus..." : "Hapus Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatColorClass(color) {
  const colors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    green:
      "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300",
    red: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
    yellow:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-300",
  };

  return colors[color] || colors.blue;
}

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
}

function normalizeObjectResponse(response) {
  if (response?.data && typeof response.data === "object") return response.data;
  if (response && typeof response === "object") return response;
  return {};
}

function getSavedAdminProfile() {
  try {
    const profile = localStorage.getItem("adminProfile");
    return profile ? JSON.parse(profile) : null;
  } catch {
    return null;
  }
}

function getProductImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (String(imageUrl).startsWith("http")) return imageUrl;
  return `${productBaseUrl}${imageUrl}`;
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default AdminProducts;
