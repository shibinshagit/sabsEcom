import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Ensure about_content table exists
    await sql`
      CREATE TABLE IF NOT EXISTS about_content (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT NOT NULL,
        image_url VARCHAR(500),
        button_text VARCHAR(100) DEFAULT 'Browse Parts',
        button_link VARCHAR(255) DEFAULT '/products',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get active about content (latest first)
    const aboutContent = await sql`
      SELECT * FROM about_content 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (aboutContent.length === 0) {
      // Insert default content if none exists
      const defaultContent = await sql`
        INSERT INTO about_content (title, subtitle, description, image_url, button_text, button_link) 
        VALUES (
          'Built for Reliable Rides', 
          'Our Story', 
          'Motoclub Kottakkal supplies genuine spare parts and dependable accessories for riders who value safety and performance.

We source trusted brands and reliable replacements so every ride stays smooth and secure.', 
          '/placeholder.svg?height=800&width=800', 
          'Browse Parts', 
          '/products'
        )
        RETURNING *
      `
      return NextResponse.json(defaultContent[0])
    }

    return NextResponse.json(aboutContent[0])
  } catch (error) {
    console.error("Error fetching about content:", error)
    return NextResponse.json({ error: "Failed to fetch about content" }, { status: 500 })
  }
}
