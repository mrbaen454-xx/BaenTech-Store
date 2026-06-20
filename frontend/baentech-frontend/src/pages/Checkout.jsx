import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { useToast } from "../components/ui/ToastProvider";
import { checkoutApi } from "../api/orderApi";
import { createXenditPaymentApi } from "../api/paymentApi";
import { getMyAddressesApi } from "../api/userProfileApi";



const paymentMethods = [
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    desc: "Pembayaran lewat transfer bank.",
  },
  {
    value: "E_WALLET",
    label: "E-Wallet",
    desc: "Pembayaran lewat dompet digital.",
  },
  {
    value: "QRIS",
    label: "QRIS",
    desc: "Scan QR untuk pembayaran.",
  },
  {
    value: "CREDIT_CARD",
    label: "Credit Card",
    desc: "Kartu kredit.",
  },
  {
    value: "COD",
    label: "COD",
    desc: "Bayar di tempat.",
  },
];

function Checkout() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [checkoutData, setCheckoutData] = useState({
    items: [],
    totalItems: 0,
    totalProducts: 0,
    totalPrice: 0,
  });

  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const mainAddress = useMemo(() => {
    return addresses.find((address) => address.mainAddress) || null;
  }, [addresses]);

  useEffect(() => {
    loadCheckoutPageData();
  }, []);

const loadCheckoutPageData = async () => {
  try {
    setLoading(true);
    setError("");

    const saved = JSON.parse(
      localStorage.getItem("baentechCheckoutItems") || "{}",
    );

    const items = Array.isArray(saved.items) ? saved.items : [];

    setCheckoutData({
      items,
      totalItems:
        Number(saved.totalItems || 0) ||
        items.reduce((total, item) => total + Number(item.quantity || 0), 0),
      totalProducts: Number(saved.totalProducts || 0) || items.length,
      totalPrice:
        Number(saved.totalPrice || 0) ||
        items.reduce((total, item) => total + getItemSubTotal(item), 0),
    });

    const addressData = await getMyAddressesApi();
    setAddresses(Array.isArray(addressData) ? addressData : []);
  } catch (err) {
    console.log("ERROR LOAD CHECKOUT PAGE:", err);

    setCheckoutData({
      items: [],
      totalItems: 0,
      totalProducts: 0,
      totalPrice: 0,
    });

    setAddresses([]);

    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Gagal mengambil data checkout.";
    setError(message);
    showToast({ type: "error", message });
  } finally {
    setLoading(false);
  }
};
  const summary = useMemo(() => {
    const items = Array.isArray(checkoutData.items) ? checkoutData.items : [];

    const totalItems =
      Number(checkoutData.totalItems || 0) ||
      items.reduce((total, item) => total + Number(item.quantity || 0), 0);

    const totalProducts =
      Number(checkoutData.totalProducts || 0) || items.length;

    const totalPrice =
      Number(checkoutData.totalPrice || 0) ||
      items.reduce((total, item) => total + getItemSubTotal(item), 0);

    return {
      totalItems,
      totalProducts,
      totalPrice,
    };
  }, [checkoutData]);

  const selectedCartItemIds = useMemo(() => {
    return checkoutData.items
      .map((item) => item.id || item.cartItemId || item.itemId)
      .filter(Boolean);
  }, [checkoutData.items]);



const validateForm = () => {
  if (!checkoutData.items.length) {
    return "Belum ada produk yang dipilih untuk checkout.";
  }

  if (!mainAddress) {
    return "Alamat utama belum tersedia. Silakan tambahkan alamat utama di profile.";
  }

  if (!mainAddress.recipientName) {
    return "Nama penerima di alamat utama belum lengkap.";
  }

  if (!mainAddress.phoneNumber) {
    return "Nomor HP di alamat utama belum lengkap.";
  }

  if (!mainAddress.fullAddress) {
    return "Alamat lengkap di alamat utama belum lengkap.";
  }

  if (!mainAddress.city) {
    return "Kota di alamat utama belum lengkap.";
  }

  if (!mainAddress.province) {
    return "Provinsi di alamat utama belum lengkap.";
  }

  if (!mainAddress.postalCode) {
    return "Kode pos di alamat utama belum lengkap.";
  }

  return "";
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const validationMessage = validateForm();

  if (validationMessage) {
    setError(validationMessage);
    showToast({ type: "warning", message: validationMessage });
    return;
  }

  try {
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const checkoutPayload = {
      recipientName: mainAddress.recipientName,
      phoneNumber: mainAddress.phoneNumber,
      shippingAddress: mainAddress.fullAddress,
      city: mainAddress.city,
      province: mainAddress.province,
      postalCode: mainAddress.postalCode,
    };

    console.log("CHECKOUT PAYLOAD:", checkoutPayload);
    const order = await checkoutApi(checkoutPayload);

    const orderId = order?.id || order?.orderId;

    if (!orderId) {
      throw new Error("Order ID tidak ditemukan dari response checkout.");
    }

    const payment = await createXenditPaymentApi({
      orderId,
      paymentMethod,
    });

const redirectUrl =
  payment?.redirectUrl || payment?.invoiceUrl || payment?.invoice_url;
    const snapToken = payment?.snapToken || payment?.token;

    if (!redirectUrl) {
      throw new Error(
        "Redirect URL Xendit tidak ditemukan dari payment-service.",
      );
    }

    localStorage.setItem(
      "baentechPendingPayment",
      JSON.stringify({
        orderId,
        orderNumber: order?.orderNumber,
        paymentId: payment?.id || payment?.paymentId,
        paymentNumber: payment?.paymentNumber,
        snapToken,
        redirectUrl,
        paymentMethod,
        totalPrice: order?.totalPrice || payment?.amount,
        createdAt: new Date().toISOString(),
      }),
    );

    localStorage.removeItem("baentechCheckoutItems");

    setSuccessMessage("Pesanan berhasil dibuat. Mengarahkan ke Xendit...");
    showToast({
      type: "success",
      message: "Pesanan berhasil dibuat. Mengarahkan ke Xendit...",
    });

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 500);
  } catch (err) {
   console.log("ERROR CHECKOUT XENDIT:", err);
   console.log(
     "CHECKOUT ERROR RESPONSE:",
     JSON.stringify(err.response?.data, null, 2),
   );

    const backendMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.response?.data?.detail ||
      err.response?.data?.errors ||
      err.message ||
      "Gagal membuat checkout Xendit.";

    const message =
      typeof backendMessage === "string"
        ? backendMessage
        : JSON.stringify(backendMessage);
    setError(message);
    showToast({ type: "error", message });
  } finally {
    setSubmitting(false);
  }
};
  const removeCheckoutItem = (item) => {
    const itemId = item.id || item.cartItemId || item.itemId;

    const nextItems = checkoutData.items.filter((cartItem) => {
      const cartItemId = cartItem.id || cartItem.cartItemId || cartItem.itemId;
      return String(cartItemId) !== String(itemId);
    });

    const nextData = {
      items: nextItems,
      totalItems: nextItems.reduce(
        (total, cartItem) => total + Number(cartItem.quantity || 0),
        0,
      ),
      totalProducts: nextItems.length,
      totalPrice: nextItems.reduce(
        (total, cartItem) => total + getItemSubTotal(cartItem),
        0,
      ),
    };

    setCheckoutData(nextData);
    localStorage.setItem("baentechCheckoutItems", JSON.stringify(nextData));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/cart"
              className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:text-blue-600 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft size={17} />
              Kembali ke Keranjang
            </Link>

            <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Checkout
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Selesaikan Pesanan
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Lengkapi alamat pengiriman dan metode pembayaran untuk membuat
              pesanan.
            </p>
          </div>

          <CheckoutSteps />
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:px-5 sm:py-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300 sm:px-5 sm:py-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="h-[520px] animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
            <div className="h-[420px] animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
          </div>
        ) : checkoutData.items.length === 0 ? (
          <EmptyCheckout />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
          >
            <section className="min-w-0 space-y-6">
              <MainShippingAddress address={mainAddress} />

              <SelectedProducts
                items={checkoutData.items}
                onRemove={removeCheckoutItem}
              />

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </section>

            <CheckoutSummary
              summary={summary}
              paymentMethod={paymentMethod}
              submitting={submitting}
            />
          </form>
        )}
      </main>
    </div>
  );
}

function CheckoutSteps() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-3 sm:p-3">
      {["Cart", "Checkout", "Payment", "Done"].map((step, index) => {
        const active = step === "Checkout";

        return (
          <div
            key={step}
            className={`rounded-2xl px-3 py-2 text-center text-[10px] font-black sm:text-xs ${
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400"
            }`}
          >
            <span className="block">{index + 1}</span>
            <span className="mt-0.5 block">{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function MainShippingAddress({ address }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <MapPin size={22} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
            Alamat Pengiriman
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
            Menggunakan alamat utama dari profile.
          </p>
        </div>
      </div>

      {!address ? (
        <div className="rounded-3xl border border-dashed border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-900/60 dark:bg-yellow-950/20">
          <p className="text-sm font-black text-yellow-700 dark:text-yellow-300">
            Alamat utama belum tersedia
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-yellow-700/80 dark:text-yellow-300/80">
            Tambahkan alamat di halaman profile dan jadikan sebagai alamat utama
            sebelum checkout.
          </p>

          <Link
            to="/profile"
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
          >
            Kelola Alamat
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-black text-slate-950 dark:text-white sm:text-lg">
                  {address.recipientName}
                </h3>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  Utama
                </span>
              </div>

              <p className="mt-2 break-words text-sm font-bold text-slate-600 dark:text-slate-300">
                {address.phoneNumber}
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                {address.fullAddress}
              </p>

              <p className="mt-3 break-words text-sm font-black text-slate-700 dark:text-slate-200">
                {address.city}, {address.province} {address.postalCode}
              </p>
            </div>

            <Link
              to="/profile"
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Ganti Alamat
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
function SelectedProducts({ items, onRemove }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
            Produk Dipilih
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            Hanya produk berikut yang masuk checkout.
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {items.length} Produk
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const itemId =
            item.id || item.cartItemId || item.itemId || item.productId;

          return (
            <article
              key={itemId}
              className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center sm:p-4"
            >
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 sm:h-19 sm:w-19">
                <img
                  src={getProductImage(item)}
                  alt={getProductName(item)}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <h3 className="line-clamp-2 break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
                  {getProductName(item)}
                </h3>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {item.productBrand || item.brand || "-"}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Qty {Number(item.quantity || 0)} ×{" "}
                  {formatRupiah(getItemPrice(item))}
                </p>
              </div>

              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 sm:text-base">
                  {formatRupiah(getItemSubTotal(item))}
                </p>

                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white dark:bg-red-950/40 dark:text-red-300"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PaymentMethodSelector({ value, onChange }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <CreditCard size={22} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
            Metode Pembayaran
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            Pilih metode pembayaran setelah order dibuat.
          </p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paymentMethods.map((method) => {
          const active = value === method.value;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              className={`min-w-0 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              <p className="break-words text-sm font-black">{method.label}</p>
              <p className="mt-1 text-xs font-semibold opacity-70">
                {method.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckoutSummary({ summary, paymentMethod, submitting }) {
  const checkoutDisabled = submitting || summary.totalItems <= 0;

  return (
    <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <ShoppingBag size={24} />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Ringkasan Order
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              Total produk yang akan dibuat pesanan.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <SummaryRow
            label="Produk Dipilih"
            value={`${summary.totalProducts} produk`}
          />
          <SummaryRow label="Total Item" value={`${summary.totalItems} item`} />
          <SummaryRow
            label="Subtotal"
            value={formatRupiah(summary.totalPrice)}
          />
          <SummaryRow label="Ongkir" value="Dihitung admin" muted />
          <SummaryRow label="Metode" value={paymentMethod} />
        </div>

        <div className="my-6 border-t border-dashed border-slate-200 dark:border-slate-700" />

        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-black text-slate-600 dark:text-slate-300">
            Total Checkout
          </p>

          <p className="break-words text-right text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatRupiah(summary.totalPrice)}
          </p>
        </div>

        <button
          type="submit"
          disabled={checkoutDisabled}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShieldCheck size={18} />
          )}
          {submitting ? "Mengarahkan ke Payment..." : "Bayar Sekarang"}
        </button>

        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Setelah pesanan dibuat, kamu akan diarahkan ke halaman pembayaran
          Xendit.
        </p>
      </div>
    </aside>
  );
}

function EmptyCheckout() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 sm:p-12">
      <PackageCheck className="mx-auto text-slate-400" size={56} />

      <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
        Belum ada produk checkout
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
        Pilih produk dari halaman keranjang terlebih dahulu, lalu klik Lanjut
        Checkout.
      </p>

      <Link
        to="/cart"
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
      >
        Ke Keranjang
      </Link>
    </div>
  );
}
function SummaryRow({ label, value, muted = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
        {label}
      </p>

      <p
        className={`break-words text-right text-xs font-black sm:text-sm ${
          muted
            ? "text-slate-500 dark:text-slate-400"
            : "text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
function getProductName(item) {
  return item.productName || item.name || item.product?.name || "Produk";
}

function getProductImage(item) {
  const rawImage =
    item.productImageUrl ||
    item.imageUrl ||
    item.image ||
    item.product?.imageUrl ||
    "";

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

function getItemPrice(item) {
  return Number(item.price || item.productPrice || item.product?.price || 0);
}

function getItemSubTotal(item) {
  return Number(
    item.subTotal ||
      item.subtotal ||
      getItemPrice(item) * Number(item.quantity || 0),
  );
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default Checkout;
