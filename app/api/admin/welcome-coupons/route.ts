import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET() {
  try {
    const coupons = await sql`
      SELECT *
      FROM welcome_coupons
      ORDER BY updated_at DESC, created_at DESC;
    `;

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Failed to fetch welcome coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch welcome coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      code,
      title,
      description,
      discountType,

      discountValueInr,
      discountValueAed,

      maxPurchaseInr,
      maxPurchaseAed,

      minimumPurchaseInr,
      minimumPurchaseAed,

      validFrom,
      validTo,
      isActive,
      userTypeRestriction,
    } = data;

    // =========================
    // BASIC REQUIRED FIELDS
    // =========================
    if (!code || !discountType) {
      return NextResponse.json(
        { error: "code and discountType are required" },
        { status: 400 }
      );
    }

    if (!["flat", "percent"].includes(discountType)) {
      return NextResponse.json(
        { error: "discountType must be flat or percent" },
        { status: 400 }
      );
    }

    // =========================
    // DISCOUNT VALUE VALIDATION
    // =========================
    if (discountType === "percent") {
      const invalidPct =
        (discountValueInr && (discountValueInr <= 0 || discountValueInr > 100)) ||
        (discountValueAed && (discountValueAed <= 0 || discountValueAed > 100));

      if (invalidPct) {
        return NextResponse.json(
          { error: "Percentage discount must be BETWEEN 1 and 100" },
          { status: 400 }
        );
      }
    }

    if (discountType === "flat") {
      const invalidFlat =
        (discountValueInr && discountValueInr <= 0) ||
        (discountValueAed && discountValueAed <= 0);

      if (invalidFlat) {
        return NextResponse.json(
          { error: "Flat discount must be a positive number" },
          { status: 400 }
        );
      }
    }

    // =========================
    // USER TYPE VALIDATION
    // =========================
    const allowedTypes = ["all", "new", "returning"];
    if (userTypeRestriction && !allowedTypes.includes(userTypeRestriction)) {
      return NextResponse.json(
        { error: `userTypeRestriction must be one of: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // =========================
    // OPTIONAL FIELDS
    // =========================
    const minINR = minimumPurchaseInr ?? 0;
    const minAED = minimumPurchaseAed ?? 0;

    // maxPurchaseInr / maxPurchaseAed ARE OPTIONAL → no validation if empty/null
    const maxINR = maxPurchaseInr ?? null;
    const maxAED = maxPurchaseAed ?? null;

    const active = isActive ?? true;
    const userType = userTypeRestriction ?? "all";

    // =========================
    // OPTIONAL DATE VALIDATION
    // =========================
    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      return NextResponse.json(
        { error: "validFrom cannot be greater than validTo" },
        { status: 400 }
      );
    }

    // =========================
    // INSERT QUERY
    // =========================
    const [coupon] = await sql`
      INSERT INTO welcome_coupons (
        code, title, description,
        discount_type,
        discount_value_inr, discount_value_aed,
        minimum_purchase_inr, minimum_purchase_aed,
        max_purchase_inr, max_purchase_aed,
        user_type_restriction,
        valid_from, valid_to, is_active,
        created_at, updated_at
      )
      VALUES (
        ${code}, ${title}, ${description},
        ${discountType},
        ${discountValueInr}, ${discountValueAed},
        ${minINR}, ${minAED},
        ${maxINR}, ${maxAED},
        ${userType},
        ${validFrom}, ${validTo}, ${active},
        NOW(), NOW()
      )
      RETURNING *;
    `;

    // =========================
    // PRELOAD coupon usage for all users
    // =========================
    await sql`
      INSERT INTO welcome_coupons_used (user_id, welcome_coupon_id)
      SELECT id, ${coupon.id}
      FROM users
      ON CONFLICT (user_id, welcome_coupon_id) DO NOTHING;
    `;

    return NextResponse.json(coupon);

  } catch (error) {
    console.error("Failed to create coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
