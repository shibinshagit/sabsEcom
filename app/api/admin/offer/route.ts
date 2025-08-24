

import { NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { ensureOfferTypeSupport } from "@/lib/migrations/ensure-offer-type";

// GET - Fetch all offers
export async function GET() {
  try {
    // Ensure the database schema is up to date
    await ensureOfferTypeSupport();

    const offers = await sql`
      SELECT * FROM offers ORDER BY updated_at DESC, created_at DESC;
    `;
    
    if (offers.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

// POST - Create a new offer
export async function POST(request: Request) {
  try {
    const { title, startDate, endDate, offers } = await request.json();

    if (!title || !startDate || !endDate || !offers || offers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Validate offer structure
    const invalidOffers = offers.filter((offer: any) => 
      !offer.value || 
      !offer.type || 
      !['percentage', 'cash'].includes(offer.type)
    );

    if (invalidOffers.length > 0) {
      return NextResponse.json(
        { error: "Invalid offer structure. Each offer must have a value and type (percentage or cash)" }, 
        { status: 400 }
      );
    }

    // Validate percentage values (1-100)
    const percentageOffers = offers.filter((offer: any) => offer.type === 'percentage');
    const invalidPercentages = percentageOffers.filter((offer: any) => {
      const value = parseFloat(offer.value);
      return isNaN(value) || value < 1 || value > 100;
    });

    if (invalidPercentages.length > 0) {
      return NextResponse.json(
        { error: "Percentage offers must be between 1 and 100" }, 
        { status: 400 }
      );
    }

    // Validate cash values (positive numbers)
    const cashOffers = offers.filter((offer: any) => offer.type === 'cash');
    const invalidCashValues = cashOffers.filter((offer: any) => {
      const value = parseFloat(offer.value);
      return isNaN(value) || value <= 0;
    });

    if (invalidCashValues.length > 0) {
      return NextResponse.json(
        { error: "Cash offers must be positive values" }, 
        { status: 400 }
      );
    }

    console.log("Creating offer with data:", { title, startDate, endDate, offers });

    // Ensure the database schema is up to date
    await ensureOfferTypeSupport();

    // Determine the primary offer type for this offer set
    const hasPercentage = offers.some((offer: any) => offer.type === 'percentage');
    const hasCash = offers.some((offer: any) => offer.type === 'cash');
    const primaryOfferType = hasPercentage && hasCash ? 'mixed' : 
                            hasPercentage ? 'percentage' : 'cash';

    const [inserted] = await sql`
      INSERT INTO offers (title, start_date, end_date, offers, offer_type, created_at, updated_at)
      VALUES (${title}, ${startDate}, ${endDate}, ${JSON.stringify(offers)}, ${primaryOfferType}, NOW(), NOW())
      RETURNING *;
    `;

    console.log("Offer created successfully:", inserted);
    return NextResponse.json(inserted);
  } catch (error) {
    console.error("Error saving offer:", error);
    return NextResponse.json({ 
      error: "Failed to save offer", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}