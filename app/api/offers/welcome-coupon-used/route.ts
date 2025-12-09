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

    console.log('Welcome coupon usage tracking:', { 
      userId, 
      userEmail, 
      couponCode, 
      orderId 
    });

    // Validation - userId is required (INTEGER foreign key)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required to track welcome coupon usage" },
        { status: 400 }
      );
    }

    if (!couponCode || couponCode.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Get the welcome coupon (case-insensitive)
    const couponData = await sql`
      SELECT id, code, title, discount_type, discount_value
      FROM welcome_coupons
      WHERE UPPER(code) = UPPER(${couponCode})
        AND is_active = TRUE
      LIMIT 1
    `;

    if (couponData.length === 0) {
      console.log('Welcome coupon not found:', couponCode);
      return NextResponse.json(
        { success: false, error: "Welcome coupon not found" },
        { status: 404 }
      );
    }

    const coupon = couponData[0];
    console.log('Found welcome coupon for tracking:', { 
      id: coupon.id, 
      code: coupon.code, 
      title: coupon.title 
    });

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
      
      // If already redeemed, return error
      if (existingRecord.is_redeemed === true) {
        console.warn('Attempted to redeem already used coupon:', {
          userId,
          couponId: coupon.id,
          previouslyRedeemedAt: existingRecord.redeemed_at
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: "This welcome coupon has already been redeemed by you",
            redeemedAt: existingRecord.redeemed_at
          },
          { status: 400 }
        );
      }

      // Update existing record to mark as redeemed
      const updateResult = await sql`
        UPDATE welcome_coupons_used
        SET 
          is_redeemed = TRUE,
          redeemed_at = ${now}
        WHERE id = ${existingRecord.id}
        RETURNING id, is_redeemed, redeemed_at
      `;

      console.log('Welcome coupon marked as redeemed:', {
        recordId: existingRecord.id,
        userId,
        couponCode,
        couponId: coupon.id,
        redeemedAt: now
      });

      return NextResponse.json({
        success: true,
        message: "Welcome coupon marked as redeemed successfully",
        recordId: existingRecord.id,
        redeemedAt: now,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title
        }
      });
    } else {
      // Insert new redemption record
      // The UNIQUE constraint (user_id, welcome_coupon_id) ensures no duplicates
      const insertResult = await sql`
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

      const newRecord = insertResult[0];

      console.log('Welcome coupon redemption recorded:', { 
        recordId: newRecord.id,
        userId, 
        couponCode, 
        couponId: coupon.id,
        isRedeemed: newRecord.is_redeemed,
        redeemedAt: newRecord.redeemed_at,
        assignedAt: newRecord.assigned_at
      });

      return NextResponse.json({
        success: true,
        message: "Welcome coupon redeemed and tracked successfully",
        recordId: newRecord.id,
        redeemedAt: newRecord.redeemed_at,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          title: coupon.title
        }
      });
    }

  } catch (err) {
    console.error("Welcome coupon usage tracking error:", err);
    
    // Check for foreign key constraint errors
    if (err instanceof Error) {
      if (err.message.includes('foreign key') || err.message.includes('violates')) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid user ID or coupon reference. Please contact support.",
            details: err.message
          },
          { status: 400 }
        );
      }
      
      // Check for unique constraint violations
      if (err.message.includes('unique') || err.message.includes('duplicate')) {
        return NextResponse.json(
          { 
            success: false, 
            error: "This welcome coupon usage has already been recorded.",
            details: err.message
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to track welcome coupon usage. Please contact support if this persists.",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
