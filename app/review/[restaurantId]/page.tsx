"use client";

import { useEffect, useRef, useState, FormEvent, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StarIcon } from "@/components/StarIcon";
import { RATING_LABELS } from "@/lib/rating-labels";

const JUST_POSTED_KEY = "zomato-lite:just-posted";
const CELEBRATION_MS = 2000;
const PHOTO_SRC = "/images/ludhiana-burrito.jpg";

/** One line of encouragement under the label for each star value. */
const RATING_HINTS: Record<number, string> = {
  1: "Sorry to hear that. Tell us what went wrong.",
  2: "Not quite there. What let it down?",
  3: "A decent meal. What would make it better?",
  4: "Glad you enjoyed it. What stood out?",
  5: "A favourite. What made it special?",
};

const COMMENT_PLACEHOLDERS: Record<number, string> = {
  1: "What went wrong with the food or service?",
  2: "What let the meal down?",
  3: "What worked, and what could be better?",
  4: "What did you enjoy most?",
  5: "What made this meal special?",
};

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

  // Tells the reviewer what is still missing before the button unlocks.
  const submitHint =
    rating === null
      ? "Pick a star rating to continue"
      : comment.trim().length === 0
        ? "Add a few words about your visit"
        : null;

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
      <main className="max-w-[560px] mx-auto px-5 py-10 sm:py-16 space-y-8">
        <div className="space-y-5">
          <div className="h-11 w-44 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-[34px] sm:h-[40px] w-64 rounded bg-[var(--surface)] animate-pulse" />
          <div className="h-14 w-60 rounded-xl bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="h-[520px] w-full rounded-2xl bg-[var(--surface)] animate-pulse" />
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
    <main className="max-w-[560px] mx-auto px-5 py-10 sm:py-16 space-y-8">
      <header className="space-y-5">
        <Link
          href={`/restaurant/${restaurantId}`}
          className="rise inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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

        <h1
          aria-label="How was your meal?"
          className="font-[family-name:var(--font-besley)] text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-[1.15] text-[var(--foreground)]"
        >
          {["How", "was", "your", "meal?"].map((word, index) => (
            <span key={word} aria-hidden="true">
              <span className="word-mask">
                <span className="word-up" style={{ "--i": index } as CSSProperties}>
                  {word}
                </span>
              </span>{" "}
            </span>
          ))}
        </h1>

        {/* What is being reviewed: photo, name, cuisine and area */}
        <div
          className="rise flex items-center gap-3.5"
          style={{ "--i": 2 } as CSSProperties}
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
            <Image
              src={PHOTO_SRC}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-[var(--foreground)]">
              {restaurantName}
            </p>
            {restaurantMeta && (
              <p className="truncate text-sm text-[var(--muted)]">
                {restaurantMeta}
              </p>
            )}
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className={`rise relative rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] ${
          posted ? "card-celebrate" : ""
        }`}
        style={{ "--i": 3.5 } as CSSProperties}
      >
        <div
          inert={posted}
          className={`transition-[opacity,scale] duration-300 ease-out ${
            posted ? "opacity-0 scale-[0.96]" : ""
          }`}
        >
          {/* 1. Rating: large stars with the label spelled out underneath */}
          <div className="px-5 pt-8 pb-7 sm:px-7 sm:pt-10 sm:pb-8 text-center">
            <div
              className="flex justify-center gap-1 sm:gap-2"
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
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}, ${RATING_LABELS[value]}`}
                    onMouseEnter={() => setHoveredRating(value)}
                    onClick={() => setRating(value)}
                    className={`relative flex aspect-square max-w-[60px] flex-1 items-center justify-center rounded-full transition-[scale,translate,color] duration-150 hover:-translate-y-1 active:scale-[0.85] cursor-pointer ${
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--star-empty)]"
                    }`}
                  >
                    {/* Re-keyed on every pick so the selected stars pop in sequence */}
                    <span
                      key={isSelected ? `on-${rating}` : "off"}
                      className={isSelected ? "star-pop" : "inline-flex"}
                      style={{ "--i": value - 1 } as CSSProperties}
                    >
                      <StarIcon
                        filled={isActive}
                        className="h-10 w-10 sm:h-11 sm:w-11"
                      />
                    </span>
                    {rating === value && (
                      <span aria-hidden="true" className="burst" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 min-h-[62px] space-y-1" aria-live="polite">
              <p
                key={activeLabel ?? "empty"}
                className={`font-[family-name:var(--font-besley)] text-2xl font-medium tracking-[-0.01em] ${
                  activeLabel
                    ? "pop-in text-[var(--accent)]"
                    : "text-[var(--foreground)]"
                }`}
                style={{ animationDuration: "240ms" }}
              >
                {activeLabel ?? "Tap a star to rate"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {activeStars > 0
                  ? RATING_HINTS[activeStars]
                  : "From 1 for poor to 5 for excellent."}
              </p>
            </div>
          </div>

          {/* 2. Written review and submit */}
          <div className="space-y-5 border-t border-[var(--border)] px-5 py-6 sm:px-7 sm:py-7">
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
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  rating !== null
                    ? COMMENT_PLACEHOLDERS[rating]
                    : "How was the food and service?"
                }
                className="block w-full min-h-[148px] resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-base leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-soft)]"
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

            <div className="space-y-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2.5 min-h-[52px] w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-medium text-[var(--background)] transition-[scale,background-color,opacity] duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                {submitting ? "Posting your review" : "Post review"}
              </button>
              <p
                aria-live="polite"
                className="text-center text-sm text-[var(--muted)] empty:hidden"
              >
                {submitHint}
              </p>
            </div>
          </div>
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
