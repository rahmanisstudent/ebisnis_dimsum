"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  productId: string;
  userId: string;
  orderId: string;
}

export default function OrderItemReview({ productId, userId, orderId }: Props) {
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkReview() {
      // Find review for this product, user, and potentially this order if we track order_id.
      // But standard schema reviews table is: product_id, user_id, rating, comment.
      // Let's filter by product_id and user_id.
      const { data, error } = await supabase
        .from("reviews")
        .select("rating, comment")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setExistingReview(data[0]);
      }
      setLoading(false);
    }
    checkReview();
  }, [productId, userId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setExistingReview({ rating, comment });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  if (loading) {
    return <Loader2 className="animate-spin text-primary shrink-0" size={14} />;
  }

  if (existingReview) {
    return (
      <div className="mt-2 bg-gray-50 border border-gray-150 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              fill={i < existingReview.rating ? "currentColor" : "none"}
              className={i < existingReview.rating ? "" : "text-gray-300"}
            />
          ))}
          <span className="text-[10px] text-text-muted font-bold ml-1">Ulasan Anda</span>
        </div>
        {existingReview.comment && (
          <p className="text-xs text-text-main italic font-medium">"{existingReview.comment}"</p>
        )}
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-2 text-xs font-bold text-primary hover:text-primary-dark transition-colors border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-lg bg-primary-light/50 w-fit"
      >
        ⭐ Tulis Ulasan
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-cream/30 border border-border-soft rounded-2xl p-4 flex flex-col gap-3">
      <div>
        <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold mb-1.5">Beri Rating</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = hoverRating !== null ? star <= hoverRating : star <= rating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="text-amber-400 hover:scale-110 active:scale-95 transition-all p-0.5"
              >
                <Star size={20} fill={isFilled ? "currentColor" : "none"} className={isFilled ? "" : "text-gray-300"} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="review_comment" className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Komentar</label>
        <textarea
          id="review_comment"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bagikan pengalaman rasa dimsum ini..."
          className="w-full border border-border-soft rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-text-main placeholder:text-gray-400"
        />
      </div>

      {error && (
        <p className="text-red-500 text-[10px] font-semibold">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark disabled:bg-primary-light text-white font-bold py-2 rounded-xl text-xs transition-all"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Kirim Ulasan
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-border-soft text-text-muted hover:text-text-main hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
