import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Edit,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Truck,
  Trash2,
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
  createAdminCategoryApi,
  updateAdminCategoryApi,
  deleteAdminCategoryApi,
} from "../../api/adminApi";

const emptyForm = {
  name: "",
  description: "",
};

function AdminCategories() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteModalCategory, setDeleteModalCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    // {
    //   name: "Customers",
    //   icon: Users,
    //   active: location.pathname === "/admin/customers",
    //   path: "/admin/customers",
    // },
    // {
    //   name: "Finance",
    //   icon: Wallet,
    //   active: location.pathname === "/admin/finance",
    //   path: "/admin/finance",
    // },
    {
      name: "Reports",
      icon: BarChart3,
      active: location.pathname === "/admin/reports",
      path: "/admin/reports",
    },
  ];

  useEffect(() => {
    fetchCategoriesPageData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const fetchCategoriesPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryData, productData] = await Promise.all([
        getAdminCategoriesApi(),
        getAdminProductsApi(),
      ]);

      setCategories(categoryData);
      setProducts(productData);
    } catch (err) {
      console.log(err);
      setError("Gagal mengambil data categories.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category) => {
    return category?.name || category?.categoryName || "-";
  };

  const getCategoryDescription = (category) => {
    return category?.description || category?.desc || "Tidak ada deskripsi.";
  };

  const getProductCategoryName = (product) => {
    return (
      product.categoryName ||
      product.category?.name ||
      product.category?.categoryName ||
      ""
    );
  };

  const getProductCountByCategory = (category) => {
    const categoryName = getCategoryName(category).toLowerCase();

    return products.filter((product) => {
      return getProductCategoryName(product).toLowerCase() === categoryName;
    }).length;
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const text = `${getCategoryName(category)} ${getCategoryDescription(
        category,
      )}`.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [categories, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / itemsPerPage),
  );

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((category) => {
    return !category.status || category.status === "ACTIVE";
  }).length;
  const inactiveCategories = totalCategories - activeCategories;
  const totalProducts = products.length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: getCategoryName(category),
      description:
        getCategoryDescription(category) === "Tidak ada deskripsi."
          ? ""
          : getCategoryDescription(category),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeFormModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Nama category wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingCategory) {
        const updated = await updateAdminCategoryApi(
          editingCategory.id,
          payload,
        );

        setCategories((prev) =>
          prev.map((item) =>
            String(item.id) === String(editingCategory.id)
              ? {
                  ...item,
                  ...updated,
                  name: updated?.name || updated?.categoryName || payload.name,
                  description: updated?.description || payload.description,
                }
              : item,
          ),
        );

        setSuccess("Category berhasil diperbarui.");
      } else {
        const created = await createAdminCategoryApi(payload);

        setCategories((prev) => [
          ...prev,
          {
            ...created,
            name: created?.name || created?.categoryName || payload.name,
            description: created?.description || payload.description,
          },
        ]);

        setSuccess("Category berhasil ditambahkan.");
      }

      closeFormModal();
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
          "Gagal menyimpan category. Cek kembali data category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (category) => {
    setDeleteModalCategory(category);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalCategory(null);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteModalCategory) return;

    try {
      setDeleteLoading(true);
      setError("");
      setSuccess("");

      await deleteAdminCategoryApi(deleteModalCategory.id);

      setCategories((prev) =>
        prev.filter(
          (item) => String(item.id) !== String(deleteModalCategory.id),
        ),
      );

      setDeleteModalCategory(null);
      setSuccess("Category berhasil dihapus.");
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
          "Gagal menghapus category. Pastikan category tidak sedang digunakan produk.",
      );
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
      {modalOpen && (
        <CategoryFormModal
          editingCategory={editingCategory}
          form={form}
          saving={saving}
          onChange={handleChange}
          onClose={closeFormModal}
          onSubmit={handleSubmitCategory}
        />
      )}

      {deleteModalCategory && (
        <ConfirmDeleteModal
          category={deleteModalCategory}
          loading={deleteLoading}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteCategory}
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
                    Categories
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Categories
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
                Category Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Kelola kategori produk BaenTech Store dengan tampilan admin yang
                rapi.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
            >
              <Plus size={19} />
              Add Category
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-100 px-5 py-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl bg-green-100 px-5 py-4 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {success}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            <StatCard
              title="Total Categories"
              value={totalCategories}
              subtitle="Semua kategori"
              icon={Tag}
              color="blue"
              loading={loading}
            />

            <StatCard
              title="Active"
              value={activeCategories}
              subtitle="Kategori aktif"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Inactive"
              value={inactiveCategories}
              subtitle="Kategori nonaktif"
              icon={AlertTriangle}
              color="orange"
              loading={loading}
            />

            <StatCard
              title="Products"
              value={totalProducts}
              subtitle="Total produk"
              icon={Package}
              color="purple"
              loading={loading}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={fetchCategoriesPageData}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">No.</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Products</th>
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
                        Memuat data categories...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedCategories.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Category tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedCategories.map((category, index) => (
                      <tr
                        key={category.id || getCategoryName(category)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        <td className="px-5 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                              <Tag size={20} />
                            </div>

                            <div>
                              <p className="font-black text-slate-950 dark:text-white">
                                {getCategoryName(category)}
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                ID: {category.id || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {getCategoryDescription(category)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                            {getProductCountByCategory(category)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              category.status === "INACTIVE"
                                ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                                : "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
                            }`}
                          >
                            {category.status || "ACTIVE"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(category)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
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
                Showing {paginatedCategories.length} of{" "}
                {filteredCategories.length} categories
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevPage}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  <ChevronLeftIcon />
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
                  <ChevronRightIcon />
                </button>
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

function CategoryFormModal({
  editingCategory,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Lengkapi informasi category produk.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <FormField label="Nama Category" required>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              className="admin-input"
              placeholder="Contoh: Laptop"
            />
          </FormField>

          <FormField label="Deskripsi">
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows="5"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Deskripsi singkat category"
            />
          </FormField>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDeleteModal({ category, loading, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          <Trash2 size={30} />
        </div>

        <div className="mt-5 text-center">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Hapus Category?
          </h3>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
            Category{" "}
            <span className="font-black text-slate-900 dark:text-white">
              {category?.name || category?.categoryName}
            </span>{" "}
            akan dihapus dari BaenTech Store.
          </p>

          <p className="mt-2 text-xs font-bold text-red-500">
            Pastikan category tidak sedang digunakan produk.
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

function FormField({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ChevronLeftIcon() {
  return <span className="text-lg leading-none">‹</span>;
}

function ChevronRightIcon() {
  return <span className="text-lg leading-none">›</span>;
}

export default AdminCategories;
