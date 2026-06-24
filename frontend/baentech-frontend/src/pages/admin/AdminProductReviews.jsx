import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  MessageSquareText,
  Package,
  RefreshCw,
  Star,
  UserCircle2,
} from "lucide-react";

import BrandLogo from "../../components/BrandLogo";
import {
  getProductByIdApi,
  getProductReviewSummaryApi,
  getProductReviewsApi,
} from "../../api/productApi";

function AdminProductReviews() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviewPage();
  }, [id]);

  const loadReviewPage = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [productData, reviewData, summaryData] = await Promise.allSettled([
        getProductByIdApi(id),
        getProductReviewsApi(id),
        getProductReviewSummaryApi(id),
      ]);

      if (productData.status === "fulfilled") {
        setProduct(normalizeProduct(productData.value));
      } else {
        throw productData.reason;
      }

      if (reviewData.status === "fulfilled") {
        setReviews(normalizeReviews(reviewData.value));
      } else {
        setReviews([]);
      }

      if (summaryData.status === "fulfilled") {
        setSummary(normalizeSummary(summaryData.value));
      } else {
        setSummary({ averageRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      console.log("ERROR LOAD ADMIN PRODUCT REVIEWS:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal mengambil ulasan produk.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ratingDistribution = useMemo(() => {
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      total: reviews.filter((review) => Number(review.rating || 0) === rating)
        .length,
    }));

    const maxTotal = Math.max(...distribution.map((item) => item.total), 1);

    return distribution.map((item) => ({
      ...item,
      percentage: Math.round((item.total / maxTotal) * 100),
    }));
  }, [reviews]);

  const productName = product?.name || product?.productName || "Produk";
  const productImage = getProductImage(product);
  const averageRating = Number(summary.averageRating || 0);
  const totalReviews = Number(summary.totalReviews || reviews.length || 0);

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
            Kembali
          </Link>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem]">
              <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-5 text-white sm:p-7">
                  <div className="overflow-hidden rounded-[1.5rem] bg-white/10 p-3 ring-1 ring-white/15">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productName}
                        className="h-56 w-full rounded-[1.25rem] object-cover sm:h-72"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center rounded-[1.25rem] bg-white/10 sm:h-72">
                        <Package size={54} className="text-white/70" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-7 lg:p-8">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Admin Product Reviews
                  </p>

                  <h1 className="mt-2 break-words text-2xl font-black text-slate-950 dark:text-white sm:text-4xl">
                    {productName}
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                    Halaman khusus admin untuk melihat ulasan dan rating produk tanpa masuk ke tampilan detail produk user.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <SummaryCard
                      label="Rating Rata-rata"
                      value={averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                      icon={Star}
                      helper="dari 5 bintang"
                    />
                    <SummaryCard
                      label="Total Ulasan"
                      value={totalReviews}
                      icon={MessageSquareText}
                      helper="ulasan masuk"
                    />
                    <SummaryCard
                      label="Product ID"
                      value={product?.id || id}
                      icon={Package}
                      helper="ID produk"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => loadReviewPage({ silent: true })}
                    disabled={refreshing}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >
                    {refreshing ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <RefreshCw size={17} />
                    )}
                    Refresh Ulasan
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Distribusi Rating
                </h2>

                <div className="mt-5 space-y-4">
                  {ratingDistribution.map((item) => (
                    <div key={item.rating}>
                      <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          {item.rating}
                          <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        </span>
                        <span>{item.total} ulasan</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                      Daftar Ulasan
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                      Semua ulasan yang diberikan user untuk produk ini.
                    </p>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                    <MessageSquareText className="mx-auto text-slate-400" size={46} />
                    <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                      Belum ada ulasan
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Ulasan user untuk produk ini akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id || review.reviewId} review={review} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
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
          <p className="mt-2 break-words text-2xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const rating = Number(review.rating || 0);
  const userName =
    review.userName || review.fullName || review.customerName || review.email || "User";
  const comment = review.comment || review.review || review.message || "-";

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <UserCircle2 size={23} />
          </div>

          <div className="min-w-0">
            <p className="break-words text-sm font-black text-slate-950 dark:text-white sm:text-base">
              {userName}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              {formatDate(review.createdAt || review.updatedAt)}
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={13}
              className={
                index < rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          ))}
          <span className="ml-1">{rating}/5</span>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
        {comment}
      </p>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Loader2 className="mx-auto animate-spin text-blue-600" size={36} />
      <p className="mt-4 text-sm font-black text-slate-500 dark:text-slate-400">
        Memuat ulasan produk...
      </p>
    </div>
  );
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product?.id || product?.productId,
    name: product?.name || product?.productName || "Produk",
    imageUrl: product?.imageUrl || product?.image || product?.productImage || "",
  };
}

function normalizeReviews(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

function normalizeSummary(value) {
  return {
    averageRating: Number(value?.averageRating || value?.ratingAverage || 0),
    totalReviews: Number(value?.totalReviews || value?.reviewCount || 0),
  };
}

function getProductImage(product) {
  const rawImage = product?.imageUrl || "";

  if (!rawImage) return "";
  if (String(rawImage).startsWith("http")) return rawImage;

  const baseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  return `${baseUrl}${rawImage}`;
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default AdminProductReviews;
