import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureShopCategoryColumn } from "@/lib/migrations/ensure-shop-category"
import { ensureCurrencySupport } from "@/lib/migrations/ensure-currency-support"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure shop_category column exists
    await ensureShopCategoryColumn()
    // Ensure currency support exists
    await ensureCurrencySupport()
    
    const body = await request.json()
    const {
      name,
      description,
      price, // Keep for backward compatibility
      price_aed,
      price_inr,
      default_currency,
      image_url,
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
    } = body

    // Validate required fields
    if (!name || !category_id) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      )
    }

    // Validate at least one price is provided
    if (!price_aed && !price_inr && !price) {
      return NextResponse.json(
        { error: "At least one price (AED or INR) is required" },
        { status: 400 }
      )
    }

    // Validate default currency
    if (default_currency && !['AED', 'INR'].includes(default_currency)) {
      return NextResponse.json(
        { error: "Default currency must be either 'AED' or 'INR'" },
        { status: 400 }
      )
    }

    // Validate shop_category
    if (!shop_category || !['A', 'B'].includes(shop_category)) {
      return NextResponse.json(
        { error: "Shop category is required and must be 'A' or 'B'" },
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

    // Determine default currency if not provided
    let finalDefaultCurrency = default_currency || 'AED'
    if (!default_currency) {
      if (price_aed && !price_inr) finalDefaultCurrency = 'AED'
      else if (price_inr && !price_aed) finalDefaultCurrency = 'INR'
    }

    // Handle backward compatibility for price field
    const finalPriceAed = price_aed || (finalDefaultCurrency === 'AED' ? price : null)
    const finalPriceInr = price_inr || (finalDefaultCurrency === 'INR' ? price : null)
    const finalPrice = price || (finalDefaultCurrency === 'AED' ? price_aed : price_inr)

    const [product] = await sql`
      UPDATE products SET
        name = ${name},
        description = ${description || ''},
        price = ${finalPrice},
        price_aed = ${finalPriceAed},
        price_inr = ${finalPriceInr},
        default_currency = ${finalDefaultCurrency},
        image_url = ${image_url || ''},
        category_id = ${category_id},
        shop_category = ${shop_category},
        is_available = ${is_available ?? true},
        is_featured = ${is_featured ?? false},
        is_new = ${is_new ?? false},
        new_until_date = ${new_until_date || null},
        features = ${features || []},
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

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

// Keep GET and DELETE methods unchanged
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
    // Ensure shop_category column exists
    await ensureShopCategoryColumn()
    // Ensure currency support exists
    await ensureCurrencySupport()
    
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
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${params.id};
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
