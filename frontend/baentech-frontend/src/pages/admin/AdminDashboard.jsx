import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAdminCategoriesApi,
  getAdminProductsApi,
  deleteAdminProductApi,
} from "../../api/adminApi";
import { getIncomeChartApi } from "../../api/reportApi";

const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL;

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [chartPeriod, setChartPeriod] = useState("WEEK");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const itemsPerPage = 5;

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
      name: "Customers",
      icon: Users,
      active: location.pathname === "/admin/customers",
      path: "/admin/customers",
    },
    {
      name: "Finance",
      icon: Wallet,
      active: location.pathname === "/admin/finance",
      path: "/admin/finance",
    },
    {
      name: "Reports",
      icon: BarChart3,
      active: location.pathname === "/admin/reports",
      path: "/admin/reports",
    },
  ];

const savedAdminProfile = JSON.parse(
  localStorage.getItem("adminProfile") || "{}",
);

const adminName =
  savedAdminProfile?.fullName ||
  user?.fullName ||
  user?.name ||
  user?.email ||
  "Admin User";

const adminProfileImage = savedAdminProfile?.profileImageUrl || "";
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productData, categoryData] = await Promise.all([
          getAdminProductsApi(),
          getAdminCategoriesApi(),
        ]);

        setProducts(productData);
        setCategories(categoryData);
      } catch (err) {
        console.log(err);
        setError("Gagal mengambil data dashboard admin.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchIncomeChart = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        const data = await getIncomeChartApi(chartPeriod);

        const cleanData = data.map((item) => ({
          label: item.label,
          value: Number(item.value || 0),
        }));

        setChartData(cleanData);
      } catch (err) {
        console.log(err);
        setChartError("Gagal mengambil data grafik pemasukan.");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchIncomeChart();
  }, [chartPeriod]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const getCategoryName = (product) => {
    return (
      product.categoryName ||
      product.category?.name ||
      product.category?.categoryName ||
      "Tanpa Kategori"
    );
  };

  const getImageUrl = (product) => {
    const rawImage =
      product.imageUrl || product.image_url || product.image || product.photo;

    if (!rawImage) {
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80";
    }

    if (rawImage.startsWith("http")) {
      return rawImage;
    }

    return `${productBaseUrl}${rawImage}`;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text =
        `${product.name || ""} ${product.brand || ""} ${getCategoryName(
          product,
        )}`.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [products, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalProducts = products.length;
  const totalCategories = categories.length;

  const activeProducts = products.filter((product) => {
    return !product.status || product.status === "ACTIVE";
  }).length;

  const lowStockProducts = products.filter((product) => {
    return Number(product.stock || 0) <= 10;
  });

  const categoryOverview = categories.map((category) => {
    const categoryName = category.name || category.categoryName;

    const count = products.filter((product) => {
      return (
        getCategoryName(product).toLowerCase() === categoryName?.toLowerCase()
      );
    }).length;

    return {
      id: category.id,
      name: categoryName,
      count,
    };
  });

  const selectedChartData = chartData;

  const chartSummary = useMemo(() => {
    if (selectedChartData.length === 0) {
      return {
        total: 0,
        average: 0,
        best: {
          label: "-",
          value: 0,
        },
      };
    }

    const total = selectedChartData.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0,
    );

    const average = Math.round(total / selectedChartData.length);

    const best = selectedChartData.reduce((prev, current) =>
      Number(current.value || 0) > Number(prev.value || 0) ? current : prev,
    );

    return {
      total,
      average,
      best,
    };
  }, [selectedChartData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openDeleteModal = (product) => {
    setDeleteModalProduct(product);
    setOpenMenuId(null);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalProduct(null);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteModalProduct) return;

    try {
      setDeleteLoading(true);

      await deleteAdminProductApi(deleteModalProduct.id);

      setProducts((prev) =>
        prev.filter(
          (item) => String(item.id) !== String(deleteModalProduct.id),
        ),
      );

      setDeleteModalProduct(null);
      setOpenMenuId(null);
    } catch (err) {
      console.log(err);
      setError("Gagal menghapus produk.");
    } finally {
      setDeleteLoading(false);
    }
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
          <div className="inline-flex cursor-default select-none">
            <img
              src={logo}
              alt="BaenTech Store"
              className="h-16 w-auto object-contain"
            />
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
      {deleteModalProduct && (
        <ConfirmDeleteModal
          product={deleteModalProduct}
          loading={deleteLoading}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteProduct}
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

                <h1 className="hidden text-xl font-black text-slate-950 dark:text-white sm:block">
                  Dashboard
                </h1>
              </div>

              <div className="hidden w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950 md:flex">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search products, categories..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
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
                      className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
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

            <div className="mt-3 flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950 md:hidden">
              <Search size={19} className="text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari produk..."
                className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                Welcome back, Admin!
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Kelola toko dan pantau ringkasan bisnis BaenTech Store.
              </p>
            </div>

            <Link
              to="/admin/products/create"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
            >
              <Plus size={19} />
              Add Product
            </Link>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            <StatCard
              title="Total Produk"
              value={totalProducts}
              subtitle="Jumlah seluruh produk"
              icon={ShoppingBag}
              color="blue"
              loading={loading}
            />

            <StatCard
              title="Total Kategori"
              value={totalCategories}
              subtitle="Kategori yang tersedia"
              icon={Tag}
              color="purple"
              loading={loading}
            />

            <StatCard
              title="Produk Aktif"
              value={activeProducts}
              subtitle="Produk siap ditampilkan"
              icon={Package}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Stok Menipis"
              value={lowStockProducts.length}
              subtitle="Perlu segera dicek"
              icon={AlertTriangle}
              color="orange"
              loading={loading}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  Produk Terbaru
                </h3>

                <Link
                  to="/admin/products"
                  className="text-sm font-black text-blue-600 dark:text-blue-400"
                >
                  View all products
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Product Name</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                        >
                          Memuat data produk...
                        </td>
                      </tr>
                    )}

                    {!loading && paginatedProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                        >
                          Produk tidak ditemukan.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      paginatedProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(product)}
                                alt={product.name}
                                className="h-11 w-11 rounded-xl object-cover"
                              />

                              <div>
                                <p className="font-black text-slate-950 dark:text-white">
                                  {product.name}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {product.brand || "No Brand"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                            {getCategoryName(product)}
                          </td>

                          <td className="px-5 py-4 text-sm font-black text-slate-950 dark:text-white">
                            Rp{" "}
                            {Number(product.price || 0).toLocaleString("id-ID")}
                          </td>

                          <td
                            className={`px-5 py-4 text-sm font-black ${
                              Number(product.stock || 0) <= 10
                                ? "text-orange-500"
                                : "text-slate-950 dark:text-white"
                            }`}
                          >
                            {product.stock || 0}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                product.status === "INACTIVE"
                                  ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                                  : product.status === "OUT_OF_STOCK"
                                    ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
                                    : "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
                              }`}
                            >
                              {product.status || "ACTIVE"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="relative flex justify-end gap-2">
                              <Link
                                to={`/admin/products/edit/${product.id}`}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                              >
                                <Pencil size={16} />
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId((prev) =>
                                    prev === product.id ? null : product.id,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {openMenuId === product.id && (
                                <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                  <Link
                                    to={`/admin/products/edit/${product.id}`}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Pencil size={15} />
                                    Edit
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(product)}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  >
                                    <Trash2 size={15} />
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {paginatedProducts.length} of{" "}
                  {filteredProducts.length} products
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrevPage}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                  >
                    <ChevronLeft size={16} />
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
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Category Overview
                  </h3>

                  <Link
                    to="/admin/categories"
                    className="text-sm font-black text-blue-600 dark:text-blue-400"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-4">
                  {loading && (
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Memuat kategori...
                    </p>
                  )}

                  {!loading && categoryOverview.length === 0 && (
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Belum ada kategori.
                    </p>
                  )}

                  {!loading &&
                    categoryOverview.slice(0, 6).map((category) => (
                      <div
                        key={category.id || category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            <Tag size={18} />
                          </div>

                          <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {category.name}
                          </p>
                        </div>

                        <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                          {category.count}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Stock Alerts
                  </h3>

                  <Link
                    to="/admin/products"
                    className="text-sm font-black text-blue-600 dark:text-blue-400"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-4">
                  {!loading && lowStockProducts.length === 0 && (
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Semua stok masih aman.
                    </p>
                  )}

                  {lowStockProducts.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="h-11 w-11 rounded-xl object-cover"
                        />

                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs font-bold text-orange-500">
                            Sisa {product.stock || 0} item
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-600 dark:bg-red-950/40 dark:text-red-300">
                        Low
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  Grafik Pemasukan
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Ringkasan pemasukan toko berdasarkan periode.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChartPeriod("WEEK")}
                  className={`rounded-full px-4 py-2 text-sm font-black ${
                    chartPeriod === "WEEK"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Mingguan
                </button>

                <button
                  type="button"
                  onClick={() => setChartPeriod("MONTH")}
                  className={`rounded-full px-4 py-2 text-sm font-black ${
                    chartPeriod === "MONTH"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Bulanan
                </button>

                <button
                  type="button"
                  onClick={() => setChartPeriod("YEAR")}
                  className={`rounded-full px-4 py-2 text-sm font-black ${
                    chartPeriod === "YEAR"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Tahunan
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="overflow-x-auto rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/60 sm:p-5">
                {chartLoading && (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Memuat grafik pemasukan...
                    </p>
                  </div>
                )}

                {chartError && !chartLoading && (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-sm font-bold text-red-500">
                      {chartError}
                    </p>
                  </div>
                )}

                {!chartLoading &&
                  !chartError &&
                  selectedChartData.length === 0 && (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Belum ada data pemasukan.
                      </p>
                    </div>
                  )}

                {!chartLoading &&
                  !chartError &&
                  selectedChartData.length > 0 && (
                    <div className="flex min-w-[620px] items-end gap-4">
                      {selectedChartData.map((item) => (
                        <ChartBar
                          key={item.label}
                          label={item.label}
                          value={Number(item.value || 0)}
                          data={selectedChartData}
                        />
                      ))}
                    </div>
                  )}
              </div>

              <div className="grid gap-4">
                <SummaryCard
                  title="Total Pemasukan"
                  value={formatCurrency(chartSummary.total)}
                  icon={Wallet}
                  color="blue"
                />

                <SummaryCard
                  title="Rata-rata"
                  value={formatCurrency(chartSummary.average)}
                  icon={DollarSign}
                  color="green"
                />

                <SummaryCard
                  title="Periode Terbaik"
                  value={`${chartSummary.best.label} • ${formatCurrency(
                    chartSummary.best.value,
                  )}`}
                  icon={TrendingUp}
                  color="purple"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
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

        <div className="h-10 w-20 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
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

function ChartBar({ label, value, data }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  const height = Math.max((Number(value || 0) / maxValue) * 220, 8);

  return (
    <div className="flex w-full flex-col items-center">
      <p className="mb-2 text-xs font-black text-slate-700 dark:text-slate-300">
        {shortCurrency(value)}
      </p>

      <div
        className="w-full max-w-[52px] rounded-t-2xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300"
        style={{ height: `${height}px` }}
      ></div>

      <p className="mt-3 text-xs font-black text-slate-600 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            colorMap[color] || colorMap.blue
          }`}
        >
          <Icon size={20} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {title}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ product, loading, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          <Trash2 size={30} />
        </div>

        <div className="mt-5 text-center">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Hapus Produk?
          </h3>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
            Produk{" "}
            <span className="font-black text-slate-900 dark:text-white">
              {product?.name}
            </span>{" "}
            akan dihapus dari BaenTech Store.
          </p>

          <p className="mt-2 text-xs font-bold text-red-500">
            Aksi ini tidak bisa dibatalkan.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function shortCurrency(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Jt`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} Rb`;
  }

  return value;
}

export default AdminDashboard;
