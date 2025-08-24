

import { NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { ensureOfferTypeSupport } from "@/lib/migrations/ensure-offer-type";

// PUT - Update an existing offer
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { title, startDate, endDate, offers } = await request.json();

    if (!title || !startDate || !endDate || !offers || offers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid offer ID" }, 
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

    console.log("Updating offer with ID:", id, { title, startDate, endDate, offers });

    // Ensure the database schema is up to date
    await ensureOfferTypeSupport();

    // Determine the primary offer type for this offer set
    const hasPercentage = offers.some((offer: any) => offer.type === 'percentage');
    const hasCash = offers.some((offer: any) => offer.type === 'cash');
    const primaryOfferType = hasPercentage && hasCash ? 'mixed' : 
                            hasPercentage ? 'percentage' : 'cash';

    const [updated] = await sql`
      UPDATE offers
      SET title = ${title},
          start_date = ${startDate},
          end_date = ${endDate},
          offers = ${JSON.stringify(offers)},
          offer_type = ${primaryOfferType},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!updated) {
      return NextResponse.json(
        { error: "Offer not found" }, 
        { status: 404 }
      );
    }

    console.log("Offer updated successfully:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json({ 
      error: "Failed to update offer", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// GET - Fetch a specific offer by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid offer ID" }, 
        { status: 400 }
      );
    }

    // Ensure the database schema is up to date
    await ensureOfferTypeSupport();

    const offers = await sql`
      SELECT * FROM offers WHERE id = ${id};
    `;

    if (offers.length === 0) {
      return NextResponse.json(
        { error: "Offer not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(offers[0]);
  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

// DELETE - Delete an offer
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid offer ID" }, 
        { status: 400 }
      );
    }

    // Ensure the database schema is up to date
    await ensureOfferTypeSupport();

    const [deleted] = await sql`
      DELETE FROM offers WHERE id = ${id} RETURNING *;
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: "Offer not found" }, 
        { status: 404 }
      );
    }

    console.log("Offer deleted successfully:", deleted);
    return NextResponse.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}