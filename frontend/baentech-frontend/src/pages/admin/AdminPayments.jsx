import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAdminPaymentsApi,
  getPaymentByIdApi,
  markPaymentFailedApi,
  markPaymentSuccessApi,
} from "../../api/paymentApi";

const PAYMENT_STATUSES = [
  "ALL",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
];

const PAYMENT_METHODS = [
  "ALL",
  "BANK_TRANSFER",
  "E_WALLET",
  "QRIS",
  "CREDIT_CARD",
  "COD",
];

function getSavedAdminProfile() {
  try {
    return JSON.parse(localStorage.getItem("adminProfile") || "{}");
  } catch {
    return {};
  }
}

function AdminPayments() {
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
  const [payments, setPayments] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await getAdminPaymentsApi();
      setPayments(data);
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data payments. Pastikan payment-service sudah berjalan dan token admin valid.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const normalizePayment = (payment) => {
    return {
      ...payment,
      _id: payment?.id,
      _orderId: payment?.orderId || "-",
      _orderNumber: payment?.orderNumber || "-",
      _email: payment?.email || "-",
      _paymentNumber: payment?.paymentNumber || `PAY-${payment?.id || "-"}`,
      _amount: Number(payment?.amount || 0),
      _paymentMethod: payment?.paymentMethod || "-",
      _status: payment?.status || "PENDING",
      _paidAt: payment?.paidAt || null,
      _createdAt: payment?.createdAt || null,
      _updatedAt: payment?.updatedAt || null,
    };
  };

  const normalizedPayments = useMemo(() => {
    return payments.map((payment) => normalizePayment(payment));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return normalizedPayments.filter((payment) => {
      const text =
        `${payment._paymentNumber} ${payment._orderNumber} ${payment._orderId} ${payment._email} ${payment._paymentMethod}`.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        String(payment._status).toUpperCase() === statusFilter;

      const matchMethod =
        methodFilter === "ALL" ||
        String(payment._paymentMethod).toUpperCase() === methodFilter;

      return matchKeyword && matchStatus && matchMethod;
    });
  }, [normalizedPayments, keyword, statusFilter, methodFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / itemsPerPage),
  );

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalPayments = normalizedPayments.length;

  const successPayments = normalizedPayments.filter(
    (payment) => String(payment._status).toUpperCase() === "SUCCESS",
  ).length;

  const pendingPayments = normalizedPayments.filter(
    (payment) => String(payment._status).toUpperCase() === "PENDING",
  ).length;

  const failedPayments = normalizedPayments.filter((payment) =>
    ["FAILED", "EXPIRED", "CANCELLED"].includes(
      String(payment._status).toUpperCase(),
    ),
  ).length;

  const totalRevenue = normalizedPayments
    .filter((payment) => String(payment._status).toUpperCase() === "SUCCESS")
    .reduce((sum, payment) => sum + Number(payment._amount || 0), 0);

  const openDetailModal = async (payment) => {
    try {
      setDetailLoading(true);
      setSelectedPayment(payment);
      setDetailModalOpen(true);

      if (payment._id) {
        const detail = await getPaymentByIdApi(payment._id);
        setSelectedPayment(normalizePayment(detail));
      }
    } catch (err) {
      console.log(err);
      setSelectedPayment(payment);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    if (actionLoading) return;

    setDetailModalOpen(false);
    setSelectedPayment(null);
  };

  const updatePaymentInState = (paymentId, updatedData, fallbackStatus) => {
    setPayments((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(paymentId)) return item;

        return {
          ...item,
          ...updatedData,
          status: updatedData?.status || fallbackStatus || item.status,
          paidAt: updatedData?.paidAt || item.paidAt,
          updatedAt: updatedData?.updatedAt || item.updatedAt,
        };
      }),
    );
  };

  const handleMarkSuccess = async (payment) => {
    if (!payment?._id) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const updated = await markPaymentSuccessApi(payment._id);

      updatePaymentInState(payment._id, updated, "SUCCESS");

      setSelectedPayment((prev) =>
        normalizePayment({
          ...prev,
          ...updated,
          status: updated?.status || "SUCCESS",
        }),
      );

      setSuccess("Payment berhasil ditandai SUCCESS.");
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message ||
          "Gagal mengubah payment menjadi SUCCESS.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFailed = async (payment) => {
    if (!payment?._id) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const updated = await markPaymentFailedApi(payment._id);

      updatePaymentInState(payment._id, updated, "FAILED");

      setSelectedPayment((prev) =>
        normalizePayment({
          ...prev,
          ...updated,
          status: updated?.status || "FAILED",
        }),
      );

      setSuccess("Payment berhasil ditandai FAILED.");
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data?.message || "Gagal mengubah payment menjadi FAILED.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setMethodFilter("ALL");
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
      {detailModalOpen && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          loading={detailLoading}
          actionLoading={actionLoading}
          onClose={closeDetailModal}
          onMarkSuccess={handleMarkSuccess}
          onMarkFailed={handleMarkFailed}
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
                    Payments
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Payments
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
                Payment Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Admin hanya melihat semua pembayaran dan mengubah status payment
                PENDING menjadi SUCCESS atau FAILED.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchPayments}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
              >
                <Filter size={18} />
                Reset Filter
              </button>
            </div>
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
            <StatCard
              title="Total Payments"
              value={totalPayments}
              subtitle="Semua pembayaran"
              icon={CreditCard}
              color="blue"
              loading={loading}
            />

            <StatCard
              title="Success"
              value={successPayments}
              subtitle="Pembayaran berhasil"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Pending"
              value={pendingPayments}
              subtitle="Menunggu pembayaran"
              icon={Clock3}
              color="orange"
              loading={loading}
            />

            <StatCard
              title="Failed"
              value={failedPayments}
              subtitle="Gagal / expired"
              icon={XCircle}
              color="red"
              loading={loading}
            />

            <StatCard
              title="Revenue"
              value={formatCurrency(totalRevenue)}
              subtitle="Dari status SUCCESS"
              icon={Wallet}
              color="purple"
              loading={loading}
              smallValue
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_0.7fr]">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search payment number, order number, email..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All Status" : status}
                  </option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === "ALL" ? "All Method" : method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Payment Number</th>
                    <th className="px-5 py-4">Order Number</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Paid At</th>
                    <th className="px-5 py-4">Created At</th>
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
                        Memuat data payments...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Payment tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedPayments.map((payment) => (
                      <tr
                        key={payment._id || payment._paymentNumber}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950 dark:text-white">
                            {payment._paymentNumber}
                          </p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            ID: {payment._id || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {payment._orderNumber}
                          </p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Order ID: {payment._orderId}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                              <Users size={18} />
                            </div>

                            <div>
                              <p className="font-black text-slate-950 dark:text-white">
                                {payment._email}
                              </p>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Customer email
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {formatCurrency(payment._amount)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                            <CreditCard size={14} />
                            {payment._paymentMethod}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge value={payment._status} />
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {formatDate(payment._paidAt)}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {formatDate(payment._createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openDetailModal(payment)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            >
                              <Eye size={16} />
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
                Showing {paginatedPayments.length} of {filteredPayments.length}{" "}
                payments
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
  smallValue,
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
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

        <p
          className={`mt-2 font-black text-slate-950 dark:text-white ${
            smallValue ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          }`}
        >
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

  const className =
    status === "SUCCESS"
      ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
      : ["FAILED", "EXPIRED", "CANCELLED"].includes(status)
        ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
        : "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function PaymentDetailModal({
  payment,
  loading,
  actionLoading,
  onClose,
  onMarkSuccess,
  onMarkFailed,
}) {
  const status = String(payment._status || "PENDING").toUpperCase();
  const canAdminAction = status === "PENDING";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Detail Payment {payment._paymentNumber}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Admin hanya bisa action untuk payment berstatus PENDING.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Memuat detail payment...
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DetailItem label="Payment Number" value={payment._paymentNumber} />
          <DetailItem label="Payment ID" value={payment._id} />
          <DetailItem label="Order Number" value={payment._orderNumber} />
          <DetailItem label="Order ID" value={payment._orderId} />
          <DetailItem label="Email" value={payment._email} />
          <DetailItem label="Amount" value={formatCurrency(payment._amount)} />
          <DetailItem label="Method" value={payment._paymentMethod} />
          <DetailItem label="Paid At" value={formatDate(payment._paidAt)} />
          <DetailItem
            label="Created At"
            value={formatDate(payment._createdAt)}
          />
          <DetailItem
            label="Updated At"
            value={formatDate(payment._updatedAt)}
          />

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 md:col-span-2">
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Status
            </p>

            <div className="mt-2">
              <StatusBadge value={payment._status} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
          <p className="text-sm font-black text-slate-950 dark:text-white">
            Admin Action
          </p>

          {canAdminAction ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Payment masih PENDING. Admin bisa menandai pembayaran menjadi
                SUCCESS atau FAILED.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onMarkSuccess(payment)}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={18} />
                  {actionLoading ? "Memproses..." : "Mark Success"}
                </button>

                <button
                  type="button"
                  onClick={() => onMarkFailed(payment)}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={18} />
                  {actionLoading ? "Memproses..." : "Mark Failed"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Tidak ada action. Status payment ini sudah{" "}
              <span className="font-black text-slate-900 dark:text-white">
                {status}
              </span>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
      <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-black text-slate-950 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
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

export default AdminPayments;
