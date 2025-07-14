import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      image_url,
      category_id,
      is_available,
      is_featured,
      features,
      specifications_text,
      warranty_months,
      brand,
      model,
      condition_type,
      warranty_period,
      storage_capacity,
      color,
      stock_quantity,
      sku,
    } = body

    const [product] = await sql`
      UPDATE products SET
        name = ${name},
        description = ${description},
        price = ${price},
        image_url = ${image_url},
        category_id = ${category_id},
        is_available = ${is_available},
        is_featured = ${is_featured},
        features = ${features},
        specifications_text = ${specifications_text},
        warranty_months = ${warranty_months},
        brand = ${brand},
        model = ${model},
        condition_type = ${condition_type},
        warranty_period = ${warranty_period},
        storage_capacity = ${storage_capacity},
        color = ${color},
        stock_quantity = ${stock_quantity},
        sku = ${sku},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *;
    `

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [product] = await sql`
      DELETE FROM products
      WHERE id = ${params.id}
      RETURNING id;
    `

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
} 