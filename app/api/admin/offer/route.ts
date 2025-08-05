

import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

// GET - Fetch the latest offer
export async function GET() {
  try {
    
    await sql`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        offers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'updated_at'
          ) THEN
            ALTER TABLE offers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
        END $$;
      `;
    } catch (error) {
      console.log("Could not add updated_at column:", error.message);
    }

    const columnCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'offers' AND column_name = 'updated_at';
    `;

    const hasUpdatedAt = columnCheck.length > 0;

    const offers = await sql`
      SELECT * FROM offers ORDER BY ${
        hasUpdatedAt ? sql`updated_at` : sql`created_at`
      } DESC;
    `;
    
    if (offers.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

// POST - Create a new offer
export async function POST(request: Request) {
  try {
    const { title, startDate, endDate, offers } = await request.json();

    if (!title || !startDate || !endDate || !offers || offers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    console.log("Creating offer with data:", { title, startDate, endDate, offers });

    await sql`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        offers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Try to add updated_at column safely
    try {
      await sql`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'updated_at'
          ) THEN
            ALTER TABLE offers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
        END $$;
      `;
    } catch (error) {
      console.log("Could not add updated_at column:", error.message);
    }

    const columnCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'offers' AND column_name = 'updated_at';
    `;

    const hasUpdatedAt = columnCheck.length > 0;

    let inserted;
    if (hasUpdatedAt) {
      [inserted] = await sql`
        INSERT INTO offers (title, start_date, end_date, offers, created_at, updated_at)
        VALUES (${title}, ${startDate}, ${endDate}, ${JSON.stringify(offers)}, NOW(), NOW())
        RETURNING *;
      `;
    } else {
      [inserted] = await sql`
        INSERT INTO offers (title, start_date, end_date, offers, created_at)
        VALUES (${title}, ${startDate}, ${endDate}, ${JSON.stringify(offers)}, NOW())
        RETURNING *;
      `;
    }

    console.log("Offer created successfully:", inserted);
    return NextResponse.json(inserted);
  } catch (error) {
    console.error("Error saving offer:", error);
    return NextResponse.json({ error: "Failed to save offer", details: error.message }, { status: 500 });
  }
}