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
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getAdminOrdersApi,
  getAdminOrderByIdApi,
  updateAdminOrderStatusApi,
} from "../../api/orderApi";
import {
  getAdminPaymentsApi,
  paymentSuccessApi,
  paymentFailedApi,
} from "../../api/paymentApi";

const ORDER_STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const PAYMENT_STATUS_OPTIONS = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
];

function AdminOrders() {
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

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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
    fetchOrdersAndPayments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, paymentFilter]);

  const fetchOrdersAndPayments = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const [ordersData, paymentsData] = await Promise.all([
        getAdminOrdersApi(),
        getAdminPaymentsApi(),
      ]);

      setOrders(normalizeListResponse(ordersData));
      setPayments(normalizeListResponse(paymentsData));
    } catch (err) {
      console.log("ERROR FETCH ORDERS/PAYMENTS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengambil data orders atau payments. Pastikan order-service dan payment-service sudah berjalan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshSilently = async () => {
    try {
      const [ordersData, paymentsData] = await Promise.all([
        getAdminOrdersApi(),
        getAdminPaymentsApi(),
      ]);

      setOrders(normalizeListResponse(ordersData));
      setPayments(normalizeListResponse(paymentsData));
    } catch (err) {
      console.log("ERROR REFRESH:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPaymentForOrder = (order) => {
    return payments.find((payment) => {
      const sameOrderId =
        payment.orderId &&
        order.id &&
        String(payment.orderId) === String(order.id);

      const sameOrderNumber =
        payment.orderNumber &&
        order.orderNumber &&
        String(payment.orderNumber) === String(order.orderNumber);

      return sameOrderId || sameOrderNumber;
    });
  };

  const getBackendOrderId = (order) => {
    return order?.id ?? order?.orderId ?? order?.order_id ?? null;
  };

  const getOrderId = (order) => {
    return (
      order.orderNumber ||
      order.orderCode ||
      order.invoiceNumber ||
      order.id ||
      "-"
    );
  };

  const getOrderDate = (order) => {
    return (
      order.createdAt ||
      order.orderDate ||
      order.created_at ||
      order.updatedAt ||
      null
    );
  };

  const getCustomerName = (order) => {
    return (
      order.recipientName ||
      order.customerName ||
      order.fullName ||
      order.name ||
      order.userName ||
      order.customer?.name ||
      order.user?.fullName ||
      order.user?.name ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order.email ||
      order.customerEmail ||
      order.userEmail ||
      order.customer?.email ||
      order.user?.email ||
      "-"
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order.phoneNumber ||
      order.customerPhone ||
      order.phone ||
      order.noHp ||
      "-"
    );
  };

  const getTotalAmount = (order) => {
    return Number(
      order.totalPrice ||
        order.totalAmount ||
        order.total ||
        order.grandTotal ||
        order.amount ||
        order.finalAmount ||
        0,
    );
  };

  const getOrderStatus = (order) => {
    return String(
      order.status || order.orderStatus || "PENDING_PAYMENT",
    ).toUpperCase();
  };

  const getOrderItems = (order) => {
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order.orderItems)) return order.orderItems;
    if (Array.isArray(order.details)) return order.details;
    if (Array.isArray(order.products)) return order.products;

    return [];
  };

  const getItemsCount = (order) => {
    const items = getOrderItems(order);

    if (items.length > 0) {
      return items.reduce(
        (sum, item) => sum + Number(item.quantity || item.qty || 1),
        0,
      );
    }

    return Number(order.totalItems || order.itemCount || order.quantity || 0);
  };

  const getAllowedOrderStatuses = (currentStatus) => {
    const status = String(currentStatus || "").toUpperCase();

    if (status === "PENDING_PAYMENT") {
      return ["PENDING_PAYMENT", "CANCELLED"];
    }

    if (status === "PAID") {
      return ["PAID", "PROCESSING", "CANCELLED"];
    }

    if (status === "PROCESSING") {
      return ["PROCESSING", "SHIPPED", "CANCELLED"];
    }

    if (status === "SHIPPED") {
      return ["SHIPPED", "COMPLETED"];
    }

    if (status === "COMPLETED") {
      return ["COMPLETED"];
    }

    if (status === "CANCELLED") {
      return ["CANCELLED"];
    }

    return ORDER_STATUS_OPTIONS;
  };

  const patchOrderStatus = (order, newStatus, apiData) => {
    const returnedOrder =
      apiData?.data && typeof apiData.data === "object"
        ? apiData.data
        : apiData?.order && typeof apiData.order === "object"
          ? apiData.order
          : apiData && typeof apiData === "object"
            ? apiData
            : {};

    return {
      ...order,
      ...returnedOrder,
      status: returnedOrder.status || returnedOrder.orderStatus || newStatus,
      orderStatus:
        returnedOrder.orderStatus || returnedOrder.status || newStatus,
    };
  };

  const handleUpdateOrderStatus = async (order, newStatus) => {
    const backendOrderId = order._backendOrderId || getBackendOrderId(order);

    if (!backendOrderId) {
      const message = "ID order tidak ditemukan, status tidak bisa diubah.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    const currentStatus = String(order._orderStatus || "").toUpperCase();

    if (currentStatus === "PENDING_PAYMENT" && newStatus === "PAID") {
      const message =
        "Untuk membuat order menjadi PAID, gunakan tombol Payment Success. Alurnya: payment sukses dulu, lalu order menjadi PAID.";
      setError(message);
      showToast({ type: "warning", message });
      return;
    }

    openConfirm({
      title: "Ubah Status Order?",
      message: `Status order ${order.orderNumber || backendOrderId} akan diubah dari ${currentStatus || "-"} menjadi ${newStatus}.`,
      confirmText: "Ubah Status",
      cancelText: "Batal",
      variant: ["CANCELLED", "FAILED"].includes(newStatus) ? "danger" : "info",
      onConfirm: async () => {
        try {
          setUpdatingOrderId(backendOrderId);
          setError("");
          setSuccessMessage("");

          const data = await updateAdminOrderStatusApi(
            backendOrderId,
            newStatus,
          );

          setOrders((prevOrders) =>
            prevOrders.map((item) => {
              const itemId = getBackendOrderId(item);

              if (String(itemId) === String(backendOrderId)) {
                return patchOrderStatus(item, newStatus, data);
              }

              return item;
            }),
          );

          setSelectedOrder((prevOrder) => {
            if (!prevOrder) return prevOrder;

            const selectedId = getBackendOrderId(prevOrder);

            if (String(selectedId) === String(backendOrderId)) {
              return patchOrderStatus(prevOrder, newStatus, data);
            }

            return prevOrder;
          });

          const message = `Status order berhasil diubah menjadi ${newStatus}.`;
          setSuccessMessage(message);
          showToast({ type: "success", message });
        } catch (err) {
          console.log("ERROR UPDATE ORDER STATUS:", err);
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Gagal mengubah status order.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setUpdatingOrderId(null);
        }
      },
    });
  };

  const handlePaymentSuccess = async (payment) => {
    if (!payment?.id) {
      const message = "ID payment tidak ditemukan.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    openConfirm({
      title: "Payment Success?",
      message:
        "Payment akan dikonfirmasi SUCCESS dan order mengikuti alur backend menjadi PAID.",
      confirmText: "Konfirmasi SUCCESS",
      cancelText: "Batal",
      variant: "success",
      onConfirm: async () => {
        try {
          setUpdatingPaymentId(payment.id);
          setError("");
          setSuccessMessage("");

          await paymentSuccessApi(payment.id);
          await refreshSilently();

          const message =
            "Payment berhasil dikonfirmasi SUCCESS. Order akan berubah menjadi PAID sesuai alur backend.";
          setSuccessMessage(message);
          showToast({ type: "success", message });
        } catch (err) {
          console.log("ERROR PAYMENT SUCCESS:", err);
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Gagal mengonfirmasi payment success.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setUpdatingPaymentId(null);
        }
      },
    });
  };

  const handlePaymentFailed = async (payment) => {
    if (!payment?.id) {
      const message = "ID payment tidak ditemukan.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    openConfirm({
      title: "Payment Failed?",
      message: "Payment akan ditandai FAILED secara manual.",
      confirmText: "Mark Failed",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: async () => {
        try {
          setUpdatingPaymentId(payment.id);
          setError("");
          setSuccessMessage("");

          await paymentFailedApi(payment.id);
          await refreshSilently();

          const message = "Payment berhasil diubah menjadi FAILED.";
          setSuccessMessage(message);
          showToast({ type: "success", message });
        } catch (err) {
          console.log("ERROR PAYMENT FAILED:", err);
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Gagal mengubah payment menjadi failed.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setUpdatingPaymentId(null);
        }
      },
    });
  };

  const normalizedOrders = useMemo(() => {
    return orders.map((order) => {
      const payment = getPaymentForOrder(order);

      return {
        ...order,
        _payment: payment || null,
        _backendOrderId: getBackendOrderId(order),
        _orderId: getOrderId(order),
        _customerName: getCustomerName(order),
        _customerEmail: getCustomerEmail(order),
        _customerPhone: getCustomerPhone(order),
        _totalAmount: getTotalAmount(order),
        _paymentStatus: payment?.status
          ? String(payment.status).toUpperCase()
          : "NO_PAYMENT",
        _paymentMethod: payment?.paymentMethod || "-",
        _paymentNumber: payment?.paymentNumber || "-",
        _orderStatus: getOrderStatus(order),
        _orderDate: getOrderDate(order),
        _itemsCount: getItemsCount(order),
      };
    });
  }, [orders, payments]);

  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((order) => {
      const text =
        `${order._orderId} ${order._customerName} ${order._customerEmail} ${order._customerPhone} ${order._paymentNumber}`.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        String(order._orderStatus).toUpperCase() === statusFilter;

      const matchPayment =
        paymentFilter === "ALL" ||
        String(order._paymentStatus).toUpperCase() === paymentFilter;

      return matchKeyword && matchStatus && matchPayment;
    });
  }, [normalizedOrders, keyword, statusFilter, paymentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / itemsPerPage),
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalOrders = normalizedOrders.length;

  const completedOrders = normalizedOrders.filter(
    (order) => order._orderStatus === "COMPLETED",
  ).length;

  const paidOrders = normalizedOrders.filter(
    (order) => order._orderStatus === "PAID",
  ).length;

  const processingOrders = normalizedOrders.filter((order) =>
    ["PROCESSING", "PAID"].includes(order._orderStatus),
  ).length;

  const shippingOrders = normalizedOrders.filter(
    (order) => order._orderStatus === "SHIPPED",
  ).length;

  const cancelledOrders = normalizedOrders.filter(
    (order) => order._orderStatus === "CANCELLED",
  ).length;

  const totalRevenue = normalizedOrders
    .filter((order) => order._paymentStatus === "SUCCESS")
    .reduce((sum, order) => sum + Number(order._totalAmount || 0), 0);

  const openDetailModal = async (order) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(order);
      setDetailModalOpen(true);

      const backendOrderId = order._backendOrderId || getBackendOrderId(order);

      if (backendOrderId) {
        const detail = await getAdminOrderByIdApi(backendOrderId);

        const detailData =
          detail?.data && typeof detail.data === "object"
            ? detail.data
            : detail;

        setSelectedOrder({
          ...order,
          ...detailData,
          _payment: order._payment,
          _paymentStatus: order._paymentStatus,
          _paymentMethod: order._paymentMethod,
          _paymentNumber: order._paymentNumber,
        });
      }
    } catch (err) {
      console.log("ERROR DETAIL ORDER:", err);
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const goPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
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
      {detailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          loading={detailLoading}
          onClose={closeDetailModal}
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
                    Orders
                  </h1>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Dashboard / Orders
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
                Order Management
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Alur backend: checkout → payment pending → payment success →
                order PAID → proses pengiriman.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchOrdersAndPayments}
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
              title="Total Orders"
              value={totalOrders}
              subtitle="Semua pesanan"
              icon={ShoppingBag}
              color="blue"
              loading={loading}
            />

            <StatCard
              title="Paid"
              value={paidOrders}
              subtitle="Sudah dibayar"
              icon={CreditCard}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Processing"
              value={processingOrders}
              subtitle="Siap/proses kirim"
              icon={Clock3}
              color="orange"
              loading={loading}
            />

            <StatCard
              title="Shipping"
              value={shippingOrders}
              subtitle="Sedang dikirim"
              icon={Truck}
              color="purple"
              loading={loading}
            />

            <StatCard
              title="Cancelled"
              value={cancelledOrders}
              subtitle="Dibatalkan"
              icon={XCircle}
              color="red"
              loading={loading}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                <Search size={19} className="text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search order number, customer, email, payment number..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Order Status</option>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Payment</option>
                <option value="NO_PAYMENT">No Payment</option>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Payment Action</th>
                    <th className="px-5 py-4">Order Status</th>
                    <th className="px-5 py-4">Update Order</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Items</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Memuat data orders dan payments...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Order tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedOrders.map((order) => {
                      const payment = order._payment;
                      const allowedStatuses = getAllowedOrderStatuses(
                        order._orderStatus,
                      );
                      const paymentIsPending =
                        order._paymentStatus === "PENDING";
                      const canUpdateOrder =
                        order._backendOrderId &&
                        !["COMPLETED", "CANCELLED"].includes(
                          order._orderStatus,
                        );

                      return (
                        <tr
                          key={order._backendOrderId || order._orderId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950 dark:text-white">
                              #{order._orderId}
                            </p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              ID: {order._backendOrderId || "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                                <Users size={18} />
                              </div>

                              <div>
                                <p className="font-black text-slate-950 dark:text-white">
                                  {order._customerName}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {order._customerEmail}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {formatCurrency(order._totalAmount)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <StatusBadge value={order._paymentStatus} />
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {order._paymentMethod}
                              </p>
                              {payment?.paymentNumber && (
                                <p className="text-xs font-bold text-slate-400">
                                  {payment.paymentNumber}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {paymentIsPending && payment ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  disabled={updatingPaymentId === payment.id}
                                  onClick={() => handlePaymentSuccess(payment)}
                                  className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Success
                                </button>

                                <button
                                  type="button"
                                  disabled={updatingPaymentId === payment.id}
                                  onClick={() => handlePaymentFailed(payment)}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Failed
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {payment ? "No action" : "Belum bayar"}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge value={order._orderStatus} />
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={order._orderStatus}
                              disabled={
                                !canUpdateOrder ||
                                updatingOrderId === order._backendOrderId
                              }
                              onChange={(e) =>
                                handleUpdateOrderStatus(order, e.target.value)
                              }
                              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              {allowedStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>

                            {updatingOrderId === order._backendOrderId && (
                              <p className="mt-1 text-xs font-bold text-blue-500">
                                Updating...
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                              <CalendarDays
                                size={16}
                                className="mt-0.5 text-slate-400"
                              />
                              <span>{formatDate(order._orderDate)}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                              {order._itemsCount} items
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => openDetailModal(order)}
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
                Showing {paginatedOrders.length} of {filteredOrders.length}{" "}
                orders
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

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  Total Success Payment Revenue
                </p>
                <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Total dihitung dari payment dengan status SUCCESS.
              </p>
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

  const isGreen = ["PAID", "SUCCESS", "COMPLETED"].includes(status);
  const isRed = ["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(status);
  const isPurple = ["SHIPPED"].includes(status);
  const isBlue = ["PROCESSING"].includes(status);
  const isGray = ["NO_PAYMENT"].includes(status);

  const className = isGreen
    ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
    : isRed
      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
      : isPurple
        ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
        : isBlue
          ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
          : isGray
            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            : "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function OrderDetailModal({ order, loading, onClose }) {
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.orderItems)
      ? order.orderItems
      : Array.isArray(order.details)
        ? order.details
        : Array.isArray(order.products)
          ? order.products
          : [];

  const payment = order._payment || null;

  const orderId =
    order.orderNumber ||
    order.orderCode ||
    order.invoiceNumber ||
    order.code ||
    order.id ||
    "-";

  const customerName =
    order.recipientName ||
    order.customerName ||
    order.fullName ||
    order.name ||
    order.userName ||
    order.customer?.name ||
    order.user?.fullName ||
    order.user?.name ||
    "Customer";

  const customerEmail =
    order.email ||
    order.customerEmail ||
    order.userEmail ||
    order.customer?.email ||
    order.user?.email ||
    "-";

  const phoneNumber =
    order.phoneNumber ||
    order.customerPhone ||
    order.phone ||
    order.noHp ||
    "-";

  const totalAmount = Number(
    order.totalPrice ||
      order.totalAmount ||
      order.total ||
      order.grandTotal ||
      order.amount ||
      order.finalAmount ||
      0,
  );

  const orderStatus = order.status || order.orderStatus || "PENDING_PAYMENT";
  const paymentStatus = payment?.status || order._paymentStatus || "NO_PAYMENT";
  const paymentMethod = payment?.paymentMethod || order._paymentMethod || "-";
  const paymentNumber = payment?.paymentNumber || order._paymentNumber || "-";

  const address = [
    order.shippingAddress,
    order.city,
    order.province,
    order.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              Detail Order #{orderId}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Informasi detail pesanan pelanggan.
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

        {loading && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Memuat detail order...
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DetailItem label="Customer" value={customerName} />
          <DetailItem label="Email" value={customerEmail} />
          <DetailItem label="Phone" value={phoneNumber} />
          <DetailItem
            label="Total Amount"
            value={formatCurrency(totalAmount)}
          />
          <DetailItem label="Payment Number" value={paymentNumber} />
          <DetailItem label="Payment Method" value={paymentMethod} />
          <DetailItem
            label="Tanggal Order"
            value={formatDate(order.createdAt || order.orderDate)}
          />
          <DetailItem label="Alamat" value={address || "-"} />

          <div>
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Payment
            </p>
            <div className="mt-2">
              <StatusBadge value={paymentStatus} />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Status Order
            </p>
            <div className="mt-2">
              <StatusBadge value={orderStatus} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-black text-slate-950 dark:text-white">
              Items
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && (
              <p className="px-4 py-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                Detail item tidak tersedia dari response backend.
              </p>
            )}

            {items.map((item, index) => {
              const quantity = Number(item.quantity || item.qty || 1);
              const price = Number(
                item.price ||
                  item.productPrice ||
                  item.product?.price ||
                  item.subTotal ||
                  item.subtotal ||
                  item.total ||
                  0,
              );

              return (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {item.productName ||
                        item.name ||
                        item.product?.name ||
                        `Item ${index + 1}`}
                    </p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Qty: {quantity}
                    </p>
                  </div>

                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {formatCurrency(price)}
                  </p>
                </div>
              );
            })}
          </div>
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
      <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.payments)) return data.payments;
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

export default AdminOrders;
