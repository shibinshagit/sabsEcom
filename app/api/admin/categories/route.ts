import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const categories = await sql`
      SELECT 
        id,
        name,
        description,
        image_url,
        is_active,
        is_special,
        sort_order,
        created_at,
        updated_at
      FROM categories 
      ORDER BY sort_order ASC, name ASC
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, description, image_url, is_active, is_special, sort_order } = data

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const [category] = await sql`
      INSERT INTO categories (name, description, image_url, is_active, is_special, sort_order)
      VALUES (${name}, ${description || ""}, ${image_url || ""}, ${is_active || true}, ${is_special || false}, ${sort_order || 0})
      RETURNING *
    `

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
