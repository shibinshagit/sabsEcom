import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

async function getUserFromJWT() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
    }
  } catch (err) {
    console.error("JWT verification failed:", err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      offerCode,
      orderTotal,
      shopId,
      userType,
      userId,
      cartItems,
      currency = "AED",
    } = await request.json()

    if (!offerCode) {
      return NextResponse.json({ error: "Offer code is required" }, { status: 400 })
    }

    const currencySymbol = currency === "AED" ? "AED" : "₹"
    const user = await getUserFromJWT()
    
    // For guest users, we still allow coupon validation but with restrictions
    const isGuest = !user

    // ----------- Step 1: Check if it's a welcome coupon -----------
    const normalizedCode = offerCode.trim().toUpperCase()
    const isWelcomeCode = normalizedCode.startsWith('WELCOME')

    if (isWelcomeCode) {
      if (isGuest) {
        return NextResponse.json({ 
          error: "Please login to use welcome coupons" 
        }, { status: 401 })
      }

      // IMPORTANT: Ensure we have user info
      if (!user || !user.id || !user.email) {
        return NextResponse.json({ 
          error: "User information is required for welcome coupons" 
        }, { status: 400 })
      }

      // FIXED: Check welcome coupon with proper user matching
      const welcomeCouponResult = await sql`
        SELECT 
          wc.*,
          COALESCE(
            (SELECT wcu.is_redeemed 
             FROM welcome_coupons_used wcu 
             WHERE wcu.welcome_coupon_id = wc.id 
               AND (wcu.user_id = ${user.id} OR wcu.user_email = ${user.email})
             LIMIT 1
            ), false
          ) as is_redeemed,
          COALESCE(
            (SELECT wcu.redeemed_at 
             FROM welcome_coupons_used wcu 
             WHERE wcu.welcome_coupon_id = wc.id 
               AND (wcu.user_id = ${user.id} OR wcu.user_email = ${user.email})
             LIMIT 1
            ), null
          ) as redeemed_at
        FROM welcome_coupons wc
        WHERE wc.code = ${normalizedCode}
          AND wc.is_active = true
        LIMIT 1
      `

      if (welcomeCouponResult.length === 0) {
        return NextResponse.json({ 
          error: "Invalid welcome coupon code" 
        }, { status: 400 })
      }

      const coupon = welcomeCouponResult[0]
      const now = new Date()

      // Check if coupon is already redeemed
      if (coupon.is_redeemed) {
        return NextResponse.json({ 
          error: "You have already used this welcome coupon. Each welcome coupon can only be used once." 
        }, { status: 400 })
      }

      // Validate coupon dates
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return NextResponse.json({ 
          error: "This coupon is not yet valid" 
        }, { status: 400 })
      }
      
      if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        return NextResponse.json({ 
          error: "This coupon has expired" 
        }, { status: 400 })
      }

      // Check user type restrictions
      if (coupon.user_type_restriction && 
          coupon.user_type_restriction !== "all" && 
          coupon.user_type_restriction !== userType) {
        return NextResponse.json({ 
          error: `This coupon is only valid for ${coupon.user_type_restriction} users` 
        }, { status: 400 })
      }

      // Check minimum purchase
      const minPurchase = currency === "AED" 
        ? coupon.minimum_purchase_aed 
        : coupon.minimum_purchase_inr
        
      if (orderTotal < minPurchase) {
        return NextResponse.json({
          error: `Minimum order value of ${minPurchase} ${currencySymbol} required for this coupon`,
          requiredAmount: minPurchase
        }, { status: 400 })
      }

      // Calculate discount amount
      let discountAmount = 0
      if (coupon.discount_type === "percent") {
        discountAmount = (orderTotal * parseFloat(coupon.discount_value)) / 100
        if (coupon.maximum_discount) {
          discountAmount = Math.min(discountAmount, parseFloat(coupon.maximum_discount))
        }
      } else {
        discountAmount = Math.min(parseFloat(coupon.discount_value), orderTotal)
      }

      return NextResponse.json({
        valid: true,
        type: "welcome",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountAmount,
          minPurchase,
          validFrom: coupon.valid_from,
          validTo: coupon.valid_to,
          isWelcomeCoupon: true
        }
      })
    }

    // ----------- Step 2: Check regular offers -----------
    const offers = await sql`
      SELECT * FROM offers
      WHERE is_active = true
        AND start_date <= NOW()
        AND end_date >= NOW()
      ORDER BY
        COALESCE(priority, 0) DESC,
        CASE WHEN minimum_order_value > 0 OR maximum_order_value IS NOT NULL OR
                  usage_limit_per_user IS NOT NULL OR total_usage_limit IS NOT NULL OR
                  shop_restriction IS NOT NULL OR user_type_restriction IS NOT NULL OR
                  allowed_categories IS NOT NULL OR excluded_categories IS NOT NULL
             THEN 0 ELSE 1 END,
        created_at DESC
    `

    let matchedOffer = null
    let matchedDiscount = null

    for (const offer of offers) {
      try {
        const offerDiscounts = typeof offer.offers === 'string' 
          ? JSON.parse(offer.offers) 
          : offer.offers
        
        for (const discount of offerDiscounts) {
          const prefix = discount.type === "cash" ? "CASH" : "SPIN"
          const codePattern = `${prefix}${discount.value}`
          const regex = new RegExp(`^${codePattern}[A-Z0-9]+$`)
          
          if (regex.test(normalizedCode)) {
            matchedOffer = offer
            matchedDiscount = discount
            break
          }
        }
        if (matchedOffer) break
      } catch (error) {
        console.error("Error parsing offer:", error)
        continue
      }
    }

    if (!matchedOffer || !matchedDiscount) {
      return NextResponse.json({ 
        error: "Invalid offer code" 
      }, { status: 400 })
    }

    // Apply offer restrictions
    const restrictions = {
      minimumOrderValue: currency === 'AED'
        ? parseFloat(matchedOffer.minimum_order_value_aed || '0')
        : parseFloat(matchedOffer.minimum_order_value_inr || '0'),
      maximumOrderValue: currency === 'AED'
        ? (matchedOffer.maximum_order_value_aed ? parseFloat(matchedOffer.maximum_order_value_aed) : null)
        : (matchedOffer.maximum_order_value_inr ? parseFloat(matchedOffer.maximum_order_value_inr) : null),
      usageLimitPerUser: matchedOffer.usage_limit_per_user ? parseInt(matchedOffer.usage_limit_per_user) : null,
      totalUsageLimit: matchedOffer.total_usage_limit ? parseInt(matchedOffer.total_usage_limit) : null,
      shopRestriction: matchedOffer.shop_restriction,
      userTypeRestriction: matchedOffer.user_type_restriction,
      allowedCategories: matchedOffer.allowed_categories ? JSON.parse(matchedOffer.allowed_categories) : null,
      excludedCategories: matchedOffer.excluded_categories ? JSON.parse(matchedOffer.excluded_categories) : null
    }

    // Minimum order check
    if (restrictions.minimumOrderValue > 0 && orderTotal < restrictions.minimumOrderValue) {
      return NextResponse.json({
        error: `Minimum order value of ${restrictions.minimumOrderValue} ${currencySymbol} required for this offer`,
      }, { status: 400 })
    }

    // Maximum order check
    if (restrictions.maximumOrderValue && orderTotal > restrictions.maximumOrderValue) {
      return NextResponse.json({
        error: `Maximum order value of ${restrictions.maximumOrderValue} ${currencySymbol} exceeded for this offer`,
      }, { status: 400 })
    }

    // User type restriction
    if (restrictions.userTypeRestriction && userType !== restrictions.userTypeRestriction) {
      const requiredType = restrictions.userTypeRestriction === 'new' ? 'new customers' : 'returning customers'
      return NextResponse.json({
        error: `This offer is only valid for ${requiredType}`,
      }, { status: 400 })
    }

    // Usage limits check
    if (userId || user?.id) {
      const actualUserId = userId || user?.id
      
      if (restrictions.usageLimitPerUser) {
        const userUsageResult = await sql`
          SELECT COALESCE(usage_count, 0) as usage_count
          FROM offer_usage
          WHERE offer_id = ${matchedOffer.id}
            AND (user_id = ${actualUserId} OR user_email = ${actualUserId})
        `
        const userUsageCount = userUsageResult.length > 0 ? parseInt(userUsageResult[0].usage_count) : 0
        if (userUsageCount >= restrictions.usageLimitPerUser) {
          return NextResponse.json({ 
            error: "You've already redeemed this offer" 
          }, { status: 400 })
        }
      }

      if (restrictions.totalUsageLimit) {
        const totalUsageResult = await sql`
          SELECT COUNT(*) as total_usage
          FROM offer_usage
          WHERE offer_id = ${matchedOffer.id}
        `
        const totalUsageCount = parseInt(totalUsageResult[0].total_usage)
        if (totalUsageCount >= restrictions.totalUsageLimit) {
          return NextResponse.json({ 
            error: "This offer has reached its usage limit" 
          }, { status: 400 })
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (matchedDiscount.type === "percentage") {
      discountAmount = (orderTotal * parseFloat(matchedDiscount.value)) / 100
    } else if (matchedDiscount.type === "cash") {
      discountAmount = Math.min(parseFloat(matchedDiscount.value), orderTotal)
    }
    
    if (restrictions.maximumOrderValue && discountAmount > restrictions.maximumOrderValue) {
      discountAmount = restrictions.maximumOrderValue
    }

    return NextResponse.json({
      valid: true,
      type: "offer",
      offer: {
        id: matchedOffer.id,
        title: matchedOffer.title,
        code: normalizedCode,
        type: matchedDiscount.type,
        value: matchedDiscount.value,
        discountAmount: discountAmount,
        restrictions,
        isWelcomeCoupon: false
      }
    })

  } catch (error) {
    console.error("Error validating offer:", error)
    return NextResponse.json({ 
      error: "Failed to validate offer" 
    }, { status: 500 })
  }
}
