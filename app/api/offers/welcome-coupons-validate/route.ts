import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userEmail,
      couponCode, 
      orderTotal, 
      currency = "AED",
      shopId = "B" 
    } = await request.json();

    console.log('Welcome coupon validation request:', { 
      userId, 
      userEmail, 
      couponCode, 
      orderTotal, 
      currency, 
      shopId 
    });

    // Validation
    if (!couponCode || couponCode.trim() === "") {
      return NextResponse.json(
        { valid: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Welcome coupons require authentication
    if (!userId) {
      return NextResponse.json(
        { valid: false, error: "Please login to use welcome coupons" },
        { status: 401 }
      );
    }

    // Fetch the welcome coupon (case-insensitive)
    const couponData = await sql`
      SELECT *
      FROM welcome_coupons
      WHERE UPPER(code) = UPPER(${couponCode})
        AND is_active = TRUE
      LIMIT 1
    `;

    if (couponData.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid or inactive welcome coupon code" },
        { status: 400 }
      );
    }

    const coupon = couponData[0];
    console.log('Found welcome coupon:', { 
      id: coupon.id, 
      code: coupon.code, 
      type: coupon.type || coupon.discount_type, // Check both possible field names
      discount_type: coupon.discount_type,
      allFields: coupon
    });

    // Check date validity
    const now = new Date();
    
    if (coupon.valid_from) {
      const validFrom = new Date(coupon.valid_from);
      if (now < validFrom) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "This welcome coupon is not yet valid",
            validFrom: coupon.valid_from
          },
          { status: 400 }
        );
      }
    }
    
    if (coupon.valid_to) {
      const validTo = new Date(coupon.valid_to);
      if (now > validTo) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "This welcome coupon has expired",
            validTo: coupon.valid_to
          },
          { status: 400 }
        );
      }
    }

    // Check if user has already used this specific welcome coupon
    const usageCheck = await sql`
      SELECT id, is_redeemed, redeemed_at
      FROM welcome_coupons_used
      WHERE user_id = ${userId}
        AND welcome_coupon_id = ${coupon.id}
      LIMIT 1
    `;

    if (usageCheck.length > 0) {
      if (usageCheck[0].is_redeemed === true) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "You have already used this welcome coupon. Each welcome coupon can only be used once.",
            redeemedAt: usageCheck[0].redeemed_at
          },
          { status: 400 }
        );
      }
    }

    // Check minimum purchase requirement based on currency
    let minPurchase = 0;
    if (currency === "AED") {
      minPurchase = coupon.minimum_purchase_aed ? parseFloat(coupon.minimum_purchase_aed) : 0;
    } else if (currency === "INR") {
      minPurchase = coupon.minimum_purchase_inr ? parseFloat(coupon.minimum_purchase_inr) : 0;
    }

    if (orderTotal < minPurchase) {
      const currencySymbol = currency === "AED" ? "AED" : "₹";
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order value of ${currencySymbol}${minPurchase.toFixed(2)} required for this welcome coupon`,
          requiredAmount: minPurchase,
          minPurchase: minPurchase,
          currentTotal: orderTotal
        },
        { status: 400 }
      );
    }

    // Get discount type - check both possible field names
    const discountType = coupon.discount_type || coupon.type;
    
    // Calculate discount amount based on discount type
    let discountAmount = 0;
    const discountValue = parseFloat(coupon.discount_value);

    if (discountType === "flat" || discountType === "cash") {
      // For flat discount, use the discount value but don't exceed order total
      discountAmount = Math.min(discountValue, orderTotal);
    } else if (discountType === "percentage" || discountType === "percent") {
      // For percentage discount, calculate based on order total
      discountAmount = (orderTotal * discountValue) / 100;
      
      // Apply maximum discount cap if set
      if (coupon.maximum_discount && parseFloat(coupon.maximum_discount) > 0) {
        const maxDiscount = parseFloat(coupon.maximum_discount);
        discountAmount = Math.min(discountAmount, maxDiscount);
        console.log(`Applied max discount cap: ${maxDiscount}, final discount: ${discountAmount}`);
      }
      
      // Ensure discount doesn't exceed order total
      discountAmount = Math.min(discountAmount, orderTotal);
    } else {
      console.error('Invalid discount type:', discountType);
      return NextResponse.json(
        { valid: false, error: `Invalid discount type (${discountType}) for this welcome coupon` },
        { status: 400 }
      );
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    console.log('Discount calculation:', {
      type: discountType,
      value: discountValue,
      orderTotal,
      calculatedDiscount: discountAmount
    });

    // Return success response
    const currencySymbol = currency === "AED" ? "AED" : "₹";
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: discountType, // Return the actual type
        discountValue: discountValue.toString(),
        discountAmount: discountAmount,
        minPurchase: minPurchase.toString(),
        maxDiscount: coupon.maximum_discount ? parseFloat(coupon.maximum_discount).toString() : null,
        validFrom: coupon.valid_from,
        validTo: coupon.valid_to,
        userTypeRestriction: coupon.user_type_restriction
      },
      message: `Welcome coupon applied successfully! You saved ${currencySymbol}${discountAmount.toFixed(2)}`
    });

  } catch (err) {
    console.error("Welcome coupon validation error:", err);
    return NextResponse.json(
      { 
        valid: false, 
        error: "Failed to validate welcome coupon. Please try again.",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
