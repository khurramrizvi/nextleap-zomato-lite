"use client";

import { useEffect, useRef, useState, FormEvent, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StarIcon } from "@/components/StarIcon";
import { RATING_LABELS } from "@/lib/rating-labels";

const JUST_POSTED_KEY = "zomato-lite:just-posted";
const CELEBRATION_MS = 2000;

const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--confetti-mustard)",
  "var(--confetti-herb)",
  "var(--foreground)",
  "var(--accent-hover)",
];

/** Deterministic burst so server and client render the same pieces. */
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2 + ((i * 7) % 5) * 0.09;
  const distance = 78 + ((i * 37) % 70);
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance * 0.85 - 34),
    rot: ((i * 83) % 540) - 270,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 6 + ((i * 5) % 5),
    height: i % 3 === 0 ? 6 + ((i * 5) % 5) : 4,
    round: i % 3 === 0,
    delay: 300 + ((i * 13) % 90),
  };
});

export default function WriteReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantMeta, setRestaurantMeta] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    router.prefetch(`/restaurant/${restaurantId}`);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [router, restaurantId]);

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
          if (active) {
            setRestaurantName(json.name);
            setRestaurantMeta(`${json.cuisine}, ${json.area}`);
          }
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
  const activeLabel = activeStars > 0 ? RATING_LABELS[activeStars] : null;

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

      // Celebrate, then hand off to the restaurant page, which highlights the new review.
      sessionStorage.setItem(JUST_POSTED_KEY, String(restaurantId));
      setPosted(true);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      redirectTimer.current = setTimeout(
        () => router.push(`/restaurant/${restaurantId}`),
        reducedMotion ? 1100 : CELEBRATION_MS
      );
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
        <div className="h-24 w-full rounded-2xl bg-[var(--surface)] animate-pulse" />
        <div className="h-36 w-full rounded-xl bg-[var(--surface)] animate-pulse" />
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
    <main className="max-w-[560px] mx-auto px-5 py-14 sm:py-20 space-y-10">
      <header className="rise space-y-3">
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
          {restaurantMeta && (
            <p className="text-[15px] text-[var(--muted)]">{restaurantMeta}</p>
          )}
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className={`rise relative rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 sm:p-7 ${
          posted ? "card-celebrate" : ""
        }`}
        style={{ "--i": 1.5 } as CSSProperties}
      >
        <div
          inert={posted}
          className={`space-y-8 transition-[opacity,transform,filter] duration-300 ease-out ${
            posted ? "opacity-0 scale-[0.96] blur-[3px]" : ""
          }`}
        >
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-4 min-h-[28px]">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Your rating
            </span>
            {activeLabel ? (
              <span className="inline-flex items-center gap-2">
                <span
                  key={activeLabel}
                  className="pop-in rounded-md bg-[var(--accent-soft)] px-2.5 py-0.5 text-sm font-medium text-[var(--accent)]"
                  style={{ animationDuration: "260ms" }}
                >
                  {activeLabel}
                </span>
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {activeStars} of 5
                </span>
              </span>
            ) : (
              <span className="text-sm text-[var(--muted)]">
                Select 1 to 5 stars
              </span>
            )}
          </div>

          <div
            className="grid grid-cols-5 gap-2 rounded-xl bg-[var(--surface)] p-2"
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
                  aria-label={`${value} ${value === 1 ? "star" : "stars"} — ${RATING_LABELS[value]}`}
                  onMouseEnter={() => setHoveredRating(value)}
                  onClick={() => setRating(value)}
                  className={`relative min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-lg transition-[scale,translate,background-color,color] duration-150 hover:-translate-y-0.5 active:scale-[0.9] cursor-pointer ${
                    isSelected
                      ? "text-[var(--accent)] bg-[var(--surface-raised)]"
                      : isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--star-empty)] hover:text-[var(--muted)]"
                  }`}
                >
                  {/* Re-keyed on every pick so the selected stars pop in sequence */}
                  <span
                    key={isSelected ? `on-${rating}` : "off"}
                    className={isSelected ? "star-pop" : "inline-flex"}
                    style={{ "--i": value - 1 } as CSSProperties}
                  >
                    <StarIcon filled={isActive} className="w-6 h-6" />
                  </span>
                  {rating === value && <span aria-hidden="true" className="burst" />}
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
            className="w-full min-h-[132px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] transition-colors focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="shake rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/30 px-4 py-3 text-sm text-[var(--accent-hover)]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2.5 min-h-[44px] w-full rounded-lg bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--background)] transition-[scale,background-color,opacity] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              aria-hidden="true"
              className="spinner w-4 h-4"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          )}
          {submitting ? "Posting your review" : "Submit review"}
        </button>
        </div>

        {posted && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center"
          >
            <div className="relative w-[76px] h-[76px]">
              <span aria-hidden="true" className="success-ring" />
              <span
                aria-hidden="true"
                className="success-ring"
                style={{ "--delay": "480ms" } as CSSProperties}
              />
              {CONFETTI.map((piece, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="confetti"
                  style={
                    {
                      "--dx": `${piece.dx}px`,
                      "--dy": `${piece.dy}px`,
                      "--rot": `${piece.rot}deg`,
                      "--delay": `${piece.delay}ms`,
                      width: piece.width,
                      height: piece.height,
                      backgroundColor: piece.color,
                      borderRadius: piece.round ? 9999 : 1.5,
                    } as CSSProperties
                  }
                />
              ))}
              <div className="success-badge relative flex h-full w-full items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="w-9 h-9"
                >
                  <path
                    className="check-draw"
                    pathLength={1}
                    d="M5 12.5l4.5 4.5L19 7.5"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2.5">
              <h2
                className="rise font-[family-name:var(--font-besley)] text-2xl font-medium tracking-[-0.02em] text-[var(--foreground)]"
                style={{ "--base-delay": "520ms" } as CSSProperties}
              >
                Review posted
              </h2>
              <div
                className="flex items-center justify-center gap-1.5 text-[var(--accent)]"
                aria-label={`${rating} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <span
                    key={value}
                    className="star-pop"
                    style={
                      { "--i": value - 1, "--base-delay": "720ms" } as CSSProperties
                    }
                  >
                    <StarIcon
                      filled={rating !== null && value <= rating}
                      className={`w-5 h-5 ${
                        rating !== null && value <= rating
                          ? ""
                          : "text-[var(--star-empty)]"
                      }`}
                    />
                  </span>
                ))}
              </div>
              <p
                className="rise text-sm text-[var(--muted)]"
                style={{ "--base-delay": "1000ms" } as CSSProperties}
              >
                Thank you. Taking you back to {restaurantName}.
              </p>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
