import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Loader2,
  MessageSquareText,
  Package,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import { getProductReviewSummaryApi, getProductsApi } from "../../api/productApi";

function AdminProductReviewsIndex() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProductsWithReviews();
  }, []);

  const loadProductsWithReviews = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const productList = await getProductsApi();

      const productsWithSummary = await Promise.all(
        productList.map(async (product) => {
          const productId = product.id || product.productId;

          if (!productId) {
            return normalizeProduct(product);
          }

          try {
            const summary = await getProductReviewSummaryApi(productId);

            return normalizeProduct({
              ...product,
              averageRating: summary.averageRating,
              totalReviews: summary.totalReviews,
            });
          } catch {
            return normalizeProduct(product);
          }
        }),
      );

      setProducts(productsWithSummary);
    } catch (err) {
      console.log("ERROR LOAD ADMIN PRODUCT REVIEW INDEX:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil daftar ulasan produk.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) => {
      return `${product.name} ${product.brand} ${product.categoryName}`
        .toLowerCase()
        .includes(q);
    });
  }, [keyword, products]);

  const totalReviews = products.reduce(
    (sum, product) => sum + Number(product.totalReviews || 0),
    0,
  );

  const reviewedProducts = products.filter(
    (product) => Number(product.totalReviews || 0) > 0,
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950">
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:rounded-[2rem] sm:p-4">
          <BrandLogo to="/admin/dashboard" />

          <Link
            to="/admin/products"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <ArrowLeft size={17} />
            Kembali Produk
          </Link>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem]">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-5 text-white sm:p-7 lg:p-8">
            <p className="text-xs font-black uppercase tracking-wide text-white/70">
              Admin Reviews Center
            </p>
            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-black sm:text-4xl">
                  Ulasan Produk
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/80 sm:text-base">
                  Lihat ringkasan rating semua produk dan masuk ke halaman ulasan detail tanpa membuka halaman produk user.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadProductsWithReviews({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-blue-700 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {refreshing ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
            <SummaryCard
              label="Total Produk"
              value={products.length}
              icon={Package}
              helper="produk tersedia"
            />
            <SummaryCard
              label="Produk Berulasan"
              value={reviewedProducts}
              icon={Star}
              helper="produk punya rating"
            />
            <SummaryCard
              label="Total Ulasan"
              value={totalReviews}
              icon={MessageSquareText}
              helper="ulasan user"
            />
          </div>
        </section>

        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari produk, brand, atau kategori..."
              className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none dark:text-white"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-[1.75rem] bg-white dark:bg-slate-900"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900 sm:rounded-[2rem]">
            <MessageSquareText className="mx-auto text-slate-400" size={52} />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
              Data ulasan tidak ditemukan
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Coba ubah kata pencarian atau refresh data produk.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductReviewCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function ProductReviewCard({ product }) {
  const rating = Number(product.averageRating || 0);
  const totalReviews = Number(product.totalReviews || 0);

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={28} className="text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-black text-slate-950 dark:text-white">
            {product.name}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {product.brand} • {product.categoryName}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-yellow-50 p-3 dark:bg-yellow-950/20">
          <p className="text-xs font-black uppercase text-yellow-700 dark:text-yellow-300">
            Rating
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Star
              size={18}
              className={
                rating > 0
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
            <span className="text-xl font-black text-slate-950 dark:text-white">
              {rating > 0 ? rating.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-300">
            Ulasan
          </p>
          <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">
            {totalReviews}
          </p>
        </div>
      </div>

      <Link
        to={`/admin/products/${product.id}/reviews`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98]"
      >
        <Eye size={17} />
        Lihat Ulasan
      </Link>
    </article>
  );
}

function normalizeProduct(product) {
  const imageUrl = getProductImage(
    product.imageUrl || product.image || product.productImage || "",
  );

  return {
    id: product.id || product.productId,
    name: product.name || product.productName || "Product",
    brand: product.brand || "-",
    categoryName: product.categoryName || product.category?.name || "Uncategorized",
    imageUrl,
    averageRating: Number(
      product.averageRating || product.ratingAverage || product.rating || 0,
    ),
    totalReviews: Number(
      product.totalReviews || product.reviewCount || product.reviewsCount || 0,
    ),
  };
}

function getProductImage(imageUrl) {
  if (!imageUrl) return "";

  if (String(imageUrl).startsWith("http")) {
    return imageUrl;
  }

  const productBaseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  if (String(imageUrl).startsWith("/")) {
    return `${productBaseUrl}${imageUrl}`;
  }

  return imageUrl;
}

export default AdminProductReviewsIndex;
