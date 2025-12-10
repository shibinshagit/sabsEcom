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
      shopId = "B",
    } = await request.json();

    // Basic checks
    if (!couponCode || !couponCode.trim()) {
      return NextResponse.json(
        { valid: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { valid: false, error: "Please login to use  coupons" },
        { status: 401 }
      );
    }

    // Fetch coupon
    const rows = await sql`
      SELECT
        id,
        code,
        title,
        description,
        discount_type,
        discount_value_inr,
        discount_value_aed,
        minimum_purchase_inr,
        minimum_purchase_aed,
        max_purchase_inr,
        max_purchase_aed,
        user_type_restriction,
        is_active,
        valid_from,
        valid_to
      FROM welcome_coupons
      WHERE UPPER(code) = UPPER(${couponCode})
        AND is_active = TRUE
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Invalid or inactive  coupon" },
        { status: 400 }
      );
    }

    const coupon = rows[0];

    // ------------------- DATE VALIDATION -------------------
    const now = new Date();

    if (coupon.valid_from && now < new Date(coupon.valid_from)) {
      return NextResponse.json(
        { valid: false, error: "Coupon not yet valid", validFrom: coupon.valid_from },
        { status: 400 }
      );
    }

    if (coupon.valid_to && now > new Date(coupon.valid_to)) {
      return NextResponse.json(
        { valid: false, error: "Coupon expired", validTo: coupon.valid_to },
        { status: 400 }
      );
    }

// ------------------- USER TYPE VALIDATION -------------------
// Expected: "new", "returning", "all"
const userTypeRestriction = coupon.user_type_restriction?.toLowerCase();

if (userTypeRestriction !== "all") {
  // Count orders from the orders table
  const orderRows = await sql`
    SELECT COUNT(*)::int AS total_orders
    FROM orders
    WHERE user_id = ${userId}
  `;

  const totalOrders = orderRows[0]?.total_orders ?? 0;
  const isNewUser = totalOrders === 0;
  const isReturningUser = totalOrders > 0;

  // Only for NEW users
  if (userTypeRestriction === "new" && !isNewUser) {
    return NextResponse.json(
      { valid: false, error: "This coupon is only for new users" },
      { status: 400 }
    );
  }

  // Only for RETURNING users
  if (userTypeRestriction === "returning" && !isReturningUser) {
    return NextResponse.json(
      { valid: false, error: "This coupon is only for returning users" },
      { status: 400 }
    );
  }
}


    // ------------------- USAGE CHECK (same coupon) -------------------
    const used = await sql`
      SELECT id, is_redeemed, redeemed_at
      FROM welcome_coupons_used
      WHERE user_id = ${userId}
        AND welcome_coupon_id = ${coupon.id}
      LIMIT 1
    `;

    if (used.length > 0 && used[0].is_redeemed === true) {
      return NextResponse.json(
        {
          valid: false,
          error: "You have already used this  coupon.",
          redeemedAt: used[0].redeemed_at,
        },
        { status: 400 }
      );
    }

    // ------------------- CURRENCY SELECTION -------------------
    const isAED = currency === "AED";
    const symbol = isAED ? "AED" : "₹";

    const discountValue = isAED
      ? Number(coupon.discount_value_aed)
      : Number(coupon.discount_value_inr);

    const minPurchase = isAED
      ? Number(coupon.minimum_purchase_aed)
      : Number(coupon.minimum_purchase_inr);

    const maxCap = isAED
      ? Number(coupon.max_purchase_aed)
      : Number(coupon.max_purchase_inr);

    // ------------------- MIN PURCHASE VALIDATION -------------------
    if (orderTotal < minPurchase) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order value of ${symbol}${minPurchase.toFixed(2)} required`,
          minPurchase,
        },
        { status: 400 }
      );
    }

    // ------------------- DISCOUNT CALCULATION -------------------
    let discountAmount = 0;

    if (coupon.discount_type === "flat") {
      discountAmount = Math.min(discountValue, orderTotal);
    }

    else if (coupon.discount_type === "percent") {
      discountAmount = (orderTotal * discountValue) / 100;

      // If you want to REMOVE max cap for welcome coupons:
      // comment the next 2 lines
      if (maxCap > 0) discountAmount = Math.min(discountAmount, maxCap);
    }

    else {
      return NextResponse.json(
        { valid: false, error: "Invalid discount type" },
        { status: 400 }
      );
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    // ------------------- SUCCESS -------------------
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue,
        discountAmount,
        minPurchase,
        maxCap,
        validFrom: coupon.valid_from,
        validTo: coupon.valid_to,
        userTypeRestriction: coupon.user_type_restriction,
      },
      message: `Coupon applied. You saved ${symbol}${discountAmount.toFixed(2)}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate coupon",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

