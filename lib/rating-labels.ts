export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Average",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

/**
 * Maps a numeric rating (1 to 5, including decimal averages) to its category label.
 */
export function getRatingLabel(rating: number | null): string | null {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }
  const rounded = Math.min(5, Math.max(1, Math.round(rating)));
  return RATING_LABELS[rounded] ?? null;
}
