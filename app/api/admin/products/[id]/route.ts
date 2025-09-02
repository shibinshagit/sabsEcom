// app/api/admin/products/[id]/route.ts
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
      image_urls,
      category_id,
      shop_category,
      is_available,
      is_featured,
      is_new,
      new_until_date,
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
      variants
    } = body

    // Validate required fields
    if (!name || !category_id) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      )
    }

    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "At least one variant is required" },
        { status: 400 }
      )
    }

    // Validate variant names
    const hasInvalidVariant = variants.some(v => !v.name?.trim())
    if (hasInvalidVariant) {
      return NextResponse.json(
        { error: "All variants must have a name" },
        { status: 400 }
      )
    }

    // Validate shop_category
    if (!shop_category || !['A', 'B', 'Both'].includes(shop_category)) {
      return NextResponse.json(
        { error: "Shop category is required and must be 'A', 'B', or 'Both'" },
        { status: 400 }
      )
    }

    // Validate product ID
    if (!params.id || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // Prepare array data for PostgreSQL
    const imageUrlsArray = Array.isArray(image_urls) ? image_urls : []
    const featuresArray = Array.isArray(features) ? features : []

    // Update product - Fixed array handling
    const [product] = await sql`
      UPDATE products SET
        name = ${name},
        description = ${description || ''},
        image_urls = ${imageUrlsArray},
        category_id = ${category_id},
        shop_category = ${shop_category},
        is_available = ${is_available ?? true},
        is_featured = ${is_featured ?? false},
        is_new = ${is_new ?? false},
        new_until_date = ${new_until_date || null},
        features = ${featuresArray},
        specifications_text = ${specifications_text || ''},
        warranty_months = ${warranty_months || 12},
        brand = ${brand || ''},
        model = ${model || ''},
        condition_type = ${condition_type || 'new'},
        warranty_period = ${warranty_period || 12},
        storage_capacity = ${storage_capacity || ''},
        color = ${color || ''},
        stock_quantity = ${stock_quantity || 1},
        sku = ${sku || ''},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *;
    `

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete existing variants
    await sql`DELETE FROM product_variants WHERE product_id = ${params.id};`

    // Insert new variants
    for (const variant of variants) {
      await sql`
        INSERT INTO product_variants (
          product_id, name, price_aed, price_inr, discount_aed, discount_inr,
          available_aed, available_inr
        ) VALUES (
          ${params.id}, ${variant.name}, ${variant.price_aed || 0}, ${variant.price_inr || 0},
          ${variant.discount_aed || 0}, ${variant.discount_inr || 0},
          ${variant.available_aed ?? true}, ${variant.available_inr ?? true}
        );
      `
    }

    // Fetch the complete updated product with variants
    const [completeProduct] = await sql`
      SELECT
        p.*,
        c.name AS category_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'name', v.name,
              'price_aed', v.price_aed,
              'price_inr', v.price_inr,
              'discount_aed', v.discount_aed,
              'discount_inr', v.discount_inr,
              'available_aed', v.available_aed,
              'available_inr', v.available_inr
            ) ORDER BY v.id
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.id = ${params.id}
      GROUP BY p.id, c.name;
    `

    return NextResponse.json(completeProduct)
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
    // Validate product ID
    if (!params.id || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // Delete variants first (cascade should handle this, but being explicit)
    await sql`DELETE FROM product_variants WHERE product_id = ${params.id};`

    // Delete the product
    const [product] = await sql`
      DELETE FROM products
      WHERE id = ${params.id}
      RETURNING id;
    `

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Product deleted successfully",
      deletedId: product.id 
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product ID
    if (!params.id || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    const [product] = await sql`
      SELECT
        p.*,
        c.name AS category_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'name', v.name,
              'price_aed', v.price_aed,
              'price_inr', v.price_inr,
              'discount_aed', v.discount_aed,
              'discount_inr', v.discount_inr,
              'available_aed', v.available_aed,
              'available_inr', v.available_inr
            ) ORDER BY v.id
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.id = ${params.id}
      GROUP BY p.id, c.name;
    `

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}