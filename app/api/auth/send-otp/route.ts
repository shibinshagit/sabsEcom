import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

/**
 * Lazily create the auth-related tables when they don't exist.
 * This mirrors the pattern used in the admin Orders API so that
 * local previews never crash if migrations haven't been run.
 */
async function ensureAuthSchema() {
  // users ----------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255) UNIQUE NOT NULL,
      name          VARCHAR(255),
      phone         VARCHAR(20),
      is_verified   BOOLEAN         DEFAULT FALSE,
      created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
    );
  `

  // user_otps ------------------------------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS user_otps (
      id          SERIAL PRIMARY KEY,
      email       VARCHAR(255) NOT NULL,
      otp_code    VARCHAR(6)   NOT NULL,
      expires_at  TIMESTAMP    NOT NULL,
      is_used     BOOLEAN      DEFAULT FALSE,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );
  `
}

// Simple OTP generation
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Mock email sending function (replace with actual email service)
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // In production, integrate with services like:
  // - SendGrid, Mailgun, AWS SES, etc.
  console.log(`Sending OTP ${otp} to ${email}`)

  // For demo purposes, we'll just log it
  // In real implementation, send actual email
  return true
}

export async function POST(request: Request) {
  try {
    // 0️⃣  Ensure auth schema exists (preview safety).
    await ensureAuthSchema()

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await sql`
      INSERT INTO user_otps (email, otp_code, expires_at)
      VALUES (${email}, ${otp}, ${expiresAt})
    `

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp)

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      // In development, return OTP for testing (remove in production)
      ...(process.env.NODE_ENV === "development" && { otp }),
    })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
