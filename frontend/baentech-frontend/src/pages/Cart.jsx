import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { useToast } from "../components/ui/ToastProvider";
import {
  clearCartApi,
  deleteCartItemApi,
  getMyCartApi,
  updateCartItemApi,
} from "../api/cartApi";

const emptyCart = { totalItems: 0, totalPrice: 0, items: [] };

function Cart() {
  const { openConfirm } = useConfirm();
  const { showToast } = useToast();
  const [cart, setCart] = useState(emptyCart);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const items = Array.isArray(cart.items) ? cart.items : [];

  const allItemIds = useMemo(() => {
    return items.map((item) => getStableCartItemId(item)).filter(Boolean);
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((item) =>
      selectedItemIds.includes(getStableCartItemId(item)),
    );
  }, [items, selectedItemIds]);

  const cartSummary = useMemo(() => {
    const totalItems = items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    );

    const totalPrice = items.reduce(
      (total, item) => total + getItemSubTotal(item),
      0,
    );

    return {
      totalItems: Number(cart.totalItems || totalItems || 0),
      totalPrice: Number(cart.totalPrice || totalPrice || 0),
    };
  }, [cart.totalItems, cart.totalPrice, items]);

  const checkoutSummary = useMemo(() => {
    const totalItems = selectedItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    );

    const totalPrice = selectedItems.reduce(
      (total, item) => total + getItemSubTotal(item),
      0,
    );

    return {
      totalItems,
      totalProducts: selectedItems.length,
      totalPrice,
    };
  }, [selectedItems]);

  const isAllSelected =
    allItemIds.length > 0 &&
    allItemIds.every((itemId) => selectedItemIds.includes(itemId));

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyCartApi();
      setCart(normalizeCartData(data));
    } catch (err) {
      console.log("ERROR FETCH CART:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal mengambil data keranjang.";
      setError(message);
      showToast({ type: "error", message });
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    const data = await getMyCartApi();
    setCart(normalizeCartData(data));
  };
  const toggleSelectItem = (item) => {
    const itemId = getStableCartItemId(item);
    if (!itemId) return;

    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      return [...prev, itemId];
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds(allItemIds);
  };

  const saveCheckoutItems = () => {
    localStorage.setItem(
      "baentechCheckoutItems",
      JSON.stringify({
        items: selectedItems,
        totalItems: checkoutSummary.totalItems,
        totalProducts: checkoutSummary.totalProducts,
        totalPrice: checkoutSummary.totalPrice,
      }),
    );
  };

  const updateQuantity = async (item, quantity) => {
    const itemId = getCartItemId(item);
    if (!itemId || quantity < 1) return;

    try {
      setActionLoadingId(`qty-${itemId}`);
      setError("");
      setSuccessMessage("");
      const data = await updateCartItemApi(itemId, quantity);
      setCart(normalizeCartData(data));
      setSuccessMessage("Jumlah produk berhasil diperbarui.");
      showToast({
        type: "success",
        message: "Jumlah produk berhasil diperbarui.",
      });
    } catch (err) {
      console.log("ERROR UPDATE CART:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal mengubah jumlah produk.";
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteItem = async (item) => {
    const itemId = getDeleteItemId(item);

    if (!itemId) {
      const message = "ID item keranjang tidak ditemukan.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    openConfirm({
      title: "Hapus Produk?",
      message: "Produk akan dihapus dari keranjang belanja.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: async () => {
        try {
          setActionLoadingId(`delete-${itemId}`);
          setError("");
          setSuccessMessage("");

          await deleteCartItemApi(itemId);

          setCart((prev) => {
            const prevItems = Array.isArray(prev.items) ? prev.items : [];

            const nextItems = prevItems.filter((cartItem) => {
              return String(cartItem.id) !== String(itemId);
            });

            return normalizeCartData({
              ...prev,
              items: nextItems,
              totalItems: nextItems.reduce(
                (total, cartItem) => total + Number(cartItem.quantity || 0),
                0,
              ),
              totalPrice: nextItems.reduce(
                (total, cartItem) => total + getItemSubTotal(cartItem),
                0,
              ),
            });
          });

          setSelectedItemIds((prev) =>
            prev.filter((selectedId) => String(selectedId) !== String(itemId)),
          );

          window.dispatchEvent(new CustomEvent("baentech-cart-updated"));

          setSuccessMessage("Produk berhasil dihapus dari keranjang.");
          showToast({
            type: "success",
            message: "Produk berhasil dihapus dari keranjang.",
          });
        } catch (err) {
          console.log("ERROR DELETE CART:", err);
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Gagal menghapus produk dari keranjang.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };
  const clearCart = async () => {
    if (!items.length) return;

    openConfirm({
      title: "Kosongkan Keranjang?",
      message: "Semua produk di keranjang akan dihapus.",
      confirmText: "Ya, Kosongkan",
      cancelText: "Batal",
      variant: "danger",
      onConfirm: async () => {
        try {
          setClearing(true);
          setError("");
          setSuccessMessage("");
          await clearCartApi();
          setCart(emptyCart);
          setSuccessMessage("Keranjang berhasil dikosongkan.");
          showToast({
            type: "success",
            message: "Keranjang berhasil dikosongkan.",
          });
        } catch (err) {
          console.log("ERROR CLEAR CART:", err);
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Gagal mengosongkan keranjang.";
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setClearing(false);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/products"
              className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:text-blue-600 dark:bg-slate-900 dark:text-slate-200 sm:text-sm"
            >
              <ArrowLeft size={17} />
              Lanjut Belanja
            </Link>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400 sm:text-sm">
              BaenTech Cart
            </p>
            <h1 className="mt-2 break-words text-2xl font-black text-slate-950 dark:text-white sm:text-4xl">
              Keranjang Belanja
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Cek produk yang mau dibeli, ubah jumlah barang, atau hapus produk
              yang tidak jadi dibeli.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCart}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <Notice type="error" message={error} />
        <Notice type="success" message={successMessage} />

        {loading ? (
          <CartLoading />
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:gap-6">
            <section className="min-w-0 space-y-4">
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                    Produk di Keranjang
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                    Total {cartSummary.totalItems} item dari {items.length}{" "}
                    produk. Dipilih {checkoutSummary.totalItems} item dari{" "}
                    {checkoutSummary.totalProducts} produk.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:text-sm">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Pilih Semua
                </label>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={clearing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 sm:text-sm"
                >
                  {clearing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Kosongkan
                </button>
              </div>
              {items.map((item) => {
                const itemId = getCartItemId(item);

                return (
                  <CartItemCard
                    key={itemId}
                    item={item}
                    selected={selectedItemIds.includes(
                      getStableCartItemId(item),
                    )}
                    loadingQty={actionLoadingId === `qty-${itemId}`}
                    deleting={actionLoadingId === `delete-${itemId}`}
                    onToggleSelect={() => toggleSelectItem(item)}
                    onIncrease={() =>
                      updateQuantity(item, Number(item.quantity || 1) + 1)
                    }
                    onDecrease={() =>
                      updateQuantity(item, Number(item.quantity || 1) - 1)
                    }
                    onDelete={() => deleteItem(item)}
                  />
                );
              })}
            </section>

            <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <CartSummary
                cartTotalItems={cartSummary.totalItems}
                cartTotalPrice={cartSummary.totalPrice}
                checkoutTotalItems={checkoutSummary.totalItems}
                checkoutTotalProducts={checkoutSummary.totalProducts}
                checkoutTotalPrice={checkoutSummary.totalPrice}
                loading={clearing || Boolean(actionLoadingId)}
                onCheckout={saveCheckoutItems}
              />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function Notice({ type, message }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-bold sm:px-5 sm:py-4 ${
        isError
          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
      }`}
    >
      {isError ? (
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span className="break-words">{message}</span>
    </div>
  );
}

function CartItemCard({
  item,
  selected,
  loadingQty,
  deleting,
  onToggleSelect,
  onIncrease,
  onDecrease,
  onDelete,
}) {
  const quantity = Number(item.quantity || 1);
  const productId = item.productId;
  const productName = item.productName || item.name || "Produk";
  const productBrand = item.productBrand || item.brand || "BaenTech";
  const price = Number(item.price || 0);
  const subTotal = getItemSubTotal(item);

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-3xl border p-3 shadow-sm transition sm:p-5 ${
        selected
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {" "}
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 sm:text-sm">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Pilih untuk checkout
        </label>
      </div>
      <div className="grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-3 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-5">
        <Link
          to={`/products/${productId}`}
          className="block h-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 sm:h-32"
        >
          <img
            src={getProductImage(item)}
            alt={productName}
            className="h-full w-full object-cover transition hover:scale-105"
          />
        </Link>

        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                to={`/products/${productId}`}
                className="line-clamp-2 break-words text-sm font-black leading-snug text-slate-950 transition hover:text-blue-600 dark:text-white sm:text-lg"
              >
                {productName}
              </Link>
              <p className="mt-1 truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
                Brand: {productBrand}
              </p>
              <p className="mt-2 text-sm font-black text-blue-600 dark:text-blue-400 sm:text-base">
                {formatRupiah(price)}
              </p>
            </div>

            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || loadingQty}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/30 dark:text-red-300 sm:h-10 sm:w-10"
              title="Hapus produk"
            >
              {deleting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:mt-auto sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase text-slate-400">
                Jumlah
              </p>
              <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={quantity <= 1 || loadingQty || deleting}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Minus size={16} />
                </button>
                <div className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-black text-slate-950 dark:border-slate-700 dark:text-white">
                  {loadingQty ? (
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                  ) : (
                    quantity
                  )}
                </div>
                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={loadingQty || deleting}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-black uppercase text-slate-400">
                Subtotal
              </p>
              <p className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                {formatRupiah(subTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CartSummary({
  cartTotalItems,
  cartTotalPrice,
  checkoutTotalItems,
  checkoutTotalProducts,
  checkoutTotalPrice,
  loading,
  onCheckout,
}) {
  const checkoutDisabled = loading || checkoutTotalItems <= 0;

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <ShoppingBag size={24} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Ringkasan Checkout
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            Total dihitung dari produk yang dipilih.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Total Keranjang" value={`${cartTotalItems} item`} />
        <SummaryRow
          label="Nilai Keranjang"
          value={formatRupiah(cartTotalPrice)}
          muted
        />
        <SummaryRow
          label="Produk Dipilih"
          value={`${checkoutTotalItems} item dari ${checkoutTotalProducts} produk`}
        />
        <SummaryRow
          label="Subtotal Checkout"
          value={formatRupiah(checkoutTotalPrice)}
        />
        <SummaryRow label="Ongkir" value="Dihitung saat checkout" muted />
      </div>

      <div className="my-6 border-t border-dashed border-slate-200 dark:border-slate-700" />

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-black text-slate-600 dark:text-slate-300">
          Total Checkout
        </p>
        <p className="break-words text-right text-2xl font-black text-blue-600 dark:text-blue-400">
          {formatRupiah(checkoutTotalPrice)}
        </p>
      </div>

      {checkoutTotalItems <= 0 && (
        <p className="mt-3 rounded-2xl bg-yellow-50 px-4 py-3 text-xs font-bold text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
          Pilih minimal 1 produk dulu untuk checkout.
        </p>
      )}

      <Link
        to="/checkout"
        onClick={onCheckout}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition ${
          checkoutDisabled
            ? "pointer-events-none bg-blue-300 opacity-70"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <ShieldCheck size={18} />
        Lanjut Checkout
      </Link>
    </div>
  );
}
function SummaryRow({ label, value, muted = false }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`break-words text-right font-black ${muted ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}>{value}</span>
    </div>
  );
}

function CartLoading() {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:gap-6">
      <section className="space-y-4">
        {[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl bg-white dark:bg-slate-900 sm:h-44" />)}
      </section>
      <aside className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900 sm:px-8 sm:py-20">
      <PackageOpen className="mx-auto text-slate-400" size={58} />
      <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">Keranjang masih kosong</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">Tambahkan produk teknologi favorit ke keranjang sebelum checkout.</p>
      <Link to="/products" className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700">
        <ShoppingBag size={18} />
        Lihat Produk
      </Link>
    </div>
  );
}

function normalizeCartData(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    ...emptyCart,
    ...data,
    items,
    totalItems: Number(data?.totalItems ?? items.reduce((total, item) => total + Number(item.quantity || 0), 0)),
    totalPrice: Number(data?.totalPrice ?? items.reduce((total, item) => total + getItemSubTotal(item), 0)),
  };
}

function getCartItemId(item) {
  return item?.id;
}

function getStableCartItemId(item) {
  return String(item?.id || "");
}

function getDeleteItemId(item) {
  return item?.id;
}
function getItemSubTotal(item) {
  const subTotal = Number(item?.subTotal || 0);
  return subTotal > 0 ? subTotal : Number(item?.price || 0) * Number(item?.quantity || 0);
}

function getProductImage(item) {
  const rawImage = item?.productImageUrl || item?.imageUrl || item?.image || item?.thumbnail;
  if (!rawImage) return "/placeholder-product.png";
  if (String(rawImage).startsWith("http") || String(rawImage).startsWith("data:image")) return rawImage;

  const productBaseUrl = import.meta.env.VITE_PRODUCT_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "";
  return `${productBaseUrl}${rawImage}`;
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default Cart;
