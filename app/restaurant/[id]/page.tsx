"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StarIcon } from "@/components/StarIcon";
import { RollingNumber } from "@/components/RollingNumber";

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

/** Sets the stagger index (and optional base delay) read by the motion classes. */
function stagger(i: number, baseDelayMs = 0): CSSProperties {
  return { "--i": i, "--base-delay": `${baseDelayMs}ms` } as CSSProperties;
}

function RatingStars({
  rating,
  baseDelayMs,
}: {
  rating: number;
  /** When set, the stars pop in one after another starting at this delay. */
  baseDelayMs?: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={baseDelayMs !== undefined ? "star-pop" : "inline-flex"}
          style={
            baseDelayMs !== undefined ? stagger(value - 1, baseDelayMs) : undefined
          }
        >
          <StarIcon
            filled={value <= rating}
            className={`w-4 h-4 ${
              value <= rating
                ? "text-[var(--accent)]"
                : "text-[var(--star-empty)]"
            }`}
          />
        </span>
      ))}
    </div>
  );
}

const JUST_POSTED_KEY = "zomato-lite:just-posted";
const PHOTO_SRC = "/images/ludhiana-burrito.jpg";
const PHOTO_SIZES = "(max-width: 600px) 100vw, 560px";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justPosted, setJustPosted] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const earlierListRef = useRef<HTMLUListElement>(null);

  // Arriving straight from a submitted review: let the new review announce itself.
  useEffect(() => {
    if (sessionStorage.getItem(JUST_POSTED_KEY) !== id) return;
    setJustPosted(true);
    // Deferred so React's double-invoked dev effects both see the flag.
    const timer = setTimeout(() => sessionStorage.removeItem(JUST_POSTED_KEY), 0);
    return () => clearTimeout(timer);
  }, [id]);

  // Reveal earlier reviews as they scroll into view, staggered per batch.
  useEffect(() => {
    const list = earlierListRef.current;
    if (!list) return;
    const mountedAt = performance.now();
    const observer = new IntersectionObserver(
      (entries) => {
        // Rows visible on first paint wait for the sections above them.
        const base = performance.now() - mountedAt < 400 ? 380 : 0;
        let n = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.animationDelay = `${base + Math.min(n, 5) * 70}ms`;
          el.dataset.shown = "true";
          observer.unobserve(el);
          n += 1;
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    list.querySelectorAll<HTMLElement>(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

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
      // Same spacing and block sizes as the loaded page, so nothing jumps on swap.
      <main className="max-w-[560px] mx-auto px-5 py-14 sm:py-20 space-y-12">
        <div className="space-y-2">
          <div className="h-[35px] sm:h-[41px] w-60 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-[22px] w-36 rounded bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[var(--surface)] animate-pulse">
          {/* Starts the photo download during the data fetch. React keeps this
              same <img> when the loaded page swaps in, so it never reloads. */}
          <Image
            src={PHOTO_SRC}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes={PHOTO_SIZES}
            onLoad={() => setPhotoLoaded(true)}
            className="object-cover opacity-0"
          />
        </div>
        <div className="h-[110px] sm:h-[126px] w-full rounded-xl bg-[var(--surface)] animate-pulse" />
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
    <main className="max-w-[560px] mx-auto px-5 py-14 sm:py-20 space-y-12">
      {/* 1. Restaurant name, with cuisine and area underneath */}
      <header className="space-y-2">
        <h1
          aria-label={data.name}
          className="font-[family-name:var(--font-besley)] text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-[1.15] text-[var(--foreground)]"
        >
          {data.name.split(" ").map((word, index) => (
            <span key={index} aria-hidden="true">
              <span className="word-mask">
                <span className="word-up" style={stagger(index)}>
                  {word}
                </span>
              </span>{" "}
            </span>
          ))}
        </h1>
        <p className="rise text-[15px] text-[var(--muted)]" style={stagger(1)}>
          {data.cuisine}, {data.area}
        </p>
      </header>

      {/* Static restaurant photograph */}
      <div className="photo-reveal overflow-hidden rounded-xl bg-[var(--surface)] aspect-[3/2] relative">
        <Image
          src={PHOTO_SRC}
          alt={`Charred paneer burrito served with mint chutney at ${data.name}`}
          fill
          priority
          sizes={PHOTO_SIZES}
          onLoad={() => setPhotoLoaded(true)}
          className={`photo-settle object-cover transition-[opacity,scale] duration-500 ease-out hover:scale-[1.02] ${
            photoLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* 2. Average rating (largest element) + category + review count */}
      {data.averageRating !== null && (
        <section
          aria-label="Average rating"
          className="rise flex items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6"
          style={stagger(4)}
        >
          <span className="font-[family-name:var(--font-besley)] text-[4.25rem] sm:text-[4.75rem] font-medium tracking-[-0.03em] tabular-nums leading-none text-[var(--foreground)]">
            <RollingNumber value={data.averageRating} />
          </span>
          <div className="space-y-1">
            {data.ratingLabel && (
              <span
                className="pop-in inline-block rounded-md bg-[var(--accent-soft)] px-2.5 py-0.5 text-sm font-medium text-[var(--accent)]"
                style={{ "--delay": "950ms" } as CSSProperties}
              >
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
        <section className="rise rounded-xl bg-[var(--surface)] p-7 space-y-5" style={stagger(5)}>
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
            className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[scale,background-color] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
          >
            Write the first review
          </Link>
        </section>
      ) : (
        <div className="space-y-10">
          {/* 3. Latest review, visually highlighted by tonal shift and type scale */}
          <section
            aria-label="Latest review"
            className={`${justPosted ? "just-posted" : "rise"} rounded-xl bg-[var(--surface)] p-6 sm:p-7 space-y-4`}
            style={stagger(5)}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[var(--accent)]">
                {justPosted ? "Your review, just posted" : "Latest review"}
              </span>
              <time
                dateTime={data.latestReview.createdAt}
                className="text-xs text-[var(--muted)]"
              >
                {formatDate(data.latestReview.createdAt)}
              </time>
            </div>
            <RatingStars
              rating={data.latestReview.rating}
              baseDelayMs={justPosted ? 900 : 520}
            />
            <p className="text-lg leading-[1.6] text-[var(--foreground)]">
              {data.latestReview.comment}
            </p>
          </section>

          {/* 4. Older reviews below, in a plain list */}
          {data.reviews.length > 0 && (
            <section aria-label="Earlier reviews" className="space-y-5">
              <h2 className="rise text-sm font-medium text-[var(--muted)]" style={stagger(6)}>
                Earlier reviews
              </h2>
              <ul ref={earlierListRef} className="space-y-6">
                {data.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="reveal pt-6 first:pt-0 border-t first:border-t-0 border-[var(--border)] space-y-2.5"
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
          <div className="rise pt-2" style={stagger(7)}>
            <Link
              href={`/review/${id}`}
              className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto rounded-lg bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[scale,background-color] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98]"
            >
              Write a review
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
