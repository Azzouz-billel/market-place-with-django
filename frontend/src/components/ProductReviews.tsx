"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import Stars from "@/components/Stars";
import type { Review } from "@/types/catalog";

export default function ProductReviews({
  slug,
  initialAverage,
  initialCount,
}: {
  slug: string;
  initialAverage: number | null;
  initialCount: number;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${slug}/reviews`);
        setReviews(res.ok ? await res.json() : []);
      } catch {
        setReviews([]);
      }
    })();
  }, [slug]);

  const count = reviews ? reviews.length : initialCount;
  const average =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : initialAverage;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Could not submit your review.");
      return;
    }
    setComment("");
    const refreshed = await fetch(`/api/products/${slug}/reviews`);
    if (refreshed.ok) {
      setReviews(await refreshed.json());
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Reviews</h2>
        {count > 0 && average !== null && (
          <span className="flex items-center gap-2 text-sm text-muted">
            <Stars rating={average} />
            {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-base border border-border bg-card p-4">
          <p className="text-sm font-medium">Write a review</p>
          <div className="flex items-center gap-2">
            <label htmlFor="review-rating" className="text-sm text-muted">Rating</label>
            <select
              id="review-rating"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="rounded-base border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Share your thoughts (optional)"
            className="rounded-base border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-base bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <Link href="/login" className="text-accent underline-offset-4 hover:underline">Sign in</Link> to
          write a review.
        </p>
      )}

      {reviews === null ? (
        <p className="text-muted">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted">No reviews yet — be the first.</p>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} className="text-sm" />
                <span className="text-sm font-medium">{review.author}</span>
                <span className="text-xs text-muted">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && <p className="text-sm text-muted">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
