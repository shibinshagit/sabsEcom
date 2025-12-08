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
      discountValue,
      maximumDiscount,
      validFrom,
      validTo,
      isActive,
      minimumPurchaseInr,
      minimumPurchaseAed,
      userTypeRestriction,
    } = data;

    // =========================
    // VALIDATION
    // =========================
    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "code, discountType and discountValue are required" },
        { status: 400 }
      );
    }

    if (!["flat", "percent"].includes(discountType)) {
      return NextResponse.json(
        { error: "discountType must be 'flat' or 'percent'" },
        { status: 400 }
      );
    }

    if (discountType === "percent") {
      if (discountValue < 1 || discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount must be between 1 and 100" },
          { status: 400 }
        );
      }

      if (!maximumDiscount) {
        return NextResponse.json(
          {
            error:
              "maximumDiscount is required for percentage coupons to avoid unlimited discount",
          },
          { status: 400 }
        );
      }
    }

    if (
      userTypeRestriction &&
      !["all", "new", "returning"].includes(userTypeRestriction)
    ) {
      return NextResponse.json(
        {
          error: "userTypeRestriction must be one of: all, new, returning",
        },
        { status: 400 }
      );
    }

    // Default values
    const minINR = minimumPurchaseInr ?? 0;
    const minAED = minimumPurchaseAed ?? 0;
    const active = isActive ?? true;
    const userType = userTypeRestriction ?? "all";

    // =========================
    // INSERT QUERY
    // =========================
    const [coupon] = await sql`
      INSERT INTO welcome_coupons (
        code, title, description,
        discount_type, discount_value, maximum_discount,
        minimum_purchase_inr, minimum_purchase_aed,
        user_type_restriction,
        valid_from, valid_to, is_active,
        created_at, updated_at
      )
      VALUES (
        ${code}, ${title}, ${description},
        ${discountType}, ${discountValue}, ${maximumDiscount},
        ${minINR}, ${minAED},
        ${userType},
        ${validFrom}, ${validTo}, ${active},
        NOW(), NOW()
      )
      RETURNING *;
    `;
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
