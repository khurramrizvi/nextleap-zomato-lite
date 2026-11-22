"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StarIcon } from "@/components/StarIcon";

export default function WriteReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRestaurant() {
      setLoadingName(true);
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (active) setRestaurantName(json.name);
        }
      } finally {
        if (active) setLoadingName(false);
      }
    }

    loadRestaurant();
    return () => {
      active = false;
    };
  }, [restaurantId]);

  const canSubmit =
    rating !== null && comment.trim().length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  if (loadingName) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-14 space-y-8">
        <div className="h-8 w-52 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-10 w-44 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-32 w-full rounded-md bg-[var(--surface)] animate-pulse" />
      </main>
    );
  }

  if (notFound || !restaurantName) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Restaurant not found
        </h1>
        <p className="text-sm text-[var(--muted)]">
          We could not find the restaurant you want to review.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-[560px] mx-auto px-5 py-14 space-y-8">
      <header className="space-y-2">
        <Link
          href={`/restaurant/${restaurantId}`}
          className="inline-block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Back to restaurant
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {restaurantName}
        </h1>
        <p className="text-sm text-[var(--muted)]">Write a review</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <span className="block text-sm font-medium text-[var(--foreground)]">
            Rating
          </span>
          <div
            className="flex items-center gap-2"
            role="radiogroup"
            aria-label="Star rating"
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = rating !== null && value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  onClick={() => setRating(value)}
                  className={`p-1.5 rounded-md transition-transform active:scale-[0.95] cursor-pointer ${
                    selected
                      ? "text-[var(--accent)] bg-[var(--surface)]"
                      : "text-[#c8c4bc] hover:text-[var(--muted)]"
                  }`}
                >
                  <StarIcon filled={selected} className="w-7 h-7" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Comment
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the food and service?"
            className="w-full rounded-md border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3.5 py-2.5 text-sm text-[#991b1b]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#faf9f6] transition-transform active:scale-[0.98] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </main>
  );
}
