import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

/**
 * Ensure the tables required by the admin dashboard exist.
 * Using `IF NOT EXISTS` makes the operation idempotent and safe
 * to run on every request in ephemeral preview deployments.
 */
async function ensureSchema() {
  // ---- orders -----------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id                     SERIAL PRIMARY KEY,
      customer_name          VARCHAR(200) NOT NULL,
      customer_email         VARCHAR(200),
      customer_phone         VARCHAR(50)  NOT NULL,
      order_type             VARCHAR(50)  DEFAULT 'dine-in',
      table_number           INTEGER,
      delivery_address       TEXT,
      total_amount           DECIMAL(10,2) NOT NULL,
      tax_amount             DECIMAL(10,2) DEFAULT 0,
      delivery_fee           DECIMAL(10,2) DEFAULT 0,
      final_total            DECIMAL(10,2) NOT NULL,
      status                 VARCHAR(50)  DEFAULT 'pending',
      special_instructions   TEXT,
      estimated_completion_time TIMESTAMP,
      created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // ---- order_items ------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id              SERIAL PRIMARY KEY,
      order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id    INTEGER,
      menu_item_name  VARCHAR(200) NOT NULL,
      quantity        INTEGER NOT NULL,
      unit_price      DECIMAL(10,2) NOT NULL,
      total_price     DECIMAL(10,2) NOT NULL,
      special_requests TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // ---- reservations (needed for relations elsewhere) --------------------
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id                   SERIAL PRIMARY KEY,
      customer_name        VARCHAR(200) NOT NULL,
      customer_email       VARCHAR(200),
      customer_phone       VARCHAR(50) NOT NULL,
      party_size           INTEGER NOT NULL CHECK (party_size > 0),
      reservation_date     DATE NOT NULL,
      reservation_time     TIME NOT NULL,
      status               VARCHAR(50) DEFAULT 'pending',
      special_requests     TEXT,
      table_preference     VARCHAR(100),
      occasion             VARCHAR(100),
      dietary_restrictions TEXT,
      confirmation_code    VARCHAR(20) UNIQUE,
      created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // ---- customers (optional but useful) ----------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id                 SERIAL PRIMARY KEY,
      name               VARCHAR(200) NOT NULL,
      email              VARCHAR(200) UNIQUE,
      phone              VARCHAR(50),
      date_of_birth      DATE,
      preferences        TEXT,
      dietary_restrictions TEXT,
      total_orders       INTEGER DEFAULT 0,
      total_spent        DECIMAL(10,2) DEFAULT 0,
      last_visit         TIMESTAMP,
      created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
}

/**
 * GET /api/admin/orders
 * Returns all orders with their associated items.
 */
export async function GET() {
  try {
    // 1️⃣  Make sure schema is present.
    await ensureSchema()

    // 2️⃣  Fetch orders with aggregated items.
    const orders = await sql`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            oi.id,
              'menu_item_id',  oi.menu_item_id,
              'menu_item_name',oi.menu_item_name,
              'quantity',      oi.quantity,
              'unit_price',    oi.unit_price,
              'total_price',   oi.total_price,
              'special_requests', oi.special_requests
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
