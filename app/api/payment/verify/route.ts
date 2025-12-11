import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { neon } from "@neondatabase/serverless"

// Helper function to get active Razorpay account credentials
async function getActiveRazorpayCredentials() {
  try {
    // Initialize Neon DB connection
    const sql = neon(process.env.DATABASE_URL!)

    // Fetch active account number from settings
    const rows = await sql`
      SELECT value FROM settings WHERE key = 'active_razorpay_account' LIMIT 1
    `

    const activeAccount = rows[0]?.value || "1" // Default to account 1

    // Get credentials from environment variables
    const keyId = process.env[`RAZORPAY_ACCOUNT_${activeAccount}_KEY_ID`]
    const keySecret = process.env[`RAZORPAY_ACCOUNT_${activeAccount}_KEY_SECRET`]

    if (!keyId || !keySecret) {
      throw new Error(`Razorpay credentials not found for account ${activeAccount}`)
    }

    return { keyId, keySecret, accountNumber: activeAccount }
  } catch (error) {
    console.error("Failed to get Razorpay credentials:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    // Enhanced validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      )
    }

    // Validate format
    if (!razorpay_order_id.startsWith('order_') ||
      !razorpay_payment_id.startsWith('pay_') ||
      razorpay_signature.length !== 64) {
      return NextResponse.json(
        { error: "Invalid payment parameter format" },
        { status: 400 }
      )
    }

    // Get active Razorpay credentials dynamically
    const { keySecret } = await getActiveRazorpayCredentials()

    // Verify signature using crypto.timingSafeEqual to prevent timing attacks
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex")

    const providedSignature = Buffer.from(razorpay_signature, 'hex')
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex')
    const isAuthentic = crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)

    if (isAuthentic) {
      // Log successful verification (without sensitive data)
      console.log(`Payment verified successfully: ${razorpay_order_id.slice(-8)}`)

      return NextResponse.json({
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        verified_at: new Date().toISOString()
      })
    } else {
      // Log failed verification attempt
      console.warn(`Payment verification failed for order: ${razorpay_order_id.slice(-8)}`)

      return NextResponse.json(
        { error: "Payment signature verification failed" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Payment verification failed:", error)
    return NextResponse.json(
      { error: "Payment verification failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
