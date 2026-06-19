import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  WalletCards,
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

      const saved = safeParseJSON(
        localStorage.getItem("baentechPendingPayment"),
        {},
      );

      const xenditExternalId =
        queryParams.get("external_id") ||
        queryParams.get("order_id") ||
        queryParams.get("externalId");

      const xenditInvoiceId =
        queryParams.get("id") ||
        queryParams.get("invoice_id") ||
        queryParams.get("invoiceId");

      const xenditStatus =
        queryParams.get("status") ||
        queryParams.get("transaction_status") ||
        queryParams.get("payment_status");

      const baseData = {
        ...saved,
        xenditExternalId,
        xenditInvoiceId,
        xenditStatus,
      };

      setPendingPayment(baseData);

      if (saved?.orderId) {
        const paymentData = await getPaymentByOrderIdApi(saved.orderId);
        setPayment(paymentData);

        const normalizedStatus = normalizePaymentStatus(
          paymentData?.status || paymentData?.transactionStatus,
          pageStatus,
        );

        localStorage.setItem(
          "baentechPendingPayment",
          JSON.stringify({
            ...baseData,
            lastStatus: normalizedStatus,
            paymentId:
              paymentData?.id || paymentData?.paymentId || saved.paymentId,
            paymentNumber: paymentData?.paymentNumber || saved.paymentNumber,
            gatewayOrderId:
              paymentData?.gatewayOrderId || baseData.xenditExternalId,
            gatewayInvoiceId:
              paymentData?.gatewayInvoiceId || baseData.xenditInvoiceId,
            redirectUrl: paymentData?.redirectUrl || saved.redirectUrl,
            totalPrice: paymentData?.amount || saved.totalPrice,
          }),
        );
      } else {
        setError(
          "Data order belum ditemukan di browser. Silakan cek status dari halaman pesanan nanti.",
        );
      }
    } catch (err) {
      console.log("ERROR LOAD PAYMENT RESULT:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
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

      const normalizedStatus = normalizePaymentStatus(
        paymentData?.status || paymentData?.transactionStatus,
        pageStatus,
      );

      localStorage.setItem(
        "baentechPendingPayment",
        JSON.stringify({
          ...pendingPayment,
          lastStatus: normalizedStatus,
          paymentId: paymentData?.id || paymentData?.paymentId,
          paymentNumber: paymentData?.paymentNumber,
          gatewayOrderId: paymentData?.gatewayOrderId,
          gatewayInvoiceId: paymentData?.gatewayInvoiceId,
          redirectUrl: paymentData?.redirectUrl || pendingPayment?.redirectUrl,
          totalPrice: paymentData?.amount || pendingPayment?.totalPrice,
        }),
      );
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

  const paymentStatus = normalizePaymentStatus(
    payment?.status ||
      payment?.transactionStatus ||
      pendingPayment?.lastStatus ||
      pendingPayment?.xenditStatus,
    pageStatus,
  );

  const view = getPaymentView(paymentStatus, pageStatus);
  const StatusIcon = view.icon;

  const gateway = payment?.gateway || "XENDIT";
  const redirectUrl = payment?.redirectUrl || pendingPayment?.redirectUrl;
  const isSuccess = paymentStatus === "SUCCESS";
  const isFailed = ["FAILED", "CANCELLED", "EXPIRED"].includes(paymentStatus);
  const canPayAgain = Boolean(redirectUrl) && !isSuccess;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:text-blue-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={17} />
          Kembali Belanja
        </Link>

        {loading ? (
          <LoadingCard />
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
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15">
                    <StatusIcon size={34} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-wide text-white/80">
                      Xendit Payment Gateway
                    </p>

                    <h1 className="mt-1 break-words text-2xl font-black sm:text-4xl">
                      {view.title}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/85 sm:text-base">
                      {view.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                  <StatusPill label="Gateway" value={gateway} />
                  <StatusPill label="Status" value={paymentStatus} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
              <div className="min-w-0 space-y-6">
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl bg-yellow-100 px-4 py-3 text-sm font-bold text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                    <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <ReceiptText size={22} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Detail Pembayaran
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                        Data ini diambil dari payment-service setelah callback
                        Xendit.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ResultRow
                      label="Order ID"
                      value={pendingPayment?.orderId || payment?.orderId || "-"}
                    />
                    <ResultRow
                      label="Order Number"
                      value={
                        payment?.orderNumber ||
                        pendingPayment?.orderNumber ||
                        "-"
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
                      label="Total Bayar"
                      value={formatRupiah(
                        payment?.amount || pendingPayment?.totalPrice || 0,
                      )}
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
                      label="Channel Xendit"
                      value={
                        payment?.paymentChannel || payment?.paymentType || "-"
                      }
                    />
                    <ResultRow
                      label="Tujuan Pembayaran"
                      value={payment?.paymentDestination || "-"}
                    />
                    <ResultRow
                      label="External ID"
                      value={
                        payment?.gatewayOrderId ||
                        pendingPayment?.gatewayOrderId ||
                        pendingPayment?.xenditExternalId ||
                        "-"
                      }
                    />
                    <ResultRow
                      label="Invoice ID"
                      value={
                        payment?.gatewayInvoiceId ||
                        pendingPayment?.gatewayInvoiceId ||
                        pendingPayment?.xenditInvoiceId ||
                        "-"
                      }
                    />
                  </div>
                </div>

                <PaymentTimeline status={paymentStatus} />
              </div>

              <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:self-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <WalletCards size={24} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  Langkah Berikutnya
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  {isSuccess
                    ? "Pembayaran sudah berhasil. Pesanan kamu akan masuk ke proses admin."
                    : isFailed
                      ? "Pembayaran gagal atau kedaluwarsa. Kamu bisa mencoba bayar ulang."
                      : "Kalau status belum berubah, klik cek status. Callback Xendit kadang butuh beberapa detik."}
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

                {canPayAgain && (
                  <a
                    href={redirectUrl}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-600 px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-600 hover:text-white dark:text-blue-400"
                  >
                    <ExternalLink size={18} />
                    Bayar Lagi
                  </a>
                )}

                <Link
                  to="/my-orders"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
                >
                  <PackageCheck size={18} />
                  Lihat Pesanan
                </Link>

                <Link
                  to="/products"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
                >
                  <PackageCheck size={18} />
                  Belanja Lagi
                </Link>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Halaman pesanan user belum dibuat. Nanti setelah halaman
                  <span className="font-black"> My Orders </span>
                  selesai, tombol ini kita arahkan ke detail pesanan.
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm font-black text-slate-500 dark:text-slate-400">
        <Loader2 className="animate-spin" size={22} />
        Memuat status pembayaran...
      </div>
    </div>
  );
}

function PaymentTimeline({ status }) {
  const steps = [
    {
      label: "Order dibuat",
      active: true,
    },
    {
      label: "Menunggu pembayaran",
      active: ["PENDING", "SUCCESS", "FAILED", "EXPIRED", "CANCELLED"].includes(
        status,
      ),
    },
    {
      label: "Pembayaran berhasil",
      active: status === "SUCCESS",
    },
    {
      label: "Pesanan diproses",
      active: status === "SUCCESS",
    },
  ];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900 sm:p-6">
      <h2 className="text-lg font-black text-slate-950 dark:text-white">
        Alur Pesanan
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`rounded-2xl border p-4 ${
              step.active
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950"
            }`}
          >
            <div
              className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                step.active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500 dark:bg-slate-800"
              }`}
            >
              {index + 1}
            </div>
            <p className="text-sm font-black">{step.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPaymentView(paymentStatus, pageStatus) {
  if (paymentStatus === "SUCCESS") {
    return {
      icon: CheckCircle2,
      color: "green",
      title: "Pembayaran Berhasil",
      description:
        "Pembayaran kamu berhasil dikonfirmasi oleh Xendit. Pesanan akan lanjut diproses oleh admin.",
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
        "Pembayaran gagal, dibatalkan, atau sudah kedaluwarsa. Kamu bisa mencoba bayar ulang.",
    };
  }

  return {
    icon: Clock,
    color: "blue",
    title: "Menunggu Pembayaran",
    description:
      "Invoice Xendit sudah dibuat dan sistem sedang menunggu konfirmasi pembayaran.",
  };
}

function StatusPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
      <p className="text-xs font-bold uppercase text-white/75">{label}</p>
      <p className="break-words text-base font-black sm:text-lg">{value}</p>
    </div>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="max-w-[60%] break-words text-right text-sm font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function normalizePaymentStatus(value, pageStatus) {
  const status = String(value || "").toUpperCase();

  if (["SUCCESS", "PAID", "SETTLED", "SETTLEMENT"].includes(status)) {
    return "SUCCESS";
  }

  if (["FAILED", "FAILURE", "DENIED", "DENY"].includes(status)) {
    return "FAILED";
  }

  if (["CANCELLED", "CANCELED", "CANCEL"].includes(status)) {
    return "CANCELLED";
  }

  if (["EXPIRED", "EXPIRE"].includes(status)) {
    return "EXPIRED";
  }

  if (pageStatus === "ERROR") {
    return "FAILED";
  }

  return "PENDING";
}

function safeParseJSON(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default PaymentResult;
