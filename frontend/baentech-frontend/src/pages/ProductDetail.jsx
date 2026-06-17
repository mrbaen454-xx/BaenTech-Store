import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Box,
  Loader2,
  MessageSquareText,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";

import Navbar from "../components/Navbar";
import {
  createOrUpdateProductReviewApi,
  deleteProductReviewApi,
  getProductByIdApi,
  getProductReviewsApi,
  getProductReviewSummaryApi,
} from "../api/productApi";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deleteReviewLoadingId, setDeleteReviewLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const productBaseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  useEffect(() => {
    fetchProductPageData();
  }, [id]);

  const fetchProductPageData = async () => {
    try {
      setLoading(true);
      setError("");
      setReviewError("");
      setSuccessMessage("");

      const [productResult, reviewsResult, summaryResult] = await Promise.allSettled([
        getProductByIdApi(id),
        getProductReviewsApi(id),
        getProductReviewSummaryApi(id),
      ]);

      if (productResult.status === "fulfilled") {
        setProduct(productResult.value);
      } else {
        throw productResult.reason;
      }

      if (reviewsResult.status === "fulfilled") {
        setReviews(Array.isArray(reviewsResult.value) ? reviewsResult.value : []);
      } else {
        setReviews([]);
      }

      if (summaryResult.status === "fulfilled") {
        setReviewSummary({
          averageRating: Number(summaryResult.value?.averageRating || 0),
          totalReviews: Number(summaryResult.value?.totalReviews || 0),
        });
      } else {
        setReviewSummary({
          averageRating: 0,
          totalReviews: 0,
        });
      }
    } catch (err) {
      console.log(err);
      setError("Gagal mengambil detail produk.");
    } finally {
      setLoading(false);
    }
  };

  const refreshReviews = async () => {
    const [reviewsResult, summaryResult] = await Promise.allSettled([
      getProductReviewsApi(id),
      getProductReviewSummaryApi(id),
    ]);

    if (reviewsResult.status === "fulfilled") {
      setReviews(Array.isArray(reviewsResult.value) ? reviewsResult.value : []);
    }

    if (summaryResult.status === "fulfilled") {
      setReviewSummary({
        averageRating: Number(summaryResult.value?.averageRating || 0),
        totalReviews: Number(summaryResult.value?.totalReviews || 0),
      });
    }
  };

  const getCategoryName = (item) => {
    return (
      item?.categoryName ||
      item?.category?.name ||
      (typeof item?.category === "string" ? item.category : "Tanpa Kategori")
    );
  };

  const getImageUrl = (item) => {
    const rawImage =
      item?.imageUrl || item?.image || item?.photo || item?.thumbnail;

    if (!rawImage) {
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
    }

    if (rawImage.startsWith("http")) {
      return rawImage;
    }

    return `${productBaseUrl}${rawImage}`;
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/products/${id}`,
        },
      });
      return;
    }

    alert("Fitur keranjang akan kita buat di tahap berikutnya.");
  };

  const handleRatingChange = (rating) => {
    setReviewForm((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleReviewChange = (e) => {
    setReviewForm((prev) => ({
      ...prev,
      comment: e.target.value,
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/products/${id}`,
        },
      });
      return;
    }

    if (!reviewForm.comment.trim()) {
      setReviewError("Ulasan tidak boleh kosong.");
      return;
    }

    if (reviewForm.comment.trim().length < 5) {
      setReviewError("Ulasan minimal 5 karakter.");
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError("");
      setSuccessMessage("");

      await createOrUpdateProductReviewApi(id, {
        userName: getDisplayName(user),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });

      setReviewForm({
        rating: 5,
        comment: "",
      });

      await refreshReviews();

      setSuccessMessage("Ulasan berhasil disimpan.");
    } catch (err) {
      console.log("ERROR ADD REVIEW:", err);
      setReviewError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menyimpan ulasan.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      setDeleteReviewLoadingId(reviewId);
      setReviewError("");
      setSuccessMessage("");

      await deleteProductReviewApi(reviewId);
      await refreshReviews();

      setSuccessMessage("Ulasan berhasil dihapus.");
    } catch (err) {
      console.log("ERROR DELETE REVIEW:", err);
      setReviewError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal menghapus ulasan.",
      );
    } finally {
      setDeleteReviewLoadingId(null);
    }
  };

  const calculatedSummary = useMemo(() => {
    if (reviewSummary.totalReviews > 0) {
      return reviewSummary;
    }

    if (!reviews.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const totalRating = reviews.reduce(
      (total, review) => total + Number(review.rating || 0),
      0,
    );

    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
    };
  }, [reviewSummary, reviews]);

  const currentEmail = getCurrentUserEmail(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:text-blue-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
          Kembali ke Produk
        </Link>

        {loading && (
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900 sm:h-[500px]"></div>
            <div className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900 sm:h-[500px]"></div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/60 dark:bg-red-950/30 sm:p-10">
            <p className="font-black text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && product && (
          <>
            <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:rounded-[2rem]">
                <img
                  src={getImageUrl(product)}
                  alt={product.name}
                  className="h-64 w-full rounded-2xl object-cover sm:h-96 lg:h-[500px] lg:rounded-[1.5rem]"
                />

                <div className="mt-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        Rating Produk
                      </p>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                        <StarRating
                          value={calculatedSummary.averageRating}
                          readOnly
                        />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                          {Number(calculatedSummary.averageRating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center dark:bg-slate-900">
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {calculatedSummary.totalReviews}
                      </p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Ulasan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:rounded-[2rem]">
                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    {getCategoryName(product)}
                  </span>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-600 dark:bg-green-950/40 dark:text-green-300">
                    {product.status || "ACTIVE"}
                  </span>
                </div>

                <h1 className="break-words text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
                  {product.name}
                </h1>

                <p className="mt-3 break-words text-lg font-semibold text-slate-500 dark:text-slate-400">
                  Brand: {product.brand || "-"}
                </p>

                <p className="mt-5 break-words text-2xl font-black text-blue-600 dark:text-blue-400 sm:mt-6 sm:text-4xl">
                  Rp {Number(product.price || 0).toLocaleString("id-ID")}
                </p>

                <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
                  <InfoCard
                    icon={Box}
                    title="Stok"
                    value={`${product.stock || 0} tersedia`}
                  />

                  <InfoCard
                    icon={ShieldCheck}
                    title="Garansi"
                    value={product.warranty || "-"}
                  />

                  <InfoCard
                    icon={Tag}
                    title="Kategori"
                    value={getCategoryName(product)}
                  />

                  <InfoCard
                    icon={BadgeCheck}
                    title="Kualitas"
                    value="Produk Original"
                  />
                </div>

                <div className="mt-8 min-w-0">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    Deskripsi Produk
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-slate-600 dark:text-slate-300">
                    {product.description || "Belum ada deskripsi produk."}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleBuy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
                  >
                    <ShoppingCart size={20} />
                    {isAuthenticated
                      ? "Tambah ke Keranjang"
                      : "Login untuk Membeli"}
                  </button>

                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-950 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    Lihat Produk Lain
                  </Link>
                </div>
              </div>
            </div>

            <section className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    <MessageSquareText size={24} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                      Beri Ulasan
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Bagikan pengalaman kamu tentang produk ini.
                    </p>
                  </div>
                </div>

                {reviewError && (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                    <span className="break-words">{reviewError}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 rounded-2xl bg-green-100 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                      Rating
                    </label>

                    <StarRating
                      value={reviewForm.rating}
                      onChange={handleRatingChange}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-300">
                      Ulasan
                    </label>

                    <textarea
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      rows="5"
                      placeholder={
                        isAuthenticated
                          ? "Tulis ulasan produk di sini..."
                          : "Login dulu untuk memberi ulasan..."
                      }
                      disabled={!isAuthenticated}
                      className="min-h-32 w-full min-w-0 resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {reviewLoading ? "Mengirim..." : "Kirim Ulasan"}
                  </button>
                </form>
              </div>

              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">
                      Ulasan Produk
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {calculatedSummary.totalReviews} ulasan dari customer.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                    <StarRating value={calculatedSummary.averageRating} readOnly />
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <MessageSquareText
                      className="mx-auto text-slate-400"
                      size={42}
                    />
                    <p className="mt-4 text-sm font-black text-slate-700 dark:text-slate-200">
                      Belum ada ulasan
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Jadilah customer pertama yang memberi ulasan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        canDelete={
                          Boolean(currentEmail) &&
                          String(review.email || "").toLowerCase() === currentEmail
                        }
                        deleting={deleteReviewLoadingId === review.id}
                        onDelete={() => handleDeleteReview(review.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="shrink-0 text-blue-600 dark:text-blue-300" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="break-words font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, readOnly = false }) {
  const roundedValue = Math.round(Number(value || 0));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= roundedValue;

        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange?.(star)}
            disabled={readOnly}
            className={`rounded-lg p-1 transition ${
              readOnly
                ? "cursor-default"
                : "hover:scale-110 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
            }`}
            aria-label={`Rating ${star}`}
          >
            <Star
              size={22}
              className={
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, canDelete, deleting, onDelete }) {
  return (
    <div className="min-w-0 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          <UserRound size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words font-black text-slate-950 dark:text-white">
                {review.userName || "Customer"}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatDate(review.createdAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <StarRating value={review.rating} readOnly />

              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/40 dark:text-red-300"
                  title="Hapus ulasan"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
}

function getSavedUserData() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");

    return {
      ...user,
      ...userProfile,
    };
  } catch {
    return {};
  }
}

function getDisplayName(user) {
  const savedUser = getSavedUserData();

  return (
    user?.fullName ||
    user?.name ||
    savedUser?.fullName ||
    savedUser?.name ||
    user?.email ||
    savedUser?.email ||
    "Customer"
  );
}

function getCurrentUserEmail(user) {
  const savedUser = getSavedUserData();

  return String(user?.email || savedUser?.email || "")
    .trim()
    .toLowerCase();
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

export default ProductDetail;
