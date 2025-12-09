import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

// ===========================
// GET /api/admin/welcome-coupons/[id]
// ===========================
export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [coupon] = await sql`
      SELECT *
      FROM welcome_coupons
      WHERE id = ${id};
    `;

    if (!coupon) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Failed to fetch coupon:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ===========================
// PUT /api/admin/welcome-coupons/[id]
// ===========================
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // BASIC VALIDATION
    if (!code || !title || !discountType) {
      return NextResponse.json(
        { error: "code, title and discountType are required" },
        { status: 400 }
      );
    }

    if (!["flat", "percent"].includes(discountType)) {
      return NextResponse.json(
        { error: "discountType must be 'flat' or 'percent'" },
        { status: 400 }
      );
    }

    // PERCENT VALIDATION
    if (discountType === "percent") {
      if (
        (discountValueInr !== null &&
          discountValueInr !== undefined &&
          (discountValueInr < 1 || discountValueInr > 100)) ||
        (discountValueAed !== null &&
          discountValueAed !== undefined &&
          (discountValueAed < 1 || discountValueAed > 100))
      ) {
        return NextResponse.json(
          { error: "Percentage values must be between 1 and 100" },
          { status: 400 }
        );
      }
    }

    // USER TYPE VALIDATION
    if (
      userTypeRestriction &&
      !["all", "new", "returning"].includes(userTypeRestriction)
    ) {
      return NextResponse.json(
        { error: "Invalid userTypeRestriction" },
        { status: 400 }
      );
    }

    const userType = userTypeRestriction ?? "all";

    // NORMALIZE VALUES
    const minINR = minimumPurchaseInr ?? 0;
    const minAED = minimumPurchaseAed ?? 0;
    const maxINR = maxPurchaseInr ?? null;
    const maxAED = maxPurchaseAed ?? null;
    const active = isActive ?? true;

    const [updated] = await sql`
      UPDATE welcome_coupons
      SET 
        code = ${code},
        title = ${title},
        description = ${description},
        discount_type = ${discountType},

        discount_value_inr = ${discountValueInr},
        discount_value_aed = ${discountValueAed},

        minimum_purchase_inr = ${minINR},
        minimum_purchase_aed = ${minAED},

        max_purchase_inr = ${maxINR},
        max_purchase_aed = ${maxAED},

        user_type_restriction = ${userType},

        valid_from = ${validFrom},
        valid_to = ${validTo},
        is_active = ${active},

        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ===========================
// DELETE /api/admin/welcome-coupons/[id]
// ===========================
export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await sql`
      DELETE FROM welcome_coupons
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete coupon:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

