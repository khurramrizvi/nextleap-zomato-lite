import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getRatingLabel } from "@/lib/rating-labels";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 404 }
    );
  }

  const sql = getSql();

  const restaurants = await sql`
    SELECT id, name, cuisine, area
    FROM restaurants
    WHERE id = ${restaurantId}
  `;

  if (restaurants.length === 0) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 404 }
    );
  }

  const restaurant = restaurants[0];

  const statsRows = await sql`
    SELECT
      ROUND(AVG(rating), 1)::float AS average_rating,
      COUNT(*)::int AS total_reviews
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `;

  const reviewRows = await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC, id DESC
  `;

  const stats = statsRows[0];
  const averageRating =
    stats.average_rating !== null && stats.average_rating !== undefined
      ? Number(stats.average_rating)
      : null;
  const ratingLabel = getRatingLabel(averageRating);
  const totalReviews = Number(stats.total_reviews ?? 0);

  const formattedReviews = reviewRows.map((row) => ({
    id: Number(row.id),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }));

  const [latestReview = null, ...olderReviews] = formattedReviews;

  return NextResponse.json({
    name: String(restaurant.name),
    cuisine: String(restaurant.cuisine),
    area: String(restaurant.area),
    averageRating,
    ratingLabel,
    totalReviews,
    latestReview,
    reviews: olderReviews,
  });
}
