import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  PackageCheck,
  PackageX,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import {
  cancelOrderApi,
  completeOrderApi,
  getMyOrdersApi,
} from "../api/orderApi";
import {
  createXenditPaymentApi,
  getPaymentByOrderIdApi,
} from "../api/paymentApi";

const statusFilters = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING_PAYMENT", label: "Menunggu Bayar" },
  { value: "PAID", label: "Sudah Dibayar" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "SHIPPED", label: "Dikirim" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const orderData = await getMyOrdersApi();

      const normalizedOrders = orderData
        .map(normalizeOrder)
        .filter((order) => order.id)
        .sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );

      setOrders(normalizedOrders);

      const paymentResults = await Promise.allSettled(
        normalizedOrders.map((order) => getPaymentByOrderIdApi(order.id)),
      );

      const paymentMap = {};

      paymentResults.forEach((result, index) => {
        const orderId = normalizedOrders[index]?.id;

        if (result.status === "fulfilled" && result.value && orderId) {
          paymentMap[orderId] = normalizePayment(result.value);
        }
      });

      setPaymentsByOrderId(paymentMap);
    } catch (err) {
      console.log("ERROR LOAD MY ORDERS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil data pesanan.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchKeyword =
        !keyword ||
        String(order.orderNumber || "")
          .toLowerCase()
          .includes(keyword) ||
        String(order.recipientName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(order.city || "")
          .toLowerCase()
          .includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      all: orders.length,
      pendingPayment: orders.filter(
        (order) => order.status === "PENDING_PAYMENT",
      ).length,
      paidProcess: orders.filter((order) =>
        ["PAID", "PROCESSING"].includes(order.status),
      ).length,
      shipped: orders.filter((order) => order.status === "SHIPPED").length,
      completed: orders.filter((order) => order.status === "COMPLETED").length,
    };
  }, [orders]);

  const handlePayNow = async (order) => {
    try {
      setActionLoading(`pay-${order.id}`);
      setError("");
      setSuccessMessage("");

      const existingPayment = paymentsByOrderId[order.id];

      if (existingPayment?.redirectUrl) {
        savePendingPayment(order, existingPayment);
        window.location.href = existingPayment.redirectUrl;
        return;
      }

      const payment = await createXenditPaymentApi({
        orderId: order.id,
        paymentMethod: existingPayment?.paymentMethod || "QRIS",
      });

      const normalizedPayment = normalizePayment(payment);
      const redirectUrl = normalizedPayment.redirectUrl;

      if (!redirectUrl) {
        throw new Error("URL pembayaran Xendit tidak ditemukan.");
      }

      savePendingPayment(order, normalizedPayment);

      window.location.href = redirectUrl;
    } catch (err) {
      console.log("ERROR PAY ORDER:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal membuka pembayaran.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Batalkan pesanan ${order.orderNumber}?`,
    );

    if (!confirmCancel) return;

    try {
      setActionLoading(`cancel-${order.id}`);
      setError("");
      setSuccessMessage("");

      await cancelOrderApi(order.id);

      setSuccessMessage("Pesanan berhasil dibatalkan.");
      await loadOrders({ silent: true });
    } catch (err) {
      console.log("ERROR CANCEL ORDER:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal membatalkan pesanan.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleCompleteOrder = async (order) => {
    const confirmComplete = window.confirm(
      `Konfirmasi pesanan ${order.orderNumber} sudah diterima?`,
    );

    if (!confirmComplete) return;

    try {
      setActionLoading(`complete-${order.id}`);
      setError("");
      setSuccessMessage("");

      await completeOrderApi(order.id);

      setSuccessMessage("Pesanan berhasil dikonfirmasi selesai.");
      await loadOrders({ silent: true });
    } catch (err) {
      console.log("ERROR COMPLETE ORDER:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menyelesaikan pesanan.",
      );
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
              My Orders
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Pesanan Saya
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Pantau status pesanan, pembayaran Xendit, dan konfirmasi barang
              ketika sudah diterima.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{successMessage}</span>
          </div>
        )}

        <SummaryCards summary={summary} />

        <div className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_240px]">
          <div className="relative min-w-0">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor order, penerima, atau kota..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <OrderSkeleton />
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders hasOrders={orders.length > 0} />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                payment={paymentsByOrderId[order.id]}
                actionLoading={actionLoading}
                onPayNow={handlePayNow}
                onCancel={handleCancelOrder}
                onComplete={handleCompleteOrder}
                onDetail={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          payment={paymentsByOrderId[selectedOrder.id]}
          onClose={() => setSelectedOrder(null)}
          onPayNow={handlePayNow}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

function SummaryCards({ summary }) {
  const cards = [
    {
      label: "Semua Pesanan",
      value: summary.all,
      icon: ReceiptText,
    },
    {
      label: "Menunggu Bayar",
      value: summary.pendingPayment,
      icon: Clock,
    },
    {
      label: "Dibayar / Diproses",
      value: summary.paidProcess,
      icon: PackageCheck,
    },
    {
      label: "Dikirim",
      value: summary.shipped,
      icon: Truck,
    },
    {
      label: "Selesai",
      value: summary.completed,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                  {card.value}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  payment,
  actionLoading,
  onPayNow,
  onCancel,
  onComplete,
  onDetail,
}) {
  const canPay = order.status === "PENDING_PAYMENT";
  const canCancel = order.status === "PENDING_PAYMENT";
  const canComplete = order.status === "SHIPPED";

  const itemsPreview = order.items.slice(0, 2);
  const hiddenItemsCount = Math.max(
    order.items.length - itemsPreview.length,
    0,
  );

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-black text-slate-950 dark:text-white">
                  {order.orderNumber}
                </h2>

                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={payment?.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatDate(order.createdAt)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {order.city || "-"}, {order.province || "-"}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Total Bayar
              </p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatRupiah(order.totalPrice)}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {itemsPreview.map((item) => (
              <OrderItemMini key={item.id || item.productId} item={item} />
            ))}

            {hiddenItemsCount > 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                +{hiddenItemsCount} produk lainnya
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <div className="space-y-2">
            <SmallInfo label="Payment" value={payment?.paymentNumber || "-"} />
            <SmallInfo label="Gateway" value={payment?.gateway || "-"} />
            <SmallInfo
              label="Channel"
              value={payment?.paymentChannel || payment?.paymentType || "-"}
            />
          </div>

          <div className="mt-4 grid gap-2">
            {canPay && (
              <button
                type="button"
                onClick={() => onPayNow(order)}
                disabled={actionLoading === `pay-${order.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === `pay-${order.id}` ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CreditCard size={17} />
                )}
                Bayar Sekarang
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                onClick={() => onComplete(order)}
                disabled={actionLoading === `complete-${order.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === `complete-${order.id}` ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Pesanan Diterima
              </button>
            )}

            <button
              type="button"
              onClick={() => onDetail(order)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Eye size={17} />
              Detail
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(order)}
                disabled={actionLoading === `cancel-${order.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300"
              >
                {actionLoading === `cancel-${order.id}` ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <XCircle size={17} />
                )}
                Batalkan
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function OrderItemMini({ item }) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        <img
          src={getProductImage(item)}
          alt={item.productName || "Produk"}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="break-words text-sm font-black text-slate-950 dark:text-white">
          {item.productName || "Produk"}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          {item.productBrand || "-"} • Qty {Number(item.quantity || 0)}
        </p>
      </div>

      <p className="text-right text-sm font-black text-slate-700 dark:text-slate-200">
        {formatRupiah(item.subTotal)}
      </p>
    </div>
  );
}

function OrderDetailModal({
  order,
  payment,
  onClose,
  onPayNow,
  actionLoading,
}) {
  const canPay = order.status === "PENDING_PAYMENT";

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Detail Pesanan
            </p>
            <h2 className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white">
              {order.orderNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
              <h3 className="mb-3 text-sm font-black text-slate-950 dark:text-white">
                Produk
              </h3>

              <div className="space-y-3">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <OrderItemMini
                      key={item.id || item.productId}
                      item={item}
                    />
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    Item order tidak tersedia.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
              <h3 className="mb-3 text-sm font-black text-slate-950 dark:text-white">
                Alamat Pengiriman
              </h3>

              <p className="text-sm font-black text-slate-950 dark:text-white">
                {order.recipientName}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                {order.phoneNumber}
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                {order.shippingAddress}
              </p>
              <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
                {order.city}, {order.province} {order.postalCode}
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-3">
              <DetailRow
                label="Status Order"
                value={<OrderStatusBadge status={order.status} />}
              />
              <DetailRow
                label="Status Payment"
                value={<PaymentStatusBadge status={payment?.status} />}
              />
              <DetailRow label="Gateway" value={payment?.gateway || "-"} />
              <DetailRow
                label="Payment Number"
                value={payment?.paymentNumber || "-"}
              />
              <DetailRow
                label="Invoice ID"
                value={payment?.gatewayInvoiceId || "-"}
              />
              <DetailRow
                label="External ID"
                value={payment?.gatewayOrderId || "-"}
              />
              <DetailRow
                label="Channel"
                value={payment?.paymentChannel || payment?.paymentType || "-"}
              />
              <DetailRow label="Total" value={formatRupiah(order.totalPrice)} />
            </div>

            {canPay && (
              <button
                type="button"
                onClick={() => onPayNow(order)}
                disabled={actionLoading === `pay-${order.id}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === `pay-${order.id}` ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <ExternalLink size={17} />
                )}
                Bayar Sekarang
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 last:border-0 dark:border-slate-800">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-black text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="max-w-[60%] break-words text-right text-xs font-black text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const view = getOrderStatusView(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${view.className}`}
    >
      {view.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const view = getPaymentStatusView(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${view.className}`}
    >
      {view.label}
    </span>
  );
}

function EmptyOrders({ hasOrders }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <PackageX className="mx-auto text-slate-400" size={58} />

      <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
        {hasOrders ? "Pesanan tidak ditemukan" : "Belum ada pesanan"}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
        {hasOrders
          ? "Coba ubah filter atau kata pencarian."
          : "Mulai belanja produk BaenTech Store dan lakukan checkout."}
      </p>

      <Link
        to="/products"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
      >
        <ShoppingBag size={18} />
        Belanja Sekarang
      </Link>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-56 animate-pulse rounded-3xl bg-white dark:bg-slate-900"
        />
      ))}
    </div>
  );
}

function normalizeOrder(order) {
  return {
    id: order?.id || order?.orderId,
    orderNumber: order?.orderNumber || "-",
    email: order?.email || "",
    recipientName: order?.recipientName || "-",
    phoneNumber: order?.phoneNumber || "-",
    shippingAddress: order?.shippingAddress || "-",
    city: order?.city || "-",
    province: order?.province || "-",
    postalCode: order?.postalCode || "-",
    totalPrice: Number(order?.totalPrice || 0),
    status: String(order?.status || "PENDING_PAYMENT").toUpperCase(),
    items: Array.isArray(order?.items) ? order.items : [],
    createdAt: order?.createdAt,
    updatedAt: order?.updatedAt,
  };
}

function normalizePayment(payment) {
  return {
    id: payment?.id || payment?.paymentId,
    orderId: payment?.orderId,
    orderNumber: payment?.orderNumber,
    paymentNumber: payment?.paymentNumber || "-",
    amount: Number(payment?.amount || 0),
    paymentMethod: payment?.paymentMethod || "QRIS",
    status: normalizePaymentStatus(
      payment?.status || payment?.transactionStatus,
    ),
    gateway: payment?.gateway || "XENDIT",
    gatewayOrderId: payment?.gatewayOrderId || "-",
    gatewayInvoiceId: payment?.gatewayInvoiceId || "-",
    redirectUrl:
      payment?.redirectUrl || payment?.invoiceUrl || payment?.invoice_url || "",
    transactionStatus: payment?.transactionStatus || "-",
    paymentType: payment?.paymentType || "-",
    paymentChannel: payment?.paymentChannel || "-",
    paymentDestination: payment?.paymentDestination || "-",
    paidAt: payment?.paidAt,
    createdAt: payment?.createdAt,
    updatedAt: payment?.updatedAt,
  };
}

function savePendingPayment(order, payment) {
  localStorage.setItem(
    "baentechPendingPayment",
    JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayInvoiceId: payment.gatewayInvoiceId,
      redirectUrl: payment.redirectUrl,
      paymentMethod: payment.paymentMethod,
      totalPrice: order.totalPrice || payment.amount,
      createdAt: new Date().toISOString(),
    }),
  );
}

function getOrderStatusView(status) {
  const normalized = String(status || "").toUpperCase();

  const views = {
    PENDING_PAYMENT: {
      label: "Menunggu Bayar",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    },
    PAID: {
      label: "Sudah Dibayar",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    },
    PROCESSING: {
      label: "Diproses",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
    SHIPPED: {
      label: "Dikirim",
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    },
    COMPLETED: {
      label: "Selesai",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    CANCELLED: {
      label: "Dibatalkan",
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    },
  };

  return (
    views[normalized] || {
      label: normalized || "-",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    }
  );
}

function getPaymentStatusView(status) {
  const normalized = normalizePaymentStatus(status);

  const views = {
    SUCCESS: {
      label: "Payment Success",
      className:
        "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    },
    PENDING: {
      label: "Payment Pending",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    },
    FAILED: {
      label: "Payment Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    },
    EXPIRED: {
      label: "Payment Expired",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    },
    CANCELLED: {
      label: "Payment Cancelled",
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    },
  };

  return (
    views[normalized] || {
      label: "Payment -",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    }
  );
}

function normalizePaymentStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (["SUCCESS", "PAID", "SETTLED", "SETTLEMENT"].includes(normalized)) {
    return "SUCCESS";
  }

  if (["FAILED", "FAILURE", "DENIED", "DENY"].includes(normalized)) {
    return "FAILED";
  }

  if (["CANCELLED", "CANCELED", "CANCEL"].includes(normalized)) {
    return "CANCELLED";
  }

  if (["EXPIRED", "EXPIRE"].includes(normalized)) {
    return "EXPIRED";
  }

  if (!normalized || normalized === "-") {
    return "-";
  }

  return "PENDING";
}

function getProductImage(item) {
  const rawImage = item?.productImageUrl || item?.imageUrl || item?.image || "";

  if (!rawImage) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
  }

  if (String(rawImage).startsWith("http")) {
    return rawImage;
  }

  const baseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  return `${baseUrl}${rawImage}`;
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
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

export default MyOrders;
