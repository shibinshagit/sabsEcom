import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, receipt } = await request.json()

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise for INR or fils for AED
      currency: currency,
      receipt: receipt,
      notes: {
        order_id: receipt,
      },
    })

    return NextResponse.json({ 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error("Payment order creation failed:", error)
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    )
  }
}
