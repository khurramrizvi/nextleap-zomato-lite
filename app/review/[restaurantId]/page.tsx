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
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
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

  const activeStars = hoveredRating ?? rating ?? 0;

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
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-9 w-56 rounded bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="h-12 w-56 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-32 w-full rounded-lg bg-[var(--surface)] animate-pulse" />
      </main>
    );
  }

  if (notFound || !restaurantName) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-4">
        <h1 className="font-[family-name:var(--font-besley)] text-3xl font-medium tracking-[-0.02em] text-[var(--foreground)]">
          Restaurant not found
        </h1>
        <p className="text-base text-[var(--muted)]">
          We could not find the restaurant you want to review.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-[560px] mx-auto px-5 py-14 sm:py-20 space-y-10 enter-quiet">
      <header className="space-y-3">
        <Link
          href={`/restaurant/${restaurantId}`}
          className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-4 h-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to {restaurantName}
        </Link>
        <div className="space-y-1.5">
          <h1 className="font-[family-name:var(--font-besley)] text-3xl font-medium tracking-[-0.02em] leading-[1.2] text-[var(--foreground)]">
            {restaurantName}
          </h1>
          <p className="text-[15px] text-[var(--muted)]">
            Share your rating and review
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Rating
            </span>
            <span className="text-sm text-[var(--muted)] tabular-nums">
              {rating !== null ? `${rating} of 5` : "Pick 1 to 5 stars"}
            </span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface)] p-1.5"
            role="radiogroup"
            aria-label="Star rating"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const isSelected = rating !== null && value <= rating;
              const isActive = value <= activeStars;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  onMouseEnter={() => setHoveredRating(value)}
                  onClick={() => setRating(value)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-[transform,background-color,color] duration-150 active:scale-[0.94] cursor-pointer ${
                    isSelected
                      ? "text-[var(--accent)] bg-[var(--surface-raised)]"
                      : isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--star-empty)] hover:text-[var(--muted)]"
                  }`}
                >
                  <StarIcon filled={isActive} className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Your review
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the food and service?"
            className="w-full min-h-[128px] rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/30 px-4 py-3 text-sm text-[var(--accent-hover)]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto rounded-lg bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[transform,background-color,opacity] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </main>
  );
}
