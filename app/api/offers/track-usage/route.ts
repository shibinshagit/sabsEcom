import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { 
      offerId, 
      userId, 
      userEmail, 
      orderTotal, 
      discountAmount,
      couponCode,
      orderId,
      currency = 'AED',
      couponType = 'regular' // 'regular' or 'welcome'
    } = await request.json()

    console.log('Tracking usage for:', { 
      offerId, 
      userId, 
      userEmail, 
      couponType,
      couponCode 
    })

    if (!offerId) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      )
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User ID or email is required" },
        { status: 400 }
      )
    }

    // Handle different coupon types
    if (couponType === 'welcome') {
      // For welcome coupons, we only need to mark is_redeemed = true
      const now = new Date();
      
      // Check if this welcome coupon has already been used by this user
      // Check by both user_id AND user_email for better matching
      const existingUsage = await sql`
        SELECT id, is_redeemed FROM welcome_coupons_used
        WHERE welcome_coupon_id = ${offerId}
          AND (
            user_id = ${userId} 
            OR (${userEmail} IS NOT NULL AND user_email = ${userEmail})
          )
        LIMIT 1
      `;

      if (existingUsage.length > 0) {
        const existing = existingUsage[0];
        
        if (existing.is_redeemed) {
          return NextResponse.json({
            error: "This welcome coupon has already been redeemed"
          }, { status: 400 });
        }
        
        // ONLY update is_redeemed to true and redeemed_at timestamp
        await sql`
          UPDATE welcome_coupons_used
          SET 
            is_redeemed = true,
            redeemed_at = ${now.toISOString()}
          WHERE id = ${existing.id}
        `;
      } else {
        // Insert new record with is_redeemed = true
        await sql`
          INSERT INTO welcome_coupons_used (
            welcome_coupon_id,
            user_id,
            user_email,
            is_redeemed,
            redeemed_at,
            assigned_at
          ) VALUES (
            ${offerId},
            ${userId},
            ${userEmail},
            true,
            ${now.toISOString()},
            ${now.toISOString()}
          )
        `;
      }

      console.log('Welcome coupon marked as redeemed')
      
    } else {
      // For regular offers, use the existing offer_usage table
      // Use UPSERT pattern: update usage_count if record exists, insert if not
      await sql`
        INSERT INTO offer_usage (
          offer_id, 
          user_id, 
          user_email,
          usage_count,
          order_total,
          discount_amount,
          coupon_code,
          order_id,
          currency,
          created_at
        ) VALUES (
          ${offerId}, 
          ${userId}, 
          ${userEmail},
          1,
          ${orderTotal || null},
          ${discountAmount || null},
          ${couponCode || null},
          ${orderId || null},
          ${currency},
          NOW()
        )
        ON CONFLICT (offer_id, COALESCE(user_id, ''), COALESCE(user_email, '')) 
        DO UPDATE SET 
          usage_count = offer_usage.usage_count + 1,
          order_total = COALESCE(${orderTotal}, offer_usage.order_total),
          discount_amount = COALESCE(${discountAmount}, offer_usage.discount_amount),
          coupon_code = COALESCE(${couponCode}, offer_usage.coupon_code),
          order_id = COALESCE(${orderId}, offer_usage.order_id),
          last_used_at = NOW()
      `

      console.log('Regular offer usage tracked successfully')
    }

    return NextResponse.json({
      success: true,
      message: "Offer usage tracked successfully"
    })

  } catch (error) {
    console.error("Error tracking offer usage:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error details:", errorMessage)
    return NextResponse.json(
      { error: "Failed to track offer usage", details: errorMessage },
      { status: 500 }
    )
  }
}
