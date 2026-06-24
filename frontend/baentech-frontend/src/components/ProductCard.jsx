import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MessageSquareText, Package, Star } from "lucide-react";

import { getProductReviewSummaryApi } from "../api/productApi";
import { getProductImageUrl, getProductRawImage } from "../utils/productImage";

function ProductCard({ product }) {
  const productBaseUrl =
    import.meta.env.VITE_PRODUCT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "";

  const [imageFailed, setImageFailed] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: Number(
      product.averageRating || product.ratingAverage || product.rating || 0,
    ),
    totalReviews: Number(
      product.totalReviews || product.reviewCount || product.reviewsCount || 0,
    ),
  });

  useEffect(() => {
    setImageFailed(false);
  }, [product?.id, product?.imageUrl]);

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

  const rawImage = getProductRawImage(product);
  const imageUrl = getProductImageUrl(rawImage, productBaseUrl);
  const showImage = imageUrl && !imageFailed;

  const averageRating = useMemo(() => {
    return Number(reviewSummary.averageRating || 0);
  }, [reviewSummary.averageRating]);

  const totalReviews = useMemo(() => {
    return Number(reviewSummary.totalReviews || 0);
  }, [reviewSummary.totalReviews]);

  const hasStockValue =
    product.stock !== undefined && product.stock !== null && product.stock !== "";
  const stockValue = Number(product.stock || 0);
  const stockLabel = hasStockValue
    ? stockValue > 0
      ? `Stok ${stockValue}`
      : "Habis"
    : "Ready";
  const stockTone = hasStockValue && stockValue <= 0 ? "danger" : "success";

  return (
    <div className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/95 p-2.5 shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-2xl hover:shadow-blue-100/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 dark:hover:border-blue-600 dark:hover:bg-slate-800 sm:rounded-[1.75rem] sm:p-4">
      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 sm:h-52">
        <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-300/30 blur-2xl" />
          <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
        </div>

        {showImage ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImageFailed(true)}
            className="relative z-10 h-full w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <Package size={36} />
            <span className="text-[10px] font-black uppercase tracking-wide sm:text-xs">
              No Image
            </span>
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 z-20 max-w-[65%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-950/85 dark:text-slate-200 dark:ring-slate-800 sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
          {categoryName}
        </div>

        <div
          className={`absolute right-2.5 top-2.5 z-20 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide shadow-sm ring-1 backdrop-blur sm:right-3 sm:top-3 sm:px-3 sm:text-[10px] ${
            stockTone === "danger"
              ? "bg-red-50/95 text-red-600 ring-red-100 dark:bg-red-950/80 dark:text-red-300 dark:ring-red-900"
              : "bg-emerald-50/95 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:ring-emerald-900"
          }`}
        >
          {stockLabel}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-1.5 pt-3 sm:p-2 sm:pt-4">
        {product.brand && (
          <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 sm:text-[11px]">
            {product.brand}
          </p>
        )}

        <h3 className="line-clamp-2 min-h-[34px] break-words text-xs font-black leading-snug text-slate-950 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 sm:min-h-[52px] sm:text-lg">
          {product.name}
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/70 sm:mt-4 sm:px-3 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Star
              size={15}
              className={
                averageRating > 0
                  ? "shrink-0 fill-yellow-400 text-yellow-400"
                  : "shrink-0 text-slate-300 dark:text-slate-600"
              }
            />

            <span className="truncate text-[11px] font-black text-slate-800 dark:text-slate-100 sm:text-sm">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">
            <MessageSquareText size={13} className="shrink-0" />
            <span className="truncate">{totalReviews} ulasan</span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3 sm:mt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
              Harga
            </p>
            <p className="break-words text-sm font-black text-blue-600 dark:text-blue-400 sm:text-xl">
              Rp {Number(product.price || 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="mt-auto block rounded-2xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-center text-[11px] font-black text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98] dark:border-blue-500 dark:bg-blue-600 sm:mt-5 sm:py-3 sm:text-sm"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
