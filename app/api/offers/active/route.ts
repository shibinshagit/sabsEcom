import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

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

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    // Fetch only active offers
    const activeOffers = await sql`
      SELECT * FROM offers 
      WHERE start_date <= ${currentDate} 
      AND end_date >= ${currentDate}
      ORDER BY created_at DESC;
    `;
    
    console.log("Active offers found:", activeOffers.length);
    console.log("Current date:", currentDate);
    
    return NextResponse.json(activeOffers);
  } catch (error) {
    console.error("Error fetching active offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch active offers" }, 
      { status: 500 }
    );
  }
}