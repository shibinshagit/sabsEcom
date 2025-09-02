import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { name, description, image_url, is_active, is_special, sort_order } = data
    const id = params.id

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const [category] = await sql`
      UPDATE categories 
      SET 
        name = ${name}, 
        description = ${description || ""}, 
        image_url = ${image_url || ""}, 
        is_active = ${is_active || true}, 
        is_special = ${is_special || false}, 
        sort_order = ${sort_order || 0},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Failed to update category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const menuItems = await sql`
      SELECT COUNT(*) as count FROM menu_items WHERE category_id = ${id}
    `

    if (menuItems[0].count > 0) {
      return NextResponse.json({ error: "Cannot delete category with existing menu items" }, { status: 400 })
    }

    const result = await sql`DELETE FROM categories WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
