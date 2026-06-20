import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
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
  Truck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi, updateAdminOrderStatusApi } from "../../api/orderApi";
import { getAdminPaymentsApi } from "../../api/paymentApi";

const ORDER_FILTERS = ["ALL", "PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
const PAYMENT_FILTERS = ["ALL", "NO_PAYMENT", "PENDING", "SUCCESS", "FAILED", "EXPIRED", "CANCELLED"];

function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { openConfirm } = useConfirm();
  const { showToast } = useToast();
  const adminProfile = getSavedAdminProfile();
  const adminName = adminProfile?.fullName || user?.fullName || user?.name || user?.email || "Admin";
  const adminProfileImage = adminProfile?.profileImageUrl || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const menus = [
    ["Dashboard", LayoutDashboard, "/admin/dashboard"],
    ["Products", Package, "/admin/products"],
    ["Categories", Tag, "/admin/categories"],
    ["Orders", ShoppingBag, "/admin/orders"],
    ["Payments", CreditCard, "/admin/payments"],
    ["Shipping", Truck, "/admin/shipping"],
    ["Reports", BarChart3, "/admin/reports"],
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, paymentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const [orderData, paymentData] = await Promise.all([
        getAdminOrdersApi(),
        getAdminPaymentsApi(),
      ]);
      setOrders(toList(orderData));
      setPayments(toList(paymentData));
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal mengambil data order.";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const refreshSilently = async () => {
    const [orderData, paymentData] = await Promise.all([
      getAdminOrdersApi(),
      getAdminPaymentsApi(),
    ]);
    setOrders(toList(orderData));
    setPayments(toList(paymentData));
  };

  const handleLogout = () => {
    openConfirm({
      title: "Logout Admin?",
      message: "Sesi admin akan ditutup.",
      confirmText: "Logout",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: () => {
        logout();
        navigate("/login");
      },
    });
  };

  const getPayment = (order) => payments.find((payment) => {
    const orderId = order.id || order.orderId;
    return String(payment.orderId || "") === String(orderId || "") || String(payment.orderNumber || "") === String(order.orderNumber || "");
  });

  const normalizedOrders = useMemo(() => orders.map((order) => {
    const payment = getPayment(order) || null;
    return {
      raw: order,
      payment,
      id: order.id || order.orderId,
      number: order.orderNumber || order.orderCode || order.id || "-",
      name: order.recipientName || order.customerName || order.fullName || order.userName || order.email || "Customer",
      email: order.email || order.customerEmail || order.userEmail || "-",
      phone: order.phoneNumber || order.customerPhone || order.phone || "-",
      total: Number(order.totalPrice || order.totalAmount || order.total || 0),
      status: String(order.status || order.orderStatus || "PENDING_PAYMENT").toUpperCase(),
      paymentStatus: payment?.status ? String(payment.status).toUpperCase() : "NO_PAYMENT",
      paymentMethod: payment?.paymentMethod || "-",
      gateway: payment?.gateway || "-",
      date: order.createdAt || order.orderDate || order.updatedAt || null,
      items: Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [],
    };
  }), [orders, payments]);

  const filteredOrders = useMemo(() => normalizedOrders.filter((order) => {
    const text = `${order.number} ${order.name} ${order.email} ${order.phone}`.toLowerCase();
    return text.includes(keyword.toLowerCase()) &&
      (statusFilter === "ALL" || order.status === statusFilter) &&
      (paymentFilter === "ALL" || order.paymentStatus === paymentFilter);
  }), [normalizedOrders, keyword, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const pageOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalOrders = normalizedOrders.length;
  const pendingOrders = normalizedOrders.filter((order) => order.status === "PENDING_PAYMENT").length;
  const paidOrders = normalizedOrders.filter((order) => order.status === "PAID").length;
  const shippedOrders = normalizedOrders.filter((order) => order.status === "SHIPPED").length;
  const completedOrders = normalizedOrders.filter((order) => order.status === "COMPLETED").length;

  const cancelOrder = (order) => {
    if (!["PENDING_PAYMENT", "PAID"].includes(order.status)) {
      showToast({ type: "warning", message: "Order hanya bisa dibatalkan sebelum dikirim." });
      return;
    }

    openConfirm({
      title: "Batalkan Order?",
      message: `Order ${order.number} akan dibatalkan.`,
      confirmText: "Ya, Batalkan",
      cancelText: "Tidak",
      variant: "danger",
      onConfirm: async () => {
        try {
          setUpdatingOrderId(order.id);
          setError("");
          await updateAdminOrderStatusApi(order.id, "CANCELLED");
          await refreshSilently();
          setSuccessMessage("Order berhasil dibatalkan.");
          showToast({ type: "success", message: "Order berhasil dibatalkan." });
        } catch (err) {
          const message = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal membatalkan order.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setUpdatingOrderId(null);
        }
      },
    });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <BrandLogo to="/admin/dashboard" />
        <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden">
          <X size={18} />
        </button>
      </div>
      <nav className="mt-3 flex-1 space-y-2 px-4">
        {menus.map(([name, Icon, path]) => (
          <Link key={name} to={path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition ${location.pathname === path || (path === "/admin/products" && location.pathname.startsWith(path)) ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-400"}`}>
            <Icon size={21} />
            {name}
          </Link>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut size={21} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block"><SidebarContent /></aside>
      <aside className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white transition duration-300 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}><SidebarContent /></aside>

      <main className="lg:ml-72">
        <div className="p-3 sm:p-6 lg:p-8">
          <div className="sticky top-3 z-30 rounded-[2rem] border border-slate-200 bg-white/85 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"><Menu size={20} /></button>
                <div><h1 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">Orders</h1><p className="text-xs font-bold text-slate-500 dark:text-slate-400">Dashboard / Orders</p></div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-yellow-300">{isDarkMode ? <Sun size={19} /> : <Moon size={19} />}</button>
                <Link to="/admin/profile" className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 sm:flex">
                  {adminProfileImage ? <img src={adminProfileImage} alt={adminName} className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50"><Users size={18} /></div>}
                  <div><p className="text-sm font-black text-slate-950 dark:text-white">{adminName}</p><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Administrator</p></div>
                </Link>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">Simple Order Flow</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Order Management</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">Admin hanya membatalkan order sebelum dikirim atau membuat shipping untuk order yang sudah PAID.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={fetchData} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"><RefreshCw size={18} />Refresh</button>
                <button type="button" onClick={() => { setKeyword(""); setStatusFilter("ALL"); setPaymentFilter("ALL"); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"><Filter size={18} />Reset Filter</button>
              </div>
            </div>
          </section>

          {error && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300"><AlertTriangle size={18} className="mt-0.5 shrink-0" />{error}</div>}
          {successMessage && <div className="mt-5 rounded-2xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">{successMessage}</div>}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
            <StatCard title="Total" value={totalOrders} icon={ShoppingBag} loading={loading} />
            <StatCard title="Pending" value={pendingOrders} icon={Clock3} loading={loading} />
            <StatCard title="Paid" value={paidOrders} icon={CreditCard} loading={loading} />
            <StatCard title="Shipped" value={shippedOrders} icon={Truck} loading={loading} />
            <StatCard title="Completed" value={completedOrders} icon={CheckCircle2} loading={loading} />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"><Search size={19} className="text-slate-400" /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search order, customer, email..." className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white" /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">{ORDER_FILTERS.map((item) => <option key={item} value={item}>{item === "ALL" ? "All Order Status" : item}</option>)}</select>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">{PAYMENT_FILTERS.map((item) => <option key={item} value={item}>{item === "ALL" ? "All Payment" : item}</option>)}</select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th><th className="px-5 py-4">Date</th><th className="px-5 py-4 text-right">Detail</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && <tr><td colSpan="8" className="px-5 py-10 text-center text-sm font-bold text-slate-500">Memuat data orders...</td></tr>}
            {!loading && pageOrders.length === 0 && <tr><td colSpan="8" className="px-5 py-10 text-center text-sm font-bold text-slate-500">Order tidak ditemukan.</td></tr>}
            {!loading && pageOrders.map((order) => <OrderRow key={order.id || order.number} order={order} updatingOrderId={updatingOrderId} onCancel={cancelOrder} onShip={() => navigate("/admin/shipping")} onDetail={() => setSelectedOrder(order)} />)}
          </tbody></table></div></div>

          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages}</p><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black disabled:opacity-50 dark:border-slate-700">Prev</button><button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Next</button></div></div>
        </div>
      </main>
    </div>
  );
}

function OrderRow({ order, updatingOrderId, onCancel, onShip, onDetail }) {
  const canCancel = ["PENDING_PAYMENT", "PAID"].includes(order.status);
  const canShip = order.status === "PAID";
  return <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50"><td className="px-5 py-4"><p className="font-black text-slate-950 dark:text-white">#{order.number}</p><p className="text-xs font-bold text-slate-500">ID: {order.id || "-"}</p></td><td className="px-5 py-4"><p className="font-black text-slate-950 dark:text-white">{order.name}</p><p className="text-xs font-semibold text-slate-500">{order.email}</p></td><td className="px-5 py-4 font-black text-blue-600">{rupiah(order.total)}</td><td className="px-5 py-4"><StatusBadge value={order.paymentStatus} /><p className="mt-1 text-xs font-bold text-slate-500">{order.gateway} • {order.paymentMethod}</p></td><td className="px-5 py-4"><StatusBadge value={order.status} /></td><td className="px-5 py-4"><div className="flex flex-col gap-2">{canShip && <button onClick={onShip} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700">Buat Shipping</button>}{canCancel && <button disabled={updatingOrderId === order.id} onClick={() => onCancel(order)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-60">{updatingOrderId === order.id ? "Memproses..." : "Batalkan"}</button>}{!canShip && !canCancel && <span className="text-xs font-bold text-slate-500">No action</span>}</div></td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><CalendarDays size={16} />{date(order.date)}</span></td><td className="px-5 py-4 text-right"><button onClick={onDetail} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:border-blue-500 hover:text-blue-600 dark:border-slate-700"><Eye size={16} />Detail</button></td></tr>;
}

function OrderDetailModal({ order, onClose }) {
  return <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-[2rem] sm:p-6"><div className="flex justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800"><div><p className="text-xs font-black uppercase tracking-wide text-blue-600">Order Detail</p><h2 className="mt-1 text-2xl font-black dark:text-white">#{order.number}</h2></div><button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200"><X size={20} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><DetailBox label="Customer" value={order.name} /><DetailBox label="Email" value={order.email} /><DetailBox label="Phone" value={order.phone} /><DetailBox label="Total" value={rupiah(order.total)} /><DetailBox label="Order Status" value={order.status} /><DetailBox label="Payment Status" value={order.paymentStatus} /><DetailBox label="Gateway" value={order.gateway} /><DetailBox label="Tanggal" value={date(order.date)} /></div></div></div>;
}

function DetailBox({ label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">{value || "-"}</p></div>;
}

function StatCard({ title, value, icon: Icon, loading }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-3xl font-black dark:text-white">{loading ? "..." : value}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40"><Icon size={24} /></div></div></div>;
}

function StatusBadge({ value }) {
  const status = String(value || "-").toUpperCase();
  const cls = status === "SUCCESS" || status === "PAID" || status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : status === "SHIPPED" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : status === "FAILED" || status === "EXPIRED" || status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${cls}`}>{status}</span>;
}

function toList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.payments)) return value.payments;
  return [];
}

function getSavedAdminProfile() {
  try { return JSON.parse(localStorage.getItem("adminProfile") || "null"); } catch { return null; }
}
function rupiah(value) { return `Rp ${Number(value || 0).toLocaleString("id-ID")}`; }
function date(value) { if (!value) return "-"; return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default AdminOrders;
