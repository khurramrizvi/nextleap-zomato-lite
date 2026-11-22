import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL. Add it to .env or .env.local first.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "db", "schema.sql"),
      "utf8"
    );
    const seedSql = fs.readFileSync(
      path.join(process.cwd(), "db", "seed.sql"),
      "utf8"
    );

    await pool.query("DROP TABLE IF EXISTS reviews, restaurants CASCADE;");
    await pool.query(schemaSql);
    await pool.query(seedSql);

    const restaurants = await pool.query("SELECT * FROM restaurants ORDER BY id;");
    const reviews = await pool.query("SELECT * FROM reviews ORDER BY id;");

    console.log("Restaurants:", restaurants.rows);
    console.log("Reviews:", reviews.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
