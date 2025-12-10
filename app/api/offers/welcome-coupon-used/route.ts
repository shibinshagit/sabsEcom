// File: app/api/offers/welcome-coupon-used/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userEmail,
      couponCode,
      orderId,
      orderTotal,
      discountAmount,
      currency = "AED"
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required to track  coupon usage" },
        { status: 400 }
      );
    }

    if (!couponCode || couponCode.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Fetch coupon (active only)
    const couponData = await sql`
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

    if (couponData.length === 0) {
      return NextResponse.json(
        { success: false, error: "coupon not found or inactive" },
        { status: 404 }
      );
    }

    const coupon = couponData[0];

    const now = new Date().toISOString();

    // Check if this user already has a record for this coupon
    const existing = await sql`
      SELECT id, is_redeemed, redeemed_at, assigned_at
      FROM welcome_coupons_used
      WHERE user_id = ${userId}
        AND welcome_coupon_id = ${coupon.id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const existingRecord = existing[0];

      if (existingRecord.is_redeemed) {
        return NextResponse.json(
          {
            success: false,
            error: "This  coupon has already been redeemed by you",
            redeemedAt: existingRecord.redeemed_at
          },
          { status: 400 }
        );
      }

      // Mark existing record as redeemed
      const updated = await sql`
        UPDATE welcome_coupons_used
        SET is_redeemed = TRUE,
            redeemed_at = ${now}
        WHERE id = ${existingRecord.id}
        RETURNING id, is_redeemed, redeemed_at, assigned_at
      `;

      return NextResponse.json({
        success: true,
        message: "coupon marked as redeemed",
        recordId: updated[0].id,
        redeemedAt: updated[0].redeemed_at,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title
        }
      });
    }

    // Insert new redemption record
    const inserted = await sql`
      INSERT INTO welcome_coupons_used (
        user_id,
        welcome_coupon_id,
        is_redeemed,
        redeemed_at,
        assigned_at
      )
      VALUES (
        ${userId},
        ${coupon.id},
        TRUE,
        ${now},
        ${now}
      )
      RETURNING id, is_redeemed, redeemed_at, assigned_at
    `;

    return NextResponse.json({
      success: true,
      message: " coupon redeemed and tracked successfully",
      recordId: inserted[0].id,
      redeemedAt: inserted[0].redeemed_at,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title
      }
    });

  } catch (err) {
    console.error(" coupon usage tracking error:", err);

    // Handle common SQL errors
    if (err instanceof Error) {
      if (err.message.includes("foreign key") || err.message.includes("violates")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid user ID or coupon reference",
            details: err.message
          },
          { status: 400 }
        );
      }

      if (err.message.includes("unique") || err.message.includes("duplicate")) {
        return NextResponse.json(
          {
            success: false,
            error: "This coupon usage has already been recorded",
            details: err.message
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to track  coupon usage",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

