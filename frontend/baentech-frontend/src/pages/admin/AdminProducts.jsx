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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"
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
                Product Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Kelola produk elektronik BaenTech Store, stok, kategori, status,
                dan gambar produk.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={fetchProducts}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <Link
                to="/admin/products/create"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
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

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.5fr]">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search product, brand, category..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                className="h-12 rounded-full bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1260px] text-left">
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
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
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
                              to={`/admin/products/edit/${product._id}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            >
                              <Edit3 size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(product)}
                              disabled={deletingId === product._id}
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
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
      className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover dark:border-slate-800"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
function ProductReviewSummary({ averageRating = 0, totalReviews = 0 }) {
  const rating = Number(averageRating || 0);
  const reviews = Number(totalReviews || 0);

  return (
    <div className="min-w-0">
      <div className="inline-flex items-center gap-2 rounded-2xl bg-yellow-50 px-3 py-2 dark:bg-yellow-950/20">
        <Star
          size={16}
          className={
            rating > 0
              ? "shrink-0 fill-yellow-400 text-yellow-400"
              : "shrink-0 text-slate-300 dark:text-slate-600"
          }
        />

        <span className="text-sm font-black text-slate-950 dark:text-white">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
        </span>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          / 5
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <MessageSquareText size={14} className="shrink-0" />
        <span>{reviews} ulasan</span>
      </div>
    </div>
  );
}
function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            colorMap[color] || colorMap.blue
          }`}
        >
          <Icon size={24} />
        </div>

        <div className="h-10 w-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 sm:text-sm">
          {title}
        </p>

        <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
          {loading ? "..." : value}
        </p>

        <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "-").toUpperCase();

  const isGreen = status === "ACTIVE";
  const isRed = status === "INACTIVE";
  const isOrange = status === "OUT_OF_STOCK";

  const className = isGreen
    ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
    : isRed
      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
      : isOrange
        ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
        : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function StockBadge({ stock }) {
  const isEmpty = stock <= 0;
  const isLow = stock > 0 && stock <= 5;

  const className = isEmpty
    ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
    : isLow
      ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
      : "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {stock} pcs
    </span>
  );
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function normalizeObjectResponse(data) {
  if (data?.data) return data.data;
  if (data?.result) return data.result;
  return data || {};
}

function getSavedAdminProfile() {
  try {
    return JSON.parse(localStorage.getItem("adminProfile") || "{}");
  } catch {
    return {};
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
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

function DeleteProductModal({ product, deleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <Trash2 size={26} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Hapus Product?
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Product{" "}
              <span className="font-black text-slate-900 dark:text-white">
                {product._name}
              </span>{" "}
              akan dihapus dari sistem. Aksi ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
            Product Detail
          </p>

          <div className="mt-3 flex items-center gap-3">
            <ProductImage product={product} />

            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">
                {product._name}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {product._brand} • {product._categoryName}
              </p>
              <p className="text-xs font-bold text-slate-400">
                ID: {product._id}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={17} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;
