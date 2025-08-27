import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getAuth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        product_id INTEGER NOT NULL,
        product_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `

    const wishlistItems = await sql`
      SELECT product_data 
      FROM wishlists 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    const items = wishlistItems.map(item => item.product_data)
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { product } = await request.json()

    if (!product || !product.id) {
      return NextResponse.json({ error: "Product data is required" }, { status: 400 })
    }

    // Create wishlist table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        product_id INTEGER NOT NULL,
        product_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `

    await sql`
      INSERT INTO wishlists (user_id, product_id, product_data)
      VALUES (${userId}, ${product.id}, ${JSON.stringify(product)})
      ON CONFLICT (user_id, product_id) DO NOTHING
    `

    return NextResponse.json({ success: true, message: "Product added to wishlist" })
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM wishlists 
      WHERE user_id = ${userId} AND product_id = ${parseInt(productId)}
    `

    return NextResponse.json({ success: true, message: "Product removed from wishlist" })
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    )
  }
}