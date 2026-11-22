"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  ratingLabel: string | null;
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
    <div
      className="inline-flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon
          key={value}
          filled={value <= rating}
          className={`w-4 h-4 ${
            value <= rating
              ? "text-[var(--accent)]"
              : "text-[var(--star-empty)]"
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
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-10">
        <div className="space-y-2.5">
          <div className="h-9 w-60 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-4 w-36 rounded bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="aspect-[3/2] w-full rounded-xl bg-[var(--surface)] animate-pulse" />
        <div className="h-20 w-44 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-32 w-full rounded-xl bg-[var(--surface)] animate-pulse" />
        <div className="space-y-4">
          <div className="h-16 w-full rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-16 w-full rounded bg-[var(--surface)] animate-pulse" />
        </div>
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="max-w-[560px] mx-auto px-5 py-16 space-y-4">
        <h1 className="font-[family-name:var(--font-besley)] text-3xl font-medium tracking-[-0.02em] text-[var(--foreground)]">
          Restaurant not found
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          There is no restaurant listed at this address. Check the link and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-[560px] mx-auto px-5 py-14 sm:py-20 space-y-12 enter-quiet">
      {/* 1. Restaurant name, with cuisine and area underneath */}
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-besley)] text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-[1.15] text-[var(--foreground)]">
          {data.name}
        </h1>
        <p className="text-[15px] text-[var(--muted)]">
          {data.cuisine}, {data.area}
        </p>
      </header>

      {/* Static restaurant photograph */}
      <div className="overflow-hidden rounded-xl bg-[var(--surface)] aspect-[3/2] relative">
        <Image
          src="/images/ludhiana-burrito.jpg"
          alt={`Charred paneer burrito served with mint chutney at ${data.name}`}
          fill
          priority
          sizes="(max-width: 600px) 100vw, 560px"
          className="object-cover transition-transform duration-300 ease-out hover:scale-[1.02]"
        />
      </div>

      {/* 2. Average rating (largest element) + category + review count */}
      {data.averageRating !== null && (
        <section
          aria-label="Average rating"
          className="flex items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6"
        >
          <span className="font-[family-name:var(--font-besley)] text-[4.25rem] sm:text-[4.75rem] font-medium tracking-[-0.03em] tabular-nums leading-none text-[var(--foreground)]">
            {data.averageRating}
          </span>
          <div className="space-y-1">
            {data.ratingLabel && (
              <span className="inline-block rounded-md bg-[var(--accent-soft)] px-2.5 py-0.5 text-sm font-medium text-[var(--accent)]">
                {data.ratingLabel}
              </span>
            )}
            <p className="text-sm text-[var(--muted)]">
              out of 5, based on {data.totalReviews}{" "}
              {data.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </section>
      )}

      {/* 3 & 4. Latest review highlighted, older reviews below, or empty state */}
      {data.latestReview === null ? (
        <section className="rounded-xl bg-[var(--surface)] p-7 space-y-5">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-besley)] text-xl font-medium text-[var(--foreground)]">
              No reviews yet
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--muted)]">
              Nobody has rated {data.name} yet. Leave the first review after your meal.
            </p>
          </div>
          <Link
            href={`/review/${id}`}
            className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[transform,background-color] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
          >
            Write the first review
          </Link>
        </section>
      ) : (
        <div className="space-y-10">
          {/* 3. Latest review, visually highlighted by tonal shift and type scale */}
          <section
            aria-label="Latest review"
            className="rounded-xl bg-[var(--surface)] p-6 sm:p-7 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[var(--accent)]">
                Latest review
              </span>
              <time
                dateTime={data.latestReview.createdAt}
                className="text-xs text-[var(--muted)]"
              >
                {formatDate(data.latestReview.createdAt)}
              </time>
            </div>
            <RatingStars rating={data.latestReview.rating} />
            <p className="text-lg leading-[1.6] text-[var(--foreground)]">
              {data.latestReview.comment}
            </p>
          </section>

          {/* 4. Older reviews below, in a plain list */}
          {data.reviews.length > 0 && (
            <section aria-label="Earlier reviews" className="space-y-5">
              <h2 className="text-sm font-medium text-[var(--muted)]">
                Earlier reviews
              </h2>
              <ul className="space-y-6">
                {data.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="pt-6 first:pt-0 border-t first:border-t-0 border-[var(--border)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <RatingStars rating={review.rating} />
                      <time
                        dateTime={review.createdAt}
                        className="text-xs text-[var(--muted)]"
                      >
                        {formatDate(review.createdAt)}
                      </time>
                    </div>
                    <p className="text-[15px] leading-relaxed text-[var(--foreground)]">
                      {review.comment}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 5. Link to /review/[id] */}
          <div className="pt-2">
            <Link
              href={`/review/${id}`}
              className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto rounded-lg bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[transform,background-color] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
            >
              Write a review
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
