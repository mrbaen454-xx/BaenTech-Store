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
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi } from "../../api/orderApi";
import {
  createShippingApi,
  getAdminShippingsApi,
  updateShippingStatusApi,
} from "../../api/shippingApi";

const SHIPPING_STATUS_OPTIONS = [
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "RECEIVED",
  "CANCELLED",
];

const COURIER_OPTIONS = ["JNE", "J&T", "SiCepat", "Anteraja", "POS Indonesia"];

function AdminShipping() {
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

  const [shippings, setShippings] = useState([]);
  const [orders, setOrders] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courierFilter, setCourierFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingShippingId, setUpdatingShippingId] = useState(null);

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
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengambil data shipping. Pastikan shipping-service sudah berjalan.",
      );
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
    logout();
    navigate("/login");
  };

  const getShippingId = (shipping) => {
    return (
      shipping?.id ?? shipping?.shippingId ?? shipping?.shipping_id ?? null
    );
  };

  const getShippingNumber = (shipping) => {
    return (
      shipping.shippingNumber ||
      shipping.shippingCode ||
      shipping.shipmentNumber ||
      shipping.code ||
      `SHP-${shipping.id || "-"}`
    );
  };

  const getShippingStatus = (shipping) => {
    return String(
      shipping.status || shipping.shippingStatus || "PENDING",
    ).toUpperCase();
  };

  const getCourier = (shipping) => {
    return (
      shipping.courier ||
      shipping.courierName ||
      shipping.shippingCourier ||
      shipping.expedition ||
      "-"
    );
  };

  const getTrackingNumber = (shipping) => {
    return (
      shipping.trackingNumber ||
      shipping.receiptNumber ||
      shipping.resiNumber ||
      shipping.awbNumber ||
      shipping.noResi ||
      "-"
    );
  };

  const getEstimatedDays = (shipping) => {
    return (
      shipping.estimatedDays ||
      shipping.estimatedDeliveryDays ||
      shipping.deliveryDays ||
      shipping.durationDays ||
      "-"
    );
  };

  const getOrderIdFromShipping = (shipping) => {
    return shipping.orderId || shipping.order?.id || shipping.order_id || null;
  };

  const getOrderNumberFromShipping = (shipping) => {
    return (
      shipping.orderNumber ||
      shipping.order?.orderNumber ||
      shipping.orderCode ||
      shipping.order?.orderCode ||
      "-"
    );
  };

  const getCustomerName = (shipping) => {
    return (
      shipping.customerName ||
      shipping.recipientName ||
      shipping.order?.recipientName ||
      shipping.userName ||
      shipping.order?.userName ||
      "Customer"
    );
  };

  const getCustomerEmail = (shipping) => {
    return (
      shipping.email ||
      shipping.customerEmail ||
      shipping.order?.email ||
      shipping.userEmail ||
      "-"
    );
  };

  const getCreatedAt = (shipping) => {
    return (
      shipping.createdAt || shipping.shippingDate || shipping.created_at || null
    );
  };

  const paidOrdersWithoutShipping = useMemo(() => {
    const shippingOrderIds = new Set(
      shippings
        .map((shipping) => String(getOrderIdFromShipping(shipping) || ""))
        .filter(Boolean),
    );

    return orders.filter((order) => {
      const orderId = order.id || order.orderId;
      const status = String(
        order.status || order.orderStatus || "",
      ).toUpperCase();

      return (
        orderId && status === "PAID" && !shippingOrderIds.has(String(orderId))
      );
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
      const text =
        `${shipping._shippingNumber} ${shipping._orderNumber} ${shipping._customerName} ${shipping._customerEmail} ${shipping._courier} ${shipping._trackingNumber}`.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || shipping._status === statusFilter;

      const matchCourier =
        courierFilter === "ALL" ||
        String(shipping._courier).toUpperCase() === courierFilter;

      return matchKeyword && matchStatus && matchCourier;
    });
  }, [normalizedShippings, keyword, statusFilter, courierFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredShippings.length / itemsPerPage),
  );

  const paginatedShippings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShippings.slice(start, start + itemsPerPage);
  }, [filteredShippings, currentPage]);

  const totalShipping = normalizedShippings.length;

  const pendingShipping = normalizedShippings.filter(
    (shipping) => shipping._status === "PENDING",
  ).length;

  const shippedShipping = normalizedShippings.filter(
    (shipping) => shipping._status === "SHIPPED",
  ).length;

  const deliveredShipping = normalizedShippings.filter(
    (shipping) => shipping._status === "DELIVERED",
  ).length;

  const receivedShipping = normalizedShippings.filter(
    (shipping) => shipping._status === "RECEIVED",
  ).length;

  const openCreateModal = () => {
    setFormData({
      orderId: paidOrdersWithoutShipping[0]?.id || "",
      courier: "JNE",
      trackingNumber: "",
      estimatedDays: 2,
    });

    setFormModalOpen(true);
  };

  const closeCreateModal = () => {
    setFormModalOpen(false);
    setFormData({
      orderId: "",
      courier: "JNE",
      trackingNumber: "",
      estimatedDays: 2,
    });
  };

  const handleCreateShipping = async (e) => {
    e.preventDefault();

    if (!formData.orderId) {
      setError("Pilih order yang sudah PAID terlebih dahulu.");
      return;
    }

    if (!formData.courier || !formData.trackingNumber) {
      setError("Courier dan nomor resi wajib diisi.");
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

      setSuccessMessage("Shipping berhasil dibuat.");
      closeCreateModal();
    } catch (err) {
      console.log("ERROR CREATE SHIPPING:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal membuat shipping.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateShippingStatus = async (shipping, newStatus) => {
    const shippingId = shipping._id || getShippingId(shipping);

    if (!shippingId) {
      setError("ID shipping tidak ditemukan.");
      return;
    }

    try {
      setUpdatingShippingId(shippingId);
      setError("");
      setSuccessMessage("");

      await updateShippingStatusApi(shippingId, newStatus);
      await refreshSilently();

      setSuccessMessage(
        `Status shipping berhasil diubah menjadi ${newStatus}.`,
      );
    } catch (err) {
      console.log("ERROR UPDATE SHIPPING STATUS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengubah status shipping.",
      );
    } finally {
      setUpdatingShippingId(null);
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setCourierFilter("ALL");
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
                    Shipping
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Shipping
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
                Shipping Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Kelola pengiriman order yang sudah PAID: input kurir, nomor
                resi, estimasi sampai, dan update status.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={fetchShippingPageData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Shipping
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
            <StatCard
              title="Total Shipping"
              value={totalShipping}
              subtitle="Semua pengiriman"
              icon={Truck}
              color="blue"
              loading={loading}
            />

            <StatCard
              title="Pending"
              value={pendingShipping}
              subtitle="Menunggu dikirim"
              icon={Clock3}
              color="orange"
              loading={loading}
            />

            <StatCard
              title="Shipped"
              value={shippedShipping}
              subtitle="Dalam pengiriman"
              icon={Truck}
              color="purple"
              loading={loading}
            />

            <StatCard
              title="Delivered"
              value={deliveredShipping}
              subtitle="Sudah sampai"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Received"
              value={receivedShipping}
              subtitle="Diterima user"
              icon={CheckCircle2}
              color="blue"
              loading={loading}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.5fr]">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search shipping, order, customer, resi..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Status</option>
                {SHIPPING_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={courierFilter}
                onChange={(e) => setCourierFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Courier</option>
                {COURIER_OPTIONS.map((courier) => (
                  <option key={courier} value={courier.toUpperCase()}>
                    {courier}
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
              <table className="w-full min-w-[1180px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Shipping</th>
                    <th className="px-5 py-4">Order / Customer</th>
                    <th className="px-5 py-4">Courier</th>
                    <th className="px-5 py-4">Tracking</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Update Status</th>
                    <th className="px-5 py-4">ETA</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Memuat data shipping...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedShippings.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Shipping tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedShippings.map((shipping) => {
                      const canUpdateStatus = ![
                        "RECEIVED",
                        "CANCELLED",
                      ].includes(shipping._status);

                      return (
                        <tr
                          key={shipping._id || shipping._shippingNumber}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950 dark:text-white">
                              #{shipping._shippingNumber}
                            </p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              ID: {shipping._id || "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950 dark:text-white">
                              #{shipping._orderNumber}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {shipping._customerName}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              {shipping._customerEmail}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {shipping._courier}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {shipping._trackingNumber}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge value={shipping._status} />
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={shipping._status}
                              disabled={
                                !canUpdateStatus ||
                                updatingShippingId === shipping._id
                              }
                              onChange={(e) =>
                                handleUpdateShippingStatus(
                                  shipping,
                                  e.target.value,
                                )
                              }
                              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              {SHIPPING_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>

                            {updatingShippingId === shipping._id && (
                              <p className="mt-1 text-xs font-bold text-blue-500">
                                Updating...
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                              {shipping._estimatedDays} hari
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                              <CalendarDays
                                size={16}
                                className="mt-0.5 text-slate-400"
                              />
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
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {paginatedShippings.length} of{" "}
                {filteredShippings.length} shipping
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

function CreateShippingModal({
  formData,
  setFormData,
  paidOrders,
  saving,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Create Shipping
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Buat pengiriman untuk order yang sudah PAID.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Order PAID
            </label>

            <select
              value={formData.orderId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  orderId: e.target.value,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Pilih order</option>
              {paidOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.orderNumber || order.id} -{" "}
                  {order.recipientName || order.email || "Customer"}
                </option>
              ))}
            </select>

            {paidOrders.length === 0 && (
              <p className="mt-2 text-xs font-bold text-orange-500">
                Belum ada order PAID yang siap dibuat shipping.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Courier
              </label>

              <select
                value={formData.courier}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    courier: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {COURIER_OPTIONS.map((courier) => (
                  <option key={courier} value={courier}>
                    {courier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Estimated Days
              </label>

              <input
                type="number"
                min="1"
                value={formData.estimatedDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedDays: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Tracking Number / Nomor Resi
            </label>

            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  trackingNumber: e.target.value,
                }))
              }
              placeholder="Contoh: JNE-889112"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Shipping"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShippingDetailModal({ shipping, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Detail Shipping #{shipping._shippingNumber}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Informasi detail pengiriman order.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DetailItem
            label="Shipping Number"
            value={shipping._shippingNumber}
          />
          <DetailItem label="Order Number" value={shipping._orderNumber} />
          <DetailItem label="Customer" value={shipping._customerName} />
          <DetailItem label="Email" value={shipping._customerEmail} />
          <DetailItem label="Courier" value={shipping._courier} />
          <DetailItem
            label="Tracking Number"
            value={shipping._trackingNumber}
          />
          <DetailItem
            label="Estimated Days"
            value={`${shipping._estimatedDays} hari`}
          />
          <DetailItem
            label="Created At"
            value={formatDate(shipping._createdAt)}
          />

          <div>
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Status
            </p>
            <div className="mt-2">
              <StatusBadge value={shipping._status} />
            </div>
          </div>
        </div>
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

function StatusBadge({ value }) {
  const status = String(value || "-").toUpperCase();

  const isGreen = ["DELIVERED", "RECEIVED"].includes(status);
  const isRed = ["CANCELLED", "CANCELED", "FAILED"].includes(status);
  const isPurple = ["SHIPPED"].includes(status);
  const isOrange = ["PENDING"].includes(status);

  const className = isGreen
    ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
    : isRed
      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
      : isPurple
        ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
        : isOrange
          ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
          : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
      <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.shippings)) return data.shippings;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function getSavedAdminProfile() {
  try {
    return JSON.parse(localStorage.getItem("adminProfile") || "{}");
  } catch {
    return {};
  }
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

export default AdminShipping;
