import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
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
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sun,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi } from "../../api/orderApi";
import { createShippingApi, getAdminShippingsApi } from "../../api/shippingApi";

const COURIER_OPTIONS = ["JNE", "J&T", "SiCepat", "Anteraja", "POS Indonesia"];
const SHIPPING_FILTERS = ["ALL", "SHIPPED", "DELIVERED", "RECEIVED", "CANCELLED"];

function AdminShipping() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { openConfirm } = useConfirm();
  const { showToast } = useToast();

  const savedAdminProfile = getSavedAdminProfile();
  const adminName =
    savedAdminProfile?.fullName ||
    user?.fullName ||
    user?.name ||
    user?.email ||
    "Admin";
  const adminProfileImage = savedAdminProfile?.profileImageUrl || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shippings, setShippings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courierFilter, setCourierFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [formData, setFormData] = useState({
    orderId: "",
    courier: "JNE",
    trackingNumber: "",
    estimatedDays: 2,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, active: location.pathname === "/admin/dashboard", path: "/admin/dashboard" },
    { name: "Products", icon: Package, active: location.pathname.startsWith("/admin/products"), path: "/admin/products" },
    { name: "Categories", icon: Tag, active: location.pathname === "/admin/categories", path: "/admin/categories" },
    { name: "Orders", icon: ShoppingBag, active: location.pathname === "/admin/orders", path: "/admin/orders" },
    { name: "Payments", icon: CreditCard, active: location.pathname === "/admin/payments", path: "/admin/payments" },
    { name: "Shipping", icon: Truck, active: location.pathname === "/admin/shipping", path: "/admin/shipping" },
    { name: "Reports", icon: BarChart3, active: location.pathname === "/admin/reports", path: "/admin/reports" },
  ];

  useEffect(() => {
    fetchShippingPageData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, courierFilter]);

  const fetchShippingPageData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const [shippingData, orderData] = await Promise.all([
        getAdminShippingsApi(),
        getAdminOrdersApi(),
      ]);

      setShippings(normalizeListResponse(shippingData));
      setOrders(normalizeListResponse(orderData));
    } catch (err) {
      console.log("ERROR FETCH SHIPPING:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Gagal mengambil data shipping. Pastikan gateway, order-service, dan shipping-service berjalan.";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const refreshSilently = async () => {
    try {
      const [shippingData, orderData] = await Promise.all([
        getAdminShippingsApi(),
        getAdminOrdersApi(),
      ]);

      setShippings(normalizeListResponse(shippingData));
      setOrders(normalizeListResponse(orderData));
    } catch (err) {
      console.log("ERROR REFRESH SHIPPING:", err);
    }
  };

  const handleLogout = () => {
    openConfirm({
      title: "Logout Admin?",
      message: "Sesi admin akan ditutup dan kamu akan kembali ke halaman login.",
      confirmText: "Logout",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: () => {
        logout();
        navigate("/login");
      },
    });
  };

  const getShippingId = (shipping) => shipping?.id ?? shipping?.shippingId ?? shipping?.shipping_id ?? null;
  const getShippingNumber = (shipping) => shipping.shippingNumber || shipping.shippingCode || shipping.shipmentNumber || shipping.code || `SHP-${shipping.id || "-"}`;
  const getShippingStatus = (shipping) => String(shipping.status || shipping.shippingStatus || "SHIPPED").toUpperCase();
  const getCourier = (shipping) => shipping.courier || shipping.courierName || shipping.shippingCourier || shipping.expedition || "-";
  const getTrackingNumber = (shipping) => shipping.trackingNumber || shipping.receiptNumber || shipping.resiNumber || shipping.awbNumber || shipping.noResi || "-";
  const getEstimatedDays = (shipping) => shipping.estimatedDays || shipping.estimatedDeliveryDays || shipping.deliveryDays || shipping.durationDays || "-";
  const getOrderIdFromShipping = (shipping) => shipping.orderId || shipping.order?.id || shipping.order_id || null;
  const getOrderNumberFromShipping = (shipping) => shipping.orderNumber || shipping.order?.orderNumber || shipping.orderCode || shipping.order?.orderCode || "-";
  const getCustomerName = (shipping) => shipping.customerName || shipping.recipientName || shipping.order?.recipientName || shipping.userName || shipping.order?.userName || "Customer";
  const getCustomerEmail = (shipping) => shipping.email || shipping.customerEmail || shipping.order?.email || shipping.userEmail || "-";
  const getCreatedAt = (shipping) => shipping.createdAt || shipping.shippingDate || shipping.created_at || null;

  const paidOrdersWithoutShipping = useMemo(() => {
    const shippingOrderIds = new Set(
      shippings
        .map((shipping) => String(getOrderIdFromShipping(shipping) || ""))
        .filter(Boolean),
    );

    return orders.filter((order) => {
      const orderId = order.id || order.orderId;
      const status = String(order.status || order.orderStatus || "").toUpperCase();
      return orderId && status === "PAID" && !shippingOrderIds.has(String(orderId));
    });
  }, [orders, shippings]);

  const normalizedShippings = useMemo(() => {
    return shippings.map((shipping) => ({
      ...shipping,
      _id: getShippingId(shipping),
      _shippingNumber: getShippingNumber(shipping),
      _status: getShippingStatus(shipping),
      _courier: getCourier(shipping),
      _trackingNumber: getTrackingNumber(shipping),
      _estimatedDays: getEstimatedDays(shipping),
      _orderId: getOrderIdFromShipping(shipping),
      _orderNumber: getOrderNumberFromShipping(shipping),
      _customerName: getCustomerName(shipping),
      _customerEmail: getCustomerEmail(shipping),
      _createdAt: getCreatedAt(shipping),
    }));
  }, [shippings]);

  const filteredShippings = useMemo(() => {
    return normalizedShippings.filter((shipping) => {
      const text = `${shipping._shippingNumber} ${shipping._orderNumber} ${shipping._customerName} ${shipping._customerEmail} ${shipping._courier} ${shipping._trackingNumber}`.toLowerCase();
      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus = statusFilter === "ALL" || shipping._status === statusFilter;
      const matchCourier = courierFilter === "ALL" || String(shipping._courier).toUpperCase() === courierFilter;
      return matchKeyword && matchStatus && matchCourier;
    });
  }, [normalizedShippings, keyword, statusFilter, courierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredShippings.length / itemsPerPage));
  const paginatedShippings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShippings.slice(start, start + itemsPerPage);
  }, [filteredShippings, currentPage]);

  const totalShipping = normalizedShippings.length;
  const readyToShip = paidOrdersWithoutShipping.length;
  const shippedShipping = normalizedShippings.filter((shipping) => shipping._status === "SHIPPED").length;
  const deliveredShipping = normalizedShippings.filter((shipping) => ["DELIVERED", "RECEIVED", "COMPLETED"].includes(shipping._status)).length;

  const openCreateModal = () => {
    setFormData({
      orderId: paidOrdersWithoutShipping[0]?.id || paidOrdersWithoutShipping[0]?.orderId || "",
      courier: "JNE",
      trackingNumber: "",
      estimatedDays: 2,
    });
    setFormModalOpen(true);
  };

  const closeCreateModal = () => {
    setFormModalOpen(false);
    setFormData({ orderId: "", courier: "JNE", trackingNumber: "", estimatedDays: 2 });
  };

  const handleCreateShipping = async (e) => {
    e.preventDefault();

    if (!formData.orderId) {
      const message = "Pilih order yang sudah PAID terlebih dahulu.";
      setError(message);
      showToast({ type: "warning", message });
      return;
    }

    if (!formData.courier || !formData.trackingNumber) {
      const message = "Courier dan nomor resi wajib diisi.";
      setError(message);
      showToast({ type: "warning", message });
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        orderId: Number(formData.orderId),
        courier: formData.courier,
        courierName: formData.courier,
        trackingNumber: formData.trackingNumber,
        resiNumber: formData.trackingNumber,
        receiptNumber: formData.trackingNumber,
        estimatedDays: Number(formData.estimatedDays || 1),
        estimatedDeliveryDays: Number(formData.estimatedDays || 1),
      };

      await createShippingApi(payload);
      await refreshSilently();

      const message = "Shipping berhasil dibuat. Status shipping dan order otomatis menjadi SHIPPED.";
      setSuccessMessage(message);
      showToast({ type: "success", message });
      closeCreateModal();
    } catch (err) {
      console.log("ERROR CREATE SHIPPING:", err);
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Gagal membuat shipping.";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setCourierFilter("ALL");
  };

  const goPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="inline-flex select-none">
          <BrandLogo to="/admin/dashboard" />
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 lg:hidden"
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
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-black transition duration-200 ${
                menu.active
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-400"
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      {formModalOpen && (
        <CreateShippingModal
          formData={formData}
          setFormData={setFormData}
          paidOrders={paidOrdersWithoutShipping}
          saving={saving}
          onClose={closeCreateModal}
          onSubmit={handleCreateShipping}
        />
      )}

      {detailModalOpen && selectedShipping && (
        <ShippingDetailModal
          shipping={selectedShipping}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedShipping(null);
          }}
        />
      )}

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 bg-white transition duration-300 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      <main className="lg:ml-72">
        <div className="p-3 sm:p-6 lg:p-8">
          <AdminTopbar
            title="Shipping"
            subtitle="Dashboard / Shipping"
            adminName={adminName}
            adminProfileImage={adminProfileImage}
            isDarkMode={isDarkMode}
            onMenu={() => setSidebarOpen(true)}
            onTheme={toggleTheme}
          />

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">Shipping Flow</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Pengiriman Otomatis</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  Alur sekarang dibuat simpel: admin cukup input kurir dan nomor resi. Setelah shipping dibuat, backend otomatis mengubah shipping dan order menjadi <span className="font-black text-slate-700 dark:text-slate-200">SHIPPED</span>.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={fetchShippingPageData}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={paidOrdersWithoutShipping.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={18} />
                  Create Shipping
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-2xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {successMessage}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            <StatCard title="Ready to Ship" value={readyToShip} subtitle="Order PAID tanpa shipping" icon={Clock3} color="orange" loading={loading} />
            <StatCard title="Total Shipping" value={totalShipping} subtitle="Semua data shipping" icon={Truck} color="blue" loading={loading} />
            <StatCard title="Shipped" value={shippedShipping} subtitle="Otomatis setelah create" icon={Truck} color="purple" loading={loading} />
            <StatCard title="Completed" value={deliveredShipping} subtitle="Diterima / selesai" icon={CheckCircle2} color="green" loading={loading} />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.5fr]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search shipping, order, customer, resi..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {SHIPPING_FILTERS.map((status) => (
                  <option key={status} value={status}>{status === "ALL" ? "All Status" : status}</option>
                ))}
              </select>

              <select value={courierFilter} onChange={(e) => setCourierFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="ALL">All Courier</option>
                {COURIER_OPTIONS.map((courier) => (
                  <option key={courier} value={courier.toUpperCase()}>{courier}</option>
                ))}
              </select>

              <button type="button" onClick={resetFilters} className="h-12 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 active:scale-[0.98]">
                Reset
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Shipping</th>
                    <th className="px-5 py-4">Order / Customer</th>
                    <th className="px-5 py-4">Courier</th>
                    <th className="px-5 py-4">Tracking</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">ETA</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td colSpan="8" className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Memuat data shipping...</td>
                    </tr>
                  )}

                  {!loading && paginatedShippings.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Shipping tidak ditemukan.</td>
                    </tr>
                  )}

                  {!loading && paginatedShippings.map((shipping) => (
                    <tr key={shipping._id || shipping._shippingNumber} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950 dark:text-white">#{shipping._shippingNumber}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ID: {shipping._id || "-"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950 dark:text-white">#{shipping._orderNumber}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{shipping._customerName}</p>
                        <p className="text-xs font-semibold text-slate-400">{shipping._customerEmail}</p>
                      </td>
                      <td className="px-5 py-4"><p className="text-sm font-black text-slate-950 dark:text-white">{shipping._courier}</p></td>
                      <td className="px-5 py-4"><p className="text-sm font-black text-slate-950 dark:text-white">{shipping._trackingNumber}</p></td>
                      <td className="px-5 py-4"><StatusBadge value={shipping._status} /></td>
                      <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">{shipping._estimatedDays} hari</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                          <CalendarDays size={16} className="mt-0.5 text-slate-400" />
                          <span>{formatDate(shipping._createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShipping(shipping);
                              setDetailModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Eye size={16} />
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={goPrevPage} onNext={goNextPage} />
        </div>
      </main>
    </div>
  );
}

function AdminTopbar({ title, subtitle, adminName, adminProfileImage, isDarkMode, onMenu, onTheme }) {
  return (
    <div className="sticky top-3 z-30 rounded-[2rem] border border-slate-200 bg-white/85 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden"><Menu size={20} /></button>
          <div>
            <h1 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">{title}</h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={onTheme} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-yellow-300">{isDarkMode ? <Sun size={19} /> : <Moon size={19} />}</button>
          <Link to="/admin/profile" className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 sm:flex">
            {adminProfileImage ? <img src={adminProfileImage} alt={adminName} className="h-9 w-9 rounded-full border border-slate-200 object-cover dark:border-slate-700" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/50"><Users size={18} /></div>}
            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">{adminName}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Administrator</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CreateShippingModal({ formData, setFormData, paidOrders, saving, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-2xl rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">Create Shipping</p>
            <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">Input Kurir dan Resi</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Setelah submit, order otomatis menjadi SHIPPED.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200"><X size={20} /></button>
        </div>

        {paidOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-yellow-100 p-4 text-sm font-bold leading-6 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">Belum ada order PAID yang siap dibuatkan shipping.</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Order PAID</label>
              <select value={formData.orderId} onChange={(e) => setFormData((prev) => ({ ...prev, orderId: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {paidOrders.map((order) => {
                  const id = order.id || order.orderId;
                  const number = order.orderNumber || order.orderCode || `ORDER-${id}`;
                  return <option key={id} value={id}>{number} - {order.recipientName || order.email || "Customer"}</option>;
                })}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Courier</label>
                <select value={formData.courier} onChange={(e) => setFormData((prev) => ({ ...prev, courier: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  {COURIER_OPTIONS.map((courier) => <option key={courier} value={courier}>{courier}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Estimasi Hari</label>
                <input type="number" min="1" value={formData.estimatedDays} onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDays: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Nomor Resi</label>
              <input type="text" value={formData.trackingNumber} onChange={(e) => setFormData((prev) => ({ ...prev, trackingNumber: e.target.value }))} placeholder="Contoh: JNE123456789" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-red-400 hover:text-red-600 dark:border-slate-700 dark:text-slate-200">Batal</button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                <Truck size={18} />
                {saving ? "Menyimpan..." : "Buat & Kirim"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ShippingDetailModal({ shipping, onClose }) {
  const items = [
    ["Shipping Number", shipping._shippingNumber],
    ["Order", shipping._orderNumber],
    ["Customer", shipping._customerName],
    ["Email", shipping._customerEmail],
    ["Courier", shipping._courier],
    ["Tracking", shipping._trackingNumber],
    ["Status", shipping._status],
    ["ETA", `${shipping._estimatedDays} hari`],
    ["Created", formatDate(shipping._createdAt)],
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-2xl rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">Shipping Detail</p>
            <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">#{shipping._shippingNumber}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200"><X size={20} /></button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">{value || "-"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorClass = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    green: "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300",
  }[color] || "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{loading ? "..." : value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}><Icon size={24} /></div>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "-").toUpperCase();
  const className = status === "SHIPPED"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
    : ["DELIVERED", "RECEIVED", "COMPLETED"].includes(status)
      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
      : status === "CANCELLED"
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function Pagination({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onPrev} disabled={currentPage === 1} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Prev</button>
        <button type="button" onClick={onNext} disabled={currentPage === totalPages} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

function normalizeListResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.shippings)) return response.shippings;
  return [];
}

function getSavedAdminProfile() {
  try {
    return JSON.parse(localStorage.getItem("adminProfile") || "null");
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default AdminShipping;
