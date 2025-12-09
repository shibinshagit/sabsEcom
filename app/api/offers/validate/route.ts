// File: app/api/offers/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const {
      offerCode,
      orderTotal,
      shopId,
      userType,
      userId,
      cartItems,
      currency = 'AED',
    } = await request.json();

    if (!offerCode || offerCode.trim() === '') {
      return NextResponse.json({ error: "Offer code is required" }, { status: 400 });
    }

    const currencySymbol = currency === 'AED' ? 'AED' : '₹';

    // Fetch all active offers within date range
    const offers = await sql`
      SELECT * FROM offers
      WHERE is_active = TRUE
        AND start_date <= NOW()
        AND end_date >= NOW()
      ORDER BY COALESCE(priority, 0) DESC, created_at DESC
    `;

    if (!offers || offers.length === 0) {
      return NextResponse.json({ error: "No active offers available" }, { status: 404 });
    }

    let matchedOffer = null;
    let matchedDiscount = null;

    // Match offer code
    for (const offer of offers) {
      try {
        const offerDiscounts = typeof offer.offers === 'string' ? JSON.parse(offer.offers) : offer.offers;

        for (const discount of offerDiscounts) {
          // Assume code format: prefix + value + random suffix
          const prefix = discount.type === 'cash' ? 'CASH' : 'SPIN';
          const codePattern = `${prefix}${discount.value}`;
          const regex = new RegExp(`^${codePattern}[A-Z0-9]+$`, 'i');

          if (regex.test(offerCode)) {
            matchedOffer = offer;
            matchedDiscount = discount;
            break;
          }
        }

        if (matchedOffer) break;
      } catch {
        continue;
      }
    }

    if (!matchedOffer || !matchedDiscount) {
      return NextResponse.json({ error: "Invalid offer code" }, { status: 400 });
    }

    // ---------------------- RESTRICTIONS ----------------------
    const restrictions = {
      minimumOrderValue: currency === 'AED'
        ? parseFloat(matchedOffer.minimum_order_value_aed ?? '0')
        : parseFloat(matchedOffer.minimum_order_value_inr ?? '0'),
      maximumOrderValue: currency === 'AED'
        ? (matchedOffer.maximum_order_value_aed ? parseFloat(matchedOffer.maximum_order_value_aed) : null)
        : (matchedOffer.maximum_order_value_inr ? parseFloat(matchedOffer.maximum_order_value_inr) : null),
      usageLimitPerUser: matchedOffer.usage_limit_per_user ? parseInt(matchedOffer.usage_limit_per_user) : null,
      totalUsageLimit: matchedOffer.total_usage_limit ? parseInt(matchedOffer.total_usage_limit) : null,
      shopRestriction: matchedOffer.shop_restriction ?? null,
      userTypeRestriction: matchedOffer.user_type_restriction ?? null,
      allowedCategories: matchedOffer.allowed_categories ? JSON.parse(matchedOffer.allowed_categories) : null,
      excludedCategories: matchedOffer.excluded_categories ? JSON.parse(matchedOffer.excluded_categories) : null,
    };

    // Minimum order value check
    if (restrictions.minimumOrderValue > 0 && orderTotal < restrictions.minimumOrderValue) {
      return NextResponse.json({
        error: `Minimum order value of ${currencySymbol}${restrictions.minimumOrderValue.toFixed(2)} required`,
        requiredAmount: restrictions.minimumOrderValue,
      }, { status: 400 });
    }

    // Maximum order value check
    if (restrictions.maximumOrderValue && orderTotal > restrictions.maximumOrderValue) {
      return NextResponse.json({
        error: `Maximum order value of ${currencySymbol}${restrictions.maximumOrderValue.toFixed(2)} exceeded`,
        maxAmount: restrictions.maximumOrderValue,
      }, { status: 400 });
    }

    // User type restriction
    if (restrictions.userTypeRestriction && userType !== restrictions.userTypeRestriction) {
      const typeText = restrictions.userTypeRestriction === 'new' ? 'new customers' : 'returning customers';
      return NextResponse.json({
        error: `This offer is only valid for ${typeText}`,
        requiredUserType: restrictions.userTypeRestriction,
      }, { status: 400 });
    }

    // Shop restriction
    if (restrictions.shopRestriction && shopId !== restrictions.shopRestriction) {
      return NextResponse.json({
        error: `This offer is only valid for shop ${restrictions.shopRestriction}`,
        requiredShop: restrictions.shopRestriction,
      }, { status: 400 });
    }

    // Usage limits
    if (userId) {
      if (restrictions.usageLimitPerUser) {
        const userUsage = await sql`
          SELECT COALESCE(usage_count, 0) AS usage_count
          FROM offer_usage
          WHERE offer_id = ${matchedOffer.id} AND user_id = ${userId}
        `;
        const usedCount = userUsage.length > 0 ? parseInt(userUsage[0].usage_count) : 0;
        if (usedCount >= restrictions.usageLimitPerUser) {
          return NextResponse.json({ error: "You have already redeemed this offer", usageLimit: restrictions.usageLimitPerUser }, { status: 400 });
        }
      }

      if (restrictions.totalUsageLimit) {
        const totalUsage = await sql`
          SELECT COUNT(*) AS total_usage
          FROM offer_usage
          WHERE offer_id = ${matchedOffer.id}
        `;
        const totalCount = parseInt(totalUsage[0].total_usage);
        if (totalCount >= restrictions.totalUsageLimit) {
          return NextResponse.json({ error: "This offer has reached its usage limit", totalLimit: restrictions.totalUsageLimit }, { status: 400 });
        }
      }
    }

    // Cart category restrictions
    if (cartItems && (restrictions.allowedCategories || restrictions.excludedCategories)) {
      const productIds = cartItems.map((item: any) => item.id).filter(Boolean);
      if (productIds.length > 0) {
        const products = await sql`
          SELECT id, category_id, shop_category, name
          FROM products
          WHERE id = ANY(${productIds})
        `;

        const productMap = new Map(products.map((p: any) => [p.id, p]));

        for (const item of cartItems) {
          const product = productMap.get(item.id);
          if (!product) continue;

          const catId = product.category_id.toString();
          const shopCategory = product.shop_category;

          // Allowed categories
          if (restrictions.allowedCategories && !restrictions.allowedCategories.includes(catId)) {
            return NextResponse.json({ error: "Offer not valid for some products in your cart", restriction: "category_not_allowed" }, { status: 400 });
          }

          // Excluded categories
          if (restrictions.excludedCategories && restrictions.excludedCategories.includes(catId)) {
            return NextResponse.json({ error: "Offer cannot be applied to some products in your cart", restriction: "category_excluded" }, { status: 400 });
          }

          // Shop category "Both" bypasses shop restriction
          if (restrictions.shopRestriction && shopCategory !== 'Both' && shopCategory !== restrictions.shopRestriction) {
            return NextResponse.json({ error: `Offer not valid for products in shop ${shopCategory}`, restriction: "shop_product_mismatch" }, { status: 400 });
          }
        }
      }
    }

    // Discount calculation
    let discountAmount = 0;
    if (matchedDiscount.type === 'percentage') {
      discountAmount = (orderTotal * parseFloat(matchedDiscount.value)) / 100;
    } else if (matchedDiscount.type === 'cash') {
      discountAmount = Math.min(parseFloat(matchedDiscount.value), orderTotal);
    }

    if (restrictions.maximumOrderValue && discountAmount > restrictions.maximumOrderValue) {
      discountAmount = restrictions.maximumOrderValue;
    }

    return NextResponse.json({
      valid: true,
      offer: {
        id: matchedOffer.id,
        title: matchedOffer.title,
        code: offerCode,
        type: matchedDiscount.type,
        value: matchedDiscount.value,
        discountAmount,
        restrictions,
      },
    });

  } catch (err) {
    console.error("Error validating offer:", err);
    return NextResponse.json({ error: "Failed to validate offer", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
