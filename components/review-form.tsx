"use client";

import { useState } from "react";
import { Star, Loader2, Send, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  productId: string;
  /** null means not logged in */
  isLoggedIn: boolean;
  /** user has a completed order that contains this product */
  canReview: boolean;
  /** user already submitted a review for this product */
  alreadyReviewed: boolean;
}

export default function ReviewForm({
  productId,
  isLoggedIn,
  canReview,
  alreadyReviewed,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  // ── Not logged in → silent (reviews still visible above, no form) ─────────
  if (!isLoggedIn) return null;

  // ── Already reviewed ──────────────────────────────────────────────────────
  if (alreadyReviewed || submitted) {
    return (
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-2">
        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-emerald-700 font-medium">
          Anda sudah memberikan ulasan untuk produk ini.
        </p>
      </div>
    );
  }

  // ── Haven't bought this product ───────────────────────────────────────────
  if (!canReview) {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-2">
        <ShoppingBag className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-700 font-medium">
          Anda harus membeli produk ini terlebih dahulu untuk memberikan ulasan.
        </p>
      </div>
    );
  }

  // ── Can review → show form ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating bintang terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan ulasan.");
        return;
      }
      setSubmitted(true);
      // Reload to show new review in the list
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
      <h3 className="font-bold text-text-main text-sm">Tulis Ulasanmu</h3>

      {/* Star selector */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`Rating ${star}`}
            >
              <Star
                size={24}
                fill={(hover || rating) >= star ? "#f59e0b" : "none"}
                color={(hover || rating) >= star ? "#f59e0b" : "#d1d5db"}
                strokeWidth={1.5}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-bold text-amber-500">
              {["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-comment" className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Komentar <span className="font-normal normal-case">(opsional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalamanmu dengan produk ini..."
          rows={3}
          maxLength={500}
          className="w-full text-sm border border-border-soft rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-gray-50/50 transition-colors"
        />
        <p className="text-[10px] text-text-muted text-right">{comment.length}/500</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="self-start flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
      >
        {submitting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Send size={15} />
        )}
        {submitting ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
