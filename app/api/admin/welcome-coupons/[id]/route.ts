import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const [coupon] = await sql`
      SELECT *
      FROM welcome_coupons
      WHERE id = ${params.id};
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    if (!code || !title || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
          { error: "maximumDiscount is required for percentage coupons" },
          { status: 400 }
        );
      }
    }

    const userType = userTypeRestriction ?? "all";

    const [updated] = await sql`
      UPDATE welcome_coupons
      SET 
        code = ${code},
        title = ${title},
        description = ${description},
        discount_type = ${discountType},
        discount_value = ${discountValue},
        maximum_discount = ${maximumDiscount},
        minimum_purchase_inr = ${minimumPurchaseInr ?? 0},
        minimum_purchase_aed = ${minimumPurchaseAed ?? 0},
        user_type_restriction = ${userType},
        valid_from = ${validFrom},
        valid_to = ${validTo},
        is_active = ${isActive ?? true},
        updated_at = NOW()
      WHERE id = ${params.id}
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      DELETE FROM welcome_coupons
      WHERE id = ${params.id}
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

