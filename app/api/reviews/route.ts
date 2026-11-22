import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // 1. Validate rating is a whole number between 1 and 5
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // 2. Validate comment is a non-empty string after trimming whitespace
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 }
    );
  }

  // 3. Validate restaurantId refers to an existing restaurant
  if (
    typeof restaurantId !== "number" ||
    !Number.isInteger(restaurantId) ||
    restaurantId <= 0
  ) {
    return NextResponse.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }

  const sql = getSql();
  const restaurants = await sql`
    SELECT id FROM restaurants WHERE id = ${restaurantId}
  `;

  if (restaurants.length === 0) {
    return NextResponse.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }

  const trimmedComment = comment.trim();
  const inserted = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${trimmedComment})
    RETURNING id
  `;

  return NextResponse.json(
    { success: true, reviewId: Number(inserted[0].id) },
    { status: 201 }
  );
}
