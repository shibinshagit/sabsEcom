import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

/**
 * Lazily create the auth-related tables. Keeps preview builds safe even
 * if migrations haven't yet been applied.
 */
async function ensureAuthSchema() {
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

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: Request) {
  try {
    // 0️⃣  Ensure auth schema exists (preview safety).
    await ensureAuthSchema()

    const { email, otp, name } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    // Verify OTP
    const [otpRecord] = await sql`
      SELECT * FROM user_otps 
      WHERE email = ${email} 
        AND otp_code = ${otp} 
        AND expires_at > NOW() 
        AND is_used = FALSE
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE user_otps 
      SET is_used = TRUE 
      WHERE id = ${otpRecord.id}
    `

    // Create or update user
    const [user] = await sql`
      INSERT INTO users (email, name, is_verified)
      VALUES (${email}, ${name || null}, TRUE)
      ON CONFLICT (email) DO UPDATE SET
        is_verified = TRUE,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.is_verified,
      },
    })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
