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

import logo from "../../assets/baentech-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi, getAdminOrderByIdApi } from "../../api/orderApi";

function AdminOrders() {
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
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

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
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminOrdersApi();
      setOrders(data);
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data orders. Pastikan order-service sudah berjalan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getOrderId = (order) => {
    return (
      order.orderCode ||
      order.orderNumber ||
      order.invoiceNumber ||
      order.code ||
      `ORD-${order.id}`
    );
  };

  const getOrderDate = (order) => {
    return (
      order.orderDate ||
      order.createdAt ||
      order.created_at ||
      order.date ||
      order.updatedAt ||
      null
    );
  };

  const getCustomerName = (order) => {
    return (
      order.customerName ||
      order.fullName ||
      order.name ||
      order.userName ||
      order.user?.fullName ||
      order.user?.name ||
      "Customer"
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order.customerEmail ||
      order.email ||
      order.userEmail ||
      order.user?.email ||
      "-"
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order.customerPhone ||
      order.phoneNumber ||
      order.phone ||
      order.user?.phoneNumber ||
      "-"
    );
  };

  const getTotalAmount = (order) => {
    return Number(
      order.totalAmount ||
        order.total ||
        order.grandTotal ||
        order.amount ||
        order.finalAmount ||
        0,
    );
  };

  const getPaymentStatus = (order) => {
    return (
      order.paymentStatus ||
      order.payment?.status ||
      order.statusPayment ||
      "PENDING"
    );
  };

  const getPaymentMethod = (order) => {
    return (
      order.paymentMethod ||
      order.payment?.method ||
      order.paymentType ||
      order.payment?.paymentMethod ||
      "-"
    );
  };

  const getOrderStatus = (order) => {
    return order.orderStatus || order.status || "PENDING";
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

  const normalizedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      _orderId: getOrderId(order),
      _customerName: getCustomerName(order),
      _customerEmail: getCustomerEmail(order),
      _customerPhone: getCustomerPhone(order),
      _totalAmount: getTotalAmount(order),
      _paymentStatus: getPaymentStatus(order),
      _paymentMethod: getPaymentMethod(order),
      _orderStatus: getOrderStatus(order),
      _orderDate: getOrderDate(order),
      _itemsCount: getItemsCount(order),
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return normalizedOrders.filter((order) => {
      const text =
        `${order._orderId} ${order._customerName} ${order._customerEmail} ${order._customerPhone}`.toLowerCase();

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

  const completedOrders = normalizedOrders.filter((order) =>
    ["COMPLETED", "DELIVERED", "SUCCESS", "DONE"].includes(
      String(order._orderStatus).toUpperCase(),
    ),
  ).length;

  const processingOrders = normalizedOrders.filter((order) =>
    ["PENDING", "PROCESSING", "WAITING", "CREATED"].includes(
      String(order._orderStatus).toUpperCase(),
    ),
  ).length;

  const shippingOrders = normalizedOrders.filter((order) =>
    ["SHIPPED", "SHIPPING", "ON_DELIVERY"].includes(
      String(order._orderStatus).toUpperCase(),
    ),
  ).length;

  const cancelledOrders = normalizedOrders.filter((order) =>
    ["CANCELLED", "CANCELED", "FAILED"].includes(
      String(order._orderStatus).toUpperCase(),
    ),
  ).length;

  const totalRevenue = normalizedOrders
    .filter((order) =>
      ["PAID", "SUCCESS", "SETTLEMENT", "COMPLETED"].includes(
        String(order._paymentStatus).toUpperCase(),
      ),
    )
    .reduce((sum, order) => sum + Number(order._totalAmount || 0), 0);

  const openDetailModal = async (order) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(order);
      setDetailModalOpen(true);

      if (order.id) {
        const detail = await getAdminOrderByIdApi(order.id);

        setSelectedOrder({
          ...order,
          ...detail,
        });
      }
    } catch (err) {
      console.log(err);
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
                Pantau semua pesanan pelanggan BaenTech Store.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchOrders}
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
              title="Completed"
              value={completedOrders}
              subtitle="Pesanan selesai"
              icon={CheckCircle2}
              color="green"
              loading={loading}
            />

            <StatCard
              title="Processing"
              value={processingOrders}
              subtitle="Sedang diproses"
              icon={Clock3}
              color="orange"
              loading={loading}
            />

            <StatCard
              title="Shipping"
              value={shippingOrders}
              subtitle="Dalam pengiriman"
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
                  placeholder="Search order id, customer, email..."
                  className="w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="SHIPPING">Shipping</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-12 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ALL">All Payment</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Total Amount</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Order Date</th>
                    <th className="px-5 py-4">Items</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Memuat data orders...
                      </td>
                    </tr>
                  )}

                  {!loading && paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-10 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        Order tidak ditemukan.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    paginatedOrders.map((order) => (
                      <tr
                        key={order.id || order._orderId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950 dark:text-white">
                            #{order._orderId}
                          </p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            ID: {order.id || "-"}
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
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {order._paymentMethod}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={order._paymentStatus}
                            type="payment"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={order._orderStatus}
                            type="order"
                          />
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
                    ))}
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
                  Total Paid Revenue
                </p>
                <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Total ini dihitung dari order dengan payment status PAID /
                SUCCESS / SETTLEMENT / COMPLETED.
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

function StatusBadge({ value, type }) {
  const status = String(value || "-").toUpperCase();

  const isGreen = [
    "PAID",
    "SUCCESS",
    "SETTLEMENT",
    "COMPLETED",
    "DELIVERED",
  ].includes(status);

  const isRed = ["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(status);

  const isPurple = ["SHIPPED", "SHIPPING", "ON_DELIVERY"].includes(status);

  const className = isGreen
    ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-300"
    : isRed
      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
      : isPurple
        ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
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
        : [];

  const orderId =
    order.orderCode ||
    order.orderNumber ||
    order.invoiceNumber ||
    order.code ||
    `ORD-${order.id}`;

  const customerName =
    order.customerName ||
    order.fullName ||
    order.name ||
    order.userName ||
    order.user?.fullName ||
    order.user?.name ||
    "Customer";

  const customerEmail =
    order.customerEmail ||
    order.email ||
    order.userEmail ||
    order.user?.email ||
    "-";

  const totalAmount = Number(
    order.totalAmount ||
      order.total ||
      order.grandTotal ||
      order.amount ||
      order.finalAmount ||
      0,
  );

  const orderStatus = order.orderStatus || order.status || "PENDING";
  const paymentStatus =
    order.paymentStatus ||
    order.payment?.status ||
    order.statusPayment ||
    "PENDING";

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
          <DetailItem
            label="Total Amount"
            value={formatCurrency(totalAmount)}
          />
          <DetailItem
            label="Tanggal Order"
            value={formatDate(order.createdAt || order.orderDate)}
          />

          <div>
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Payment
            </p>
            <div className="mt-2">
              <StatusBadge value={paymentStatus} type="payment" />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Status Order
            </p>
            <div className="mt-2">
              <StatusBadge value={orderStatus} type="order" />
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

            {items.map((item, index) => (
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
                    Qty: {item.quantity || item.qty || 1}
                  </p>
                </div>

                <p className="text-sm font-black text-slate-950 dark:text-white">
                  {formatCurrency(
                    Number(item.price || item.subtotal || item.total || 0),
                  )}
                </p>
              </div>
            ))}
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
