"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StarIcon } from "@/components/StarIcon";

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RestaurantData {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon
          key={value}
          filled={value <= rating}
          className={`w-4 h-4 ${
            value <= rating ? "text-[var(--accent)]" : "text-[#d6d3cd]"
          }`}
        />
      ))}
    </div>
  );
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/restaurants/${id}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load restaurant");
        }
        const json: RestaurantData = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-14 space-y-10">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-4 w-36 rounded bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="h-16 w-40 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-28 w-full rounded-lg bg-[var(--surface)] animate-pulse" />
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Restaurant not found
        </h1>
        <p className="text-sm text-[var(--muted)]">
          We could not find a restaurant at this address.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-[560px] mx-auto px-5 py-14 space-y-10">
      {/* 1. Restaurant name, with cuisine and area underneath */}
      <header className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {data.name}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {data.cuisine} · {data.area}
        </p>
      </header>

      {/* 2. Average rating (largest element) + review count */}
      {data.averageRating !== null ? (
        <section aria-label="Overall rating" className="flex items-baseline gap-3">
          <span className="text-6xl font-semibold tracking-tight tabular-nums leading-none text-[var(--foreground)]">
            {data.averageRating}
          </span>
          <span className="text-sm text-[var(--muted)]">
            out of 5 · {data.totalReviews}{" "}
            {data.totalReviews === 1 ? "review" : "reviews"}
          </span>
        </section>
      ) : null}

      {/* 3 & 4. Latest review highlighted, older reviews below, or empty state */}
      {data.latestReview === null ? (
        <section className="rounded-lg bg-[var(--surface)] p-6 space-y-4">
          <p className="text-base text-[var(--foreground)]">
            No reviews yet for {data.name}.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Be the first to share what you ordered and how it was.
          </p>
          <Link
            href={`/review/${id}`}
            className="inline-block rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#faf9f6] transition-transform active:scale-[0.98] hover:bg-[var(--accent-hover)]"
          >
            Write the first review
          </Link>
        </section>
      ) : (
        <div className="space-y-8">
          {/* 3. Latest review, visually highlighted */}
          <section
            aria-label="Latest review"
            className="rounded-lg bg-[var(--surface)] border-l-2 border-[var(--accent)] p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
                Latest review
              </span>
              <span className="text-xs text-[var(--muted)]">
                {formatDate(data.latestReview.createdAt)}
              </span>
            </div>
            <RatingStars rating={data.latestReview.rating} />
            <p className="text-base leading-relaxed text-[var(--foreground)]">
              {data.latestReview.comment}
            </p>
          </section>

          {/* 4. Older reviews below, in a plain list */}
          {data.reviews.length > 0 && (
            <section aria-label="Earlier reviews" className="space-y-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Earlier reviews
              </h2>
              <ul className="divide-y divide-[var(--border)]">
                {data.reviews.map((review) => (
                  <li key={review.id} className="py-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <RatingStars rating={review.rating} />
                      <span className="text-xs text-[var(--muted)]">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]">
                      {review.comment}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 5. Link to /review/[id] */}
          <div>
            <Link
              href={`/review/${id}`}
              className="inline-block rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#faf9f6] transition-transform active:scale-[0.98] hover:bg-[var(--accent-hover)]"
            >
              Write a review
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
