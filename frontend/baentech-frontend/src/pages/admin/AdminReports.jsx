import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileSpreadsheet,
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
  TrendingUp,
  Truck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  exportOrderReportExcelApi,
  exportPaymentReportExcelApi,
  getIncomeChartApi,
  getOrderReportsApi,
  getPaymentReportsApi,
  getReportSummaryApi,
} from "../../api/reportApi";

const INCOME_PERIOD_OPTIONS = ["WEEK", "MONTH", "YEAR"];

function AdminReports() {
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

  const [summary, setSummary] = useState({});
  const [incomeChart, setIncomeChart] = useState([]);
  const [orderReports, setOrderReports] = useState([]);
  const [paymentReports, setPaymentReports] = useState([]);

  const [activeTab, setActiveTab] = useState("orders");
  const [incomePeriod, setIncomePeriod] = useState("WEEK");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [exportingOrder, setExportingOrder] = useState(false);
  const [exportingPayment, setExportingPayment] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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
    fetchReportPageData();
  }, []);

  useEffect(() => {
    fetchIncomeChart();
  }, [incomePeriod]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, keyword, orderReports, paymentReports]);

  const fetchReportPageData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const filter = {
        startDate,
        endDate,
      };

      const [summaryData, orderData, paymentData, incomeData] =
        await Promise.all([
          getReportSummaryApi(),
          getOrderReportsApi(filter),
          getPaymentReportsApi(filter),
          getIncomeChartApi(incomePeriod),
        ]);

      setSummary(summaryData || {});
      setOrderReports(normalizeListResponse(orderData));
      setPaymentReports(normalizeListResponse(paymentData));
      setIncomeChart(normalizeListResponse(incomeData));
    } catch (err) {
      console.log("ERROR FETCH REPORTS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengambil data reports. Pastikan report-service sudah berjalan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeChart = async () => {
    try {
      setIncomeLoading(true);
      const incomeData = await getIncomeChartApi(incomePeriod);
      setIncomeChart(normalizeListResponse(incomeData));
    } catch (err) {
      console.log("ERROR FETCH INCOME CHART:", err);
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleApplyFilter = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date tidak boleh lebih besar dari end date.");
      return;
    }

    await fetchReportPageData();
  };

  const handleResetFilter = async () => {
    setStartDate("");
    setEndDate("");
    setKeyword("");
    setCurrentPage(1);

    try {
      setLoading(true);
      setError("");

      const [summaryData, orderData, paymentData, incomeData] =
        await Promise.all([
          getReportSummaryApi(),
          getOrderReportsApi(),
          getPaymentReportsApi(),
          getIncomeChartApi(incomePeriod),
        ]);

      setSummary(summaryData || {});
      setOrderReports(normalizeListResponse(orderData));
      setPaymentReports(normalizeListResponse(paymentData));
      setIncomeChart(normalizeListResponse(incomeData));
    } catch (err) {
      console.log("ERROR RESET REPORTS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal reset filter reports.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrderExcel = async () => {
    try {
      setExportingOrder(true);
      setError("");
      setSuccessMessage("");

      await exportOrderReportExcelApi({
        startDate,
        endDate,
      });

      setSuccessMessage("Order report Excel berhasil di-download.");
    } catch (err) {
      console.log("ERROR EXPORT ORDER REPORT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal export order report.",
      );
    } finally {
      setExportingOrder(false);
    }
  };

  const handleExportPaymentExcel = async () => {
    try {
      setExportingPayment(true);
      setError("");
      setSuccessMessage("");

      await exportPaymentReportExcelApi({
        startDate,
        endDate,
      });

      setSuccessMessage("Payment report Excel berhasil di-download.");
    } catch (err) {
      console.log("ERROR EXPORT PAYMENT REPORT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal export payment report.",
      );
    } finally {
      setExportingPayment(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const normalizedOrders = useMemo(() => {
    return orderReports.map((order) => ({
      ...order,
      _id: order.orderId || order.id,
      _orderNumber:
        order.orderNumber || `ORD-${order.orderId || order.id || "-"}`,
      _email: order.email || "-",
      _recipientName: order.recipientName || order.customerName || "Customer",
      _city: order.city || "-",
      _province: order.province || "-",
      _totalPrice: Number(order.totalPrice || order.amount || 0),
      _status: String(order.status || "UNKNOWN").toUpperCase(),
      _createdAt: order.createdAt || order.orderDate || null,
    }));
  }, [orderReports]);

  const normalizedPayments = useMemo(() => {
    return paymentReports.map((payment) => ({
      ...payment,
      _id: payment.paymentId || payment.id,
      _orderId: payment.orderId || "-",
      _paymentNumber:
        payment.paymentNumber ||
        `PAY-${payment.paymentId || payment.id || "-"}`,
      _email: payment.email || "-",
      _amount: Number(payment.amount || 0),
      _paymentMethod: payment.paymentMethod || "-",
      _status: String(payment.status || "UNKNOWN").toUpperCase(),
      _paidAt: payment.paidAt || null,
      _createdAt: payment.createdAt || null,
    }));
  }, [paymentReports]);

  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((order) => {
      const text =
        `${order._orderNumber} ${order._email} ${order._recipientName} ${order._city} ${order._province} ${order._status}`.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [normalizedOrders, keyword]);

  const filteredPayments = useMemo(() => {
    return normalizedPayments.filter((payment) => {
      const text =
        `${payment._paymentNumber} ${payment._email} ${payment._paymentMethod} ${payment._status}`.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [normalizedPayments, keyword]);

  const activeRows = activeTab === "orders" ? filteredOrders : filteredPayments;

  const totalPages = Math.max(1, Math.ceil(activeRows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeRows.slice(start, start + itemsPerPage);
  }, [activeRows, currentPage]);

  const goPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const totalRevenue = getSummaryNumber(summary, [
    "totalRevenue",
    "revenue",
    "income",
    "totalIncome",
  ]);

  const totalOrders = getSummaryNumber(summary, ["totalOrders", "orders"]);
  const completedOrders = getSummaryNumber(summary, [
    "completedOrders",
    "totalCompletedOrders",
  ]);
  const successPayments = getSummaryNumber(summary, [
    "successPayments",
    "totalSuccessPayments",
  ]);
  const totalShippings = getSummaryNumber(summary, [
    "totalShippings",
    "shippings",
  ]);

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
                    Reports
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Reports
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

          <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                Reports Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Pantau summary, order report, payment report, income chart, dan
                export Excel dari report-service.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={fetchReportPageData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleExportOrderExcel}
                disabled={exportingOrder}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={18} />
                {exportingOrder ? "Exporting..." : "Order Excel"}
              </button>

              <button
                type="button"
                onClick={handleExportPaymentExcel}
                disabled={exportingPayment}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-500/30 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSpreadsheet size={18} />
                {exportingPayment ? "Exporting..." : "Payment Excel"}
              </button>
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

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-5">
            {" "}
            <StatCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              subtitle="Payment SUCCESS"
              icon={TrendingUp}
              color="green"
              loading={loading}
              isMoney
            />
            <StatCard
              title="Total Orders"
              value={totalOrders}
              subtitle="Semua order"
              icon={ShoppingBag}
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Success Payments"
              value={successPayments}
              subtitle="Pembayaran berhasil"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />
            <StatCard
              title="Completed Orders"
              value={completedOrders}
              subtitle="Order selesai"
              icon={CheckCircle2}
              color="purple"
              loading={loading}
            />
            <StatCard
              title="Total Shippings"
              value={totalShippings}
              subtitle="Semua pengiriman"
              icon={Truck}
              color="orange"
              loading={loading}
            />
          </div>

          <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            {" "}
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {" "}
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    Income Chart
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Grafik pemasukan berdasarkan periode.
                  </p>
                </div>
                <select
                  value={incomePeriod}
                  onChange={(e) => setIncomePeriod(e.target.value)}
                  className="h-11 w-full max-w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:w-40"
                >
                  {INCOME_PERIOD_OPTIONS.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <IncomeChart
                data={incomeChart}
                loading={incomeLoading || loading}
              />
            </div>
            <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                Date Filter
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Filter berlaku untuk order dan payment report.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 2xl:grid-cols-1">
                  {" "}
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    activeTab === "orders"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-500 hover:text-blue-600 dark:text-slate-400"
                  }`}
                >
                  Order Reports
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    activeTab === "payments"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-500 hover:text-blue-600 dark:text-slate-400"
                  }`}
                >
                  Payment Reports
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950 xl:w-[380px]">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={
                    activeTab === "orders"
                      ? "Search order/customer/status..."
                      : "Search payment/email/method/status..."
                  }
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {activeTab === "orders" ? (
              <OrderReportTable
                loading={loading}
                rows={paginatedRows}
                totalRows={activeRows.length}
              />
            ) : (
              <PaymentReportTable
                loading={loading}
                rows={paginatedRows}
                totalRows={activeRows.length}
              />
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {paginatedRows.length} of {activeRows.length}{" "}
                {activeTab === "orders" ? "orders" : "payments"}
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

function OrderReportTable({ loading, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          <tr>
            <th className="px-5 py-4">Order</th>
            <th className="px-5 py-4">Customer</th>
            <th className="px-5 py-4">Email</th>
            <th className="px-5 py-4">Location</th>
            <th className="px-5 py-4">Total</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Created At</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && (
            <tr>
              <td
                colSpan="7"
                className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
              >
                Memuat order reports...
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan="7"
                className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
              >
                Order report tidak ditemukan.
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((order) => (
              <tr
                key={`${order._id}-${order._orderNumber}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
              >
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950 dark:text-white">
                    #{order._orderNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    ID: {order._id || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {order._recipientName}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {order._email}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {order._city}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">
                    {order._province}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {formatCurrency(order._totalPrice)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={order._status} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <CalendarDays size={16} className="mt-0.5 text-slate-400" />
                    <span>{formatDate(order._createdAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentReportTable({ loading, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          <tr>
            <th className="px-5 py-4">Payment</th>
            <th className="px-5 py-4">Order ID</th>
            <th className="px-5 py-4">Email</th>
            <th className="px-5 py-4">Amount</th>
            <th className="px-5 py-4">Method</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Paid At</th>
            <th className="px-5 py-4">Created At</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && (
            <tr>
              <td
                colSpan="8"
                className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
              >
                Memuat payment reports...
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan="8"
                className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
              >
                Payment report tidak ditemukan.
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((payment) => (
              <tr
                key={`${payment._id}-${payment._paymentNumber}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
              >
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950 dark:text-white">
                    #{payment._paymentNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    ID: {payment._id || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {payment._orderId}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {payment._email}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {formatCurrency(payment._amount)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    {payment._paymentMethod}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={payment._status} />
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {formatDate(payment._paidAt)}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {formatDate(payment._createdAt)}
                  </p>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function IncomeChart({ data, loading }) {
  const normalizedData = normalizeListResponse(data).map((item) => ({
    label: item.label || item.name || item.period || "-",
    value: Number(item.value || item.amount || item.total || 0),
  }));

  const maxValue = Math.max(...normalizedData.map((item) => item.value), 1);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center rounded-3xl bg-slate-50 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400 sm:h-72">
        Memuat income chart...
      </div>
    );
  }

  if (normalizedData.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-3xl bg-slate-50 px-4 text-center text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400 sm:h-72">
        Data income chart belum tersedia.
      </div>
    );
  }

  return (
    <div className="h-60 min-w-0 overflow-hidden rounded-3xl bg-slate-50 p-3 dark:bg-slate-950 sm:h-72 sm:p-4">
      <div className="flex h-full min-w-0 items-end gap-2 overflow-x-auto overflow-y-hidden pb-2 sm:gap-3">
        {normalizedData.map((item, index) => {
          const height = Math.max(12, (item.value / maxValue) * 170);

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-[52px] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[70px]"
            >
              <p className="max-w-full truncate text-center text-[10px] font-black text-slate-700 dark:text-slate-200 sm:text-xs">
                {formatShortCurrency(item.value)}
              </p>

              <div
                className="w-full rounded-t-2xl bg-blue-600 shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
                style={{
                  height: `${height}px`,
                }}
              />

              <p className="max-w-full truncate text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
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
  isMoney = false,
}) {
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
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            colorMap[color] || colorMap.blue
          }`}
        >
          <Icon size={24} />
        </div>

        <div className="hidden h-10 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 sm:block" />
      </div>

      <div className="mt-5 min-w-0">
        <p className="truncate text-xs font-black uppercase text-slate-500 dark:text-slate-400 sm:text-sm">
          {title}
        </p>

        <p
          className={`mt-2 max-w-full overflow-hidden font-black leading-tight text-slate-950 dark:text-white ${
            isMoney
              ? "break-words text-[clamp(0.95rem,3.5vw,1.45rem)]"
              : "text-2xl sm:text-3xl"
          }`}
        >
          {loading ? "..." : value}
        </p>

        <p className="mt-2 truncate text-xs font-bold text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "-").toUpperCase();

  const isGreen = [
    "SUCCESS",
    "PAID",
    "COMPLETED",
    "DELIVERED",
    "RECEIVED",
  ].includes(status);

  const isRed = ["FAILED", "CANCELLED", "CANCELED"].includes(status);

  const isOrange = ["PENDING", "PENDING_PAYMENT"].includes(status);

  const isPurple = ["PROCESSING", "SHIPPED"].includes(status);

  const className = isGreen
    ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
    : isRed
      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
      : isOrange
        ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
        : isPurple
          ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
          : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.payments)) return data.payments;

  return [];
}

function getSummaryNumber(summary, keys) {
  for (const key of keys) {
    if (summary?.[key] !== undefined && summary?.[key] !== null) {
      return Number(summary[key] || 0);
    }
  }

  return 0;
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

function formatShortCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000_000) {
    return `Rp ${(number / 1_000_000_000).toFixed(1)}M`;
  }

  if (number >= 1_000_000) {
    return `Rp ${(number / 1_000_000).toFixed(1)}Jt`;
  }

  if (number >= 1_000) {
    return `Rp ${(number / 1_000).toFixed(0)}Rb`;
  }

  return formatCurrency(number);
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

export default AdminReports;
