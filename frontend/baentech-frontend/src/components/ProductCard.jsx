import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MessageSquareText, Star } from "lucide-react";

import { getProductReviewSummaryApi } from "../api/productApi";

function ProductCard({ product }) {
  const productBaseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  const [reviewSummary, setReviewSummary] = useState({
    averageRating: Number(
      product.averageRating || product.ratingAverage || product.rating || 0,
    ),
    totalReviews: Number(
      product.totalReviews || product.reviewCount || product.reviewsCount || 0,
    ),
  });

  useEffect(() => {
    let mounted = true;

    const fetchReviewSummary = async () => {
      if (!product?.id) return;

      try {
        const data = await getProductReviewSummaryApi(product.id);

        if (!mounted) return;

        setReviewSummary({
          averageRating: Number(data.averageRating || 0),
          totalReviews: Number(data.totalReviews || 0),
        });
      } catch (err) {
        console.log("Gagal mengambil rating produk:", err);

        if (!mounted) return;

        setReviewSummary({
          averageRating: 0,
          totalReviews: 0,
        });
      }
    };

    fetchReviewSummary();

    return () => {
      mounted = false;
    };
  }, [product?.id]);

  const categoryName =
    product.categoryName ||
    product.category?.name ||
    (typeof product.category === "string"
      ? product.category
      : "Tanpa Kategori");

  const rawImage =
    product.imageUrl || product.image || product.photo || product.thumbnail;

  const imageUrl = rawImage
    ? String(rawImage).startsWith("http")
      ? rawImage
      : `${productBaseUrl}${rawImage}`
    : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

  const averageRating = useMemo(() => {
    return Number(reviewSummary.averageRating || 0);
  }, [reviewSummary.averageRating]);

  const totalReviews = useMemo(() => {
    return Number(reviewSummary.totalReviews || 0);
  }, [reviewSummary.totalReviews]);

  return (
    <div className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-slate-800 sm:rounded-3xl sm:p-5">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-52 sm:rounded-2xl">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-105 sm:rounded-2xl"
        />
      </div>

      <div className="mt-2.5 min-w-0 sm:mt-5">
        <h3 className="line-clamp-2 min-h-[34px] break-words text-xs font-black leading-snug text-slate-950 dark:text-white sm:min-h-[52px] sm:text-lg">
          {product.name}
        </h3>

        <p className="mt-1 truncate text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-sm">
          {categoryName}
        </p>

        <div className="mt-2 flex min-w-0 flex-col gap-2 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-950/70 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Star
              size={15}
              className={
                averageRating > 0
                  ? "shrink-0 fill-yellow-400 text-yellow-400"
                  : "shrink-0 text-slate-300 dark:text-slate-600"
              }
            />

            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 sm:text-sm">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>

            <span className="hidden text-[11px] font-semibold text-slate-400 sm:inline">
              / 5
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">
            <MessageSquareText size={13} className="shrink-0" />
            <span className="truncate">{totalReviews} ulasan</span>
          </div>
        </div>

        <p className="mt-2 break-words text-xs font-black text-blue-600 dark:text-blue-400 sm:mt-4 sm:text-lg">
          Rp {Number(product.price || 0).toLocaleString("id-ID")}
        </p>

        <Link
          to={`/products/${product.id}`}
          className="mt-3 block rounded-lg border-2 border-blue-600 py-2 text-center text-[11px] font-black text-blue-600 transition hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white sm:mt-5 sm:rounded-xl sm:py-3 sm:text-sm"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
