import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import {
  deleteAdminProductApi,
  getAdminCategoriesApi,
  getAdminProductsApi,
} from "../../api/adminApi";

const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL || "";

function AdminProducts() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedStock, setSelectedStock] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const loadAdminProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        getAdminProductsApi(),
        getAdminCategoriesApi(),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.log(err);
      setError("Gagal mengambil data produk admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCategory, selectedStatus, selectedStock]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      const productBrand = String(product.brand || "").toLowerCase();
      const categoryName = String(getCategoryName(product)).toLowerCase();

      const searchValue = keyword.toLowerCase();

      const matchKeyword =
        productName.includes(searchValue) ||
        productBrand.includes(searchValue) ||
        categoryName.includes(searchValue);

      const matchCategory =
        selectedCategory === "ALL" ||
        String(getCategoryId(product)) === String(selectedCategory);

      const productStatus = getProductStatus(product).value;

      const matchStatus =
        selectedStatus === "ALL" || productStatus === selectedStatus;

      const stockStatus = getStockStatus(product.stock).value;

      const matchStock =
        selectedStock === "ALL" || stockStatus === selectedStock;

      return matchKeyword && matchCategory && matchStatus && matchStock;
    });
  }, [products, keyword, selectedCategory, selectedStatus, selectedStock]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const activeProducts = products.filter(
      (product) => getProductStatus(product).value === "ACTIVE",
    ).length;

    const outOfStockProducts = products.filter(
      (product) => Number(product.stock || 0) <= 0,
    ).length;

    const lowStockProducts = products.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
    };
  }, [products]);

  const goPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const handleDeleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus produk "${product.name}"?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteAdminProductApi(product.id);

      setProducts((prev) =>
        prev.filter((item) => String(item.id) !== String(product.id)),
      );
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus produk.");
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
        <SidebarContent onLogout={handleLogout} />
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
                  Produk
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

              <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                  <UserRound size={16} />
                </div>

                <div className="leading-tight">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {user?.fullName || user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              title="Total Produk"
              value={stats.totalProducts}
              icon={Package}
              description="Semua produk"
            />

            <StatCard
              title="Produk Aktif"
              value={stats.activeProducts}
              icon={Boxes}
              description="Siap ditampilkan"
            />

            <StatCard
              title="Stok Menipis"
              value={stats.lowStockProducts}
              icon={AlertTriangle}
              description="Stok 1 sampai 5"
            />

            <StatCard
              title="Stok Habis"
              value={stats.outOfStockProducts}
              icon={Tag}
              description="Perlu restock"
            />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Daftar Produk
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Kelola produk yang tampil di BaenTech Store.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={loadAdminProducts}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                  <RefreshCcw size={17} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/products/create")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Tambah Produk
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Cari nama, brand, atau kategori..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Tidak Aktif</option>
                <option value="DRAFT">Draft</option>
              </select>

              <select
                value={selectedStock}
                onChange={(event) => setSelectedStock(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
              >
                <option value="ALL">Semua Stok</option>
                <option value="READY">Stok Aman</option>
                <option value="LOW_STOCK">Stok Menipis</option>
                <option value="OUT_OF_STOCK">Stok Habis</option>
              </select>
            </div>

            {loading && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                  Memuat data produk...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm font-black text-red-600 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-black text-slate-500 dark:text-slate-400">
                  Produk tidak ditemukan.
                </p>
              </div>
            )}

            {!loading && !error && filteredProducts.length > 0 && (
              <>
                <div className="mt-8 hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <TableHead>Produk</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Stok</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead align="right">Aksi</TableHead>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {paginatedProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <ProductImage product={product} />

                                <div>
                                  <p className="max-w-[260px] truncate text-sm font-black text-slate-950 dark:text-white">
                                    {product.name}
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {product.brand || "Tanpa brand"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {getCategoryName(product)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm font-black text-slate-900 dark:text-white">
                              {formatCurrency(product.price)}
                            </td>

                            <td className="px-5 py-4">
                              <StockBadge stock={product.stock} />
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={product.status} />
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                              {formatDate(product.createdAt)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/admin/products/edit/${product.id}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                                >
                                  <Trash2 size={14} />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:hidden">
                  {paginatedProducts.map((product) => (
                    <MobileProductCard
                      key={product.id}
                      product={product}
                      onEdit={() =>
                        navigate(`/admin/products/edit/${product.id}`)
                      }
                      onDelete={() => handleDeleteProduct(product)}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPrev={goPrevPage}
                  onNext={goNextPage}
                />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SidebarContent({ onLogout, onNavigate }) {
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
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/products"
          icon={Package}
          label="Products"
          active
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/categories"
          icon={Tag}
          label="Categories"
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/orders"
          icon={ShoppingBag}
          label="Orders"
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/payments"
          icon={CreditCard}
          label="Payments"
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/customers"
          icon={Users}
          label="Customers"
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/finance"
          icon={Wallet}
          label="Finance"
          onNavigate={onNavigate}
        />

        <AdminNavLink
          to="/admin/reports"
          icon={BarChart3}
          label="Reports"
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

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            {value}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function ProductImage({ product }) {
  const imageUrl = getProductImage(product);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package size={22} className="text-slate-400" />
      )}
    </div>
  );
}

function MobileProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-4">
        <ProductImage product={product} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">
            {product.name}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {product.brand || "Tanpa brand"} • {getCategoryName(product)}
          </p>

          <p className="mt-2 text-sm font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StockBadge stock={product.stock} />
        <StatusBadge status={product.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-600 hover:text-white dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-black text-red-700 transition hover:bg-red-600 hover:text-white dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
        >
          <Trash2 size={15} />
          Hapus
        </button>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPrev,
  onNext,
}) {
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
        Menampilkan{" "}
        <span className="text-slate-900 dark:text-white">
          {totalItems === 0 ? 0 : startIndex + 1}
        </span>{" "}
        -{" "}
        <span className="text-slate-900 dark:text-white">
          {Math.min(endIndex, totalItems)}
        </span>{" "}
        dari{" "}
        <span className="text-slate-900 dark:text-white">{totalItems}</span>{" "}
        produk
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isPrevDisabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 dark:border-slate-700 dark:text-white">
          {currentPage} / {totalPages}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function StockBadge({ stock }) {
  const stockStatus = getStockStatus(stock);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${stockStatus.className}`}
    >
      {stockStatus.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const productStatus = getProductStatus({ status });

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${productStatus.className}`}
    >
      {productStatus.label}
    </span>
  );
}

function getCategoryName(product) {
  if (product.categoryName) {
    return product.categoryName;
  }

  if (product.category?.name) {
    return product.category.name;
  }

  if (typeof product.category === "string") {
    return product.category;
  }

  return "Tanpa Kategori";
}

function getCategoryId(product) {
  return product.categoryId || product.category?.id || "";
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

function getProductStatus(product) {
  const status = String(product?.status || "UNKNOWN").toUpperCase();

  if (status === "ACTIVE") {
    return {
      value: "ACTIVE",
      label: "Aktif",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    };
  }

  if (status === "INACTIVE") {
    return {
      value: "INACTIVE",
      label: "Tidak Aktif",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
  }

  if (status === "DRAFT") {
    return {
      value: "DRAFT",
      label: "Draft",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }

  return {
    value: status,
    label: status === "UNKNOWN" ? "Unknown" : status,
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
}

function getStockStatus(stock) {
  const stockValue = Number(stock || 0);

  if (stockValue <= 0) {
    return {
      value: "OUT_OF_STOCK",
      label: "Stok Habis",
      className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    };
  }

  if (stockValue <= 5) {
    return {
      value: "LOW_STOCK",
      label: `${stockValue} tersisa`,
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }

  return {
    value: "READY",
    label: `${stockValue} stok`,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default AdminProducts;
