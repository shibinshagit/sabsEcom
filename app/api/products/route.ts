
import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

/**
 * Public endpoint – returns all available products joined with their category.
 *
 * 1. Ensures both `categories` and `products` tables exist (idempotent).
 * 2. Seeds sample gadget products the very first time so the UI has data.
 * 3. Returns products ordered by category and product name.
 */
export async function GET() {
  try {
    /* ───────────────────────────────────────────────────────────────
       1. AUTO-PROVISION SCHEMA (idempotent)
    ────────────────────────────────────────────────────────────────*/
    await sql`CREATE TABLE IF NOT EXISTS categories (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      image_url   TEXT,
      is_active   BOOLEAN      DEFAULT TRUE,
      is_special  BOOLEAN      DEFAULT FALSE,
      sort_order  INTEGER      DEFAULT 0,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );`

    await sql`CREATE TABLE IF NOT EXISTS products (
      id               SERIAL PRIMARY KEY,
      name             VARCHAR(200) NOT NULL,
      description      TEXT,
      price            NUMERIC(10,2) NOT NULL,
      image_url        TEXT,
      category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_available     BOOLEAN DEFAULT TRUE,
      is_featured      BOOLEAN DEFAULT FALSE,
      is_new           BOOLEAN DEFAULT FALSE,
      new_until_date   DATE,
      features         TEXT[],
      specifications_text TEXT,
      warranty_months  INTEGER DEFAULT 12,
      brand            VARCHAR(100),
      model            VARCHAR(100),
      condition_type   VARCHAR(50) DEFAULT 'new',
      warranty_period  INTEGER DEFAULT 12,
      storage_capacity VARCHAR(50),
      color            VARCHAR(50),
      stock_quantity   INTEGER DEFAULT 1,
      sku              VARCHAR(100) UNIQUE,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`

    /* ───────────────────────────────────────────────────────────────
       2. SEED GADGET CATEGORIES AND SAMPLE PRODUCTS
    ────────────────────────────────────────────────────────────────*/
    // Insert gadget categories
    // await sql`
    //   INSERT INTO categories (name, description, sort_order) VALUES
    //   ('New Arrivals', 'Latest products and new releases', 0),
    //   ('Mobile Phones', 'Smartphones and mobile devices', 1),
    //   ('Laptops & PCs', 'Desktop computers and laptops', 2),
    //   ('Audio Devices', 'Earbuds, headphones, and speakers', 3),
    //   ('Accessories', 'Phone cases, chargers, and accessories', 4),
    //   ('Tablets', 'Tablets and iPads', 5)
    //   ON CONFLICT (name) DO NOTHING;
    // `

    // Get category IDs
    const categories = await sql`SELECT id, name FROM categories WHERE name IN ('New Arrivals', 'Mobile Phones', 'Laptops & PCs', 'Audio Devices')`
    const newCategory = categories.find(c => c.name === 'New Arrivals')
    const mobileCategory = categories.find(c => c.name === 'Mobile Phones')
    const laptopCategory = categories.find(c => c.name === 'Laptops & PCs')
    const audioCategory = categories.find(c => c.name === 'Audio Devices')

    // Add sample products if products table is empty
    if (newCategory && mobileCategory && laptopCategory && audioCategory) {
      await sql`
        INSERT INTO products (
          name, description, price, category_id, image_url, 
          is_featured, brand, model, condition_type, warranty_period, 
          storage_capacity, color, stock_quantity, sku, features, specifications_text
        )
        SELECT 'iPhone 15 Pro', 
               'Latest iPhone with A17 Pro chip and titanium design', 
               999.00, 
               ${mobileCategory.id}, 
               '/placeholder.svg', 
               TRUE, 
               'Apple', 
               'iPhone 15 Pro', 
               'new', 
               12, 
               '256GB', 
               'Natural Titanium', 
               5, 
               'IPH15P-256-NT',
               ARRAY['A17 Pro chip', 'Titanium design', '48MP camera', 'USB-C'],
               '6.1-inch display, 256GB storage, 5G capable'
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'IPH15P-256-NT');
      `

      await sql`
        INSERT INTO products (
          name, description, price, category_id, image_url, 
          is_featured, brand, model, condition_type, warranty_period, 
          storage_capacity, color, stock_quantity, sku, features, specifications_text
        )
        SELECT 'MacBook Air M2', 
               'Ultra-thin laptop with M2 chip', 
               1199.00, 
               ${laptopCategory.id}, 
               '/placeholder.svg', 
               TRUE, 
               'Apple', 
               'MacBook Air M2', 
               'new', 
               12, 
               '256GB', 
               'Space Gray', 
               3, 
               'MBA-M2-256-SG',
               ARRAY['M2 chip', '13.6-inch display', '18-hour battery', 'Backlit keyboard'],
               '13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD'
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MBA-M2-256-SG');
      `

      await sql`
        INSERT INTO products (
          name, description, price, category_id, image_url, 
          is_featured, brand, model, condition_type, warranty_period, 
          storage_capacity, color, stock_quantity, sku, features, specifications_text
        )
        SELECT 'AirPods Pro', 
               'Active noise cancellation earbuds', 
               249.00, 
               ${audioCategory.id}, 
               '/placeholder.svg', 
               TRUE, 
               'Apple', 
               'AirPods Pro', 
               'new', 
               12, 
               'N/A', 
               'White', 
               15, 
               'APP-WHITE',
               ARRAY['Active noise cancellation', 'Spatial audio', 'Adaptive EQ', 'Sweat resistant'],
               'Bluetooth 5.0, Up to 4.5 hours listening time, Wireless charging case'
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'APP-WHITE');
      `
    }

    /* ───────────────────────────────────────────────────────────────
       3. FETCH PRODUCTS FOR THE FRONTEND
    ────────────────────────────────────────────────────────────────*/
    const items = await sql`
      SELECT
        p.*,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = TRUE
      ORDER BY c.sort_order, c.name, p.name;
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
} 