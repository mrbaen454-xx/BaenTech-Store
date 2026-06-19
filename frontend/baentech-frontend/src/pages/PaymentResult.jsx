import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { getPaymentByOrderIdApi } from "../api/paymentApi";

function PaymentResult() {
  const location = useLocation();

  const [pendingPayment, setPendingPayment] = useState(null);
  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const pageStatus = useMemo(() => {
    if (location.pathname.includes("/payment/error")) return "ERROR";
    if (location.pathname.includes("/payment/pending")) return "PENDING";
    return "FINISH";
  }, [location.pathname]);

  const queryParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  useEffect(() => {
    loadPaymentData();
  }, [location.search]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError("");

      const saved = JSON.parse(
        localStorage.getItem("baentechPendingPayment") || "{}",
      );

      const midtransOrderId = queryParams.get("order_id");
      const transactionStatus = queryParams.get("transaction_status");
      const statusCode = queryParams.get("status_code");

      const baseData = {
        ...saved,
        midtransOrderId,
        transactionStatus,
        statusCode,
      };

      setPendingPayment(baseData);

      if (saved?.orderId) {
        const paymentData = await getPaymentByOrderIdApi(saved.orderId);
        setPayment(paymentData);
      }
    } catch (err) {
      console.log("ERROR LOAD PAYMENT RESULT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Belum bisa mengambil status payment terbaru.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      setError("");

      const orderId = pendingPayment?.orderId;

      if (!orderId) {
        throw new Error("Order ID tidak ditemukan.");
      }

      const paymentData = await getPaymentByOrderIdApi(orderId);
      setPayment(paymentData);
    } catch (err) {
      console.log("ERROR CHECK PAYMENT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Gagal mengecek status payment.",
      );
    } finally {
      setChecking(false);
    }
  };

  const paymentStatus = String(
    payment?.status ||
      pendingPayment?.transactionStatus ||
      pageStatus ||
      "PENDING",
  ).toUpperCase();

  const view = getPaymentView(paymentStatus, pageStatus);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-sm font-black text-slate-500 dark:text-slate-400">
              <Loader2 className="animate-spin" size={22} />
              Memuat status pembayaran...
            </div>
          </div>
        ) : (
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              className={`p-6 text-white sm:p-8 ${
                view.color === "green"
                  ? "bg-green-600"
                  : view.color === "red"
                    ? "bg-red-600"
                    : "bg-blue-600"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15">
                    <view.icon size={34} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-wide text-white/80">
                      Payment Gateway
                    </p>

                    <h1 className="mt-1 break-words text-2xl font-black sm:text-4xl">
                      {view.title}
                    </h1>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/85 sm:text-base">
                      {view.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                  <p className="text-xs font-bold uppercase text-white/75">
                    Status
                  </p>
                  <p className="text-lg font-black">{paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
              <div className="min-w-0 rounded-3xl bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Detail Pembayaran
                </h2>

                {error && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-yellow-100 px-4 py-3 text-sm font-bold text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                    <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <ResultRow
                    label="Order ID"
                    value={pendingPayment?.orderId || "-"}
                  />
                  <ResultRow
                    label="Order Number"
                    value={
                      pendingPayment?.orderNumber || payment?.orderNumber || "-"
                    }
                  />
                  <ResultRow
                    label="Payment Number"
                    value={
                      payment?.paymentNumber ||
                      pendingPayment?.paymentNumber ||
                      "-"
                    }
                  />
                  <ResultRow
                    label="Metode"
                    value={
                      payment?.paymentMethod ||
                      pendingPayment?.paymentMethod ||
                      "-"
                    }
                  />
                  <ResultRow
                    label="Total"
                    value={formatRupiah(
                      payment?.amount || pendingPayment?.totalPrice || 0,
                    )}
                  />
                  <ResultRow
                    label="Midtrans Order ID"
                    value={
                      pendingPayment?.midtransOrderId ||
                      payment?.gatewayOrderId ||
                      "-"
                    }
                  />
                </div>
              </div>

              <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <CreditCard size={24} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  Langkah Berikutnya
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  Kalau status belum berubah, klik cek status. Webhook Midtrans
                  mungkin butuh beberapa detik sampai masuk ke backend.
                </p>

                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checking ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  {checking ? "Mengecek..." : "Cek Status"}
                </button>

                {pendingPayment?.redirectUrl && paymentStatus !== "SUCCESS" && (
                  <a
                    href={pendingPayment.redirectUrl}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-600 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-600 hover:text-white dark:text-blue-400"
                  >
                    <CreditCard size={18} />
                    Bayar Lagi
                  </a>
                )}

                <Link
                  to="/cart"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
                >
                  <ShoppingBag size={18} />
                  Kembali ke Cart
                </Link>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function getPaymentView(paymentStatus, pageStatus) {
  if (paymentStatus === "SUCCESS" || paymentStatus === "SETTLEMENT") {
    return {
      icon: CheckCircle2,
      color: "green",
      title: "Pembayaran Berhasil",
      description:
        "Pembayaran kamu berhasil. Pesanan akan lanjut diproses oleh admin.",
    };
  }

  if (
    paymentStatus === "FAILED" ||
    paymentStatus === "CANCELLED" ||
    paymentStatus === "EXPIRED" ||
    pageStatus === "ERROR"
  ) {
    return {
      icon: XCircle,
      color: "red",
      title: "Pembayaran Gagal",
      description:
        "Pembayaran gagal, dibatalkan, atau sudah kedaluwarsa. Kamu bisa coba bayar ulang.",
    };
  }

  return {
    icon: Clock,
    color: "blue",
    title: "Menunggu Pembayaran",
    description:
      "Transaksi sudah dibuat dan sedang menunggu konfirmasi pembayaran.",
  };
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="break-words text-right text-sm font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default PaymentResult;
