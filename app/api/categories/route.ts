import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const categories = await sql`
      SELECT * FROM categories 
      WHERE is_active = TRUE 
      ORDER BY sort_order, name;
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
