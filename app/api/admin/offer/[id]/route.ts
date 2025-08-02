
import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

// PUT - Update an existing offer
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { title, startDate, endDate, offers } = await request.json();

    // Validation
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

    console.log("Updating offer with ID:", id, { title, startDate, endDate, offers });

    // Check if updated_at column exists
    const columnCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'offers' AND column_name = 'updated_at';
    `;

    const hasUpdatedAt = columnCheck.length > 0;

    let updated;
    if (hasUpdatedAt) {
      [updated] = await sql`
        UPDATE offers
        SET title = ${title},
            start_date = ${startDate},
            end_date = ${endDate},
            offers = ${JSON.stringify(offers)},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;
    } else {
      [updated] = await sql`
        UPDATE offers
        SET title = ${title},
            start_date = ${startDate},
            end_date = ${endDate},
            offers = ${JSON.stringify(offers)}
        WHERE id = ${id}
        RETURNING *;
      `;
    }

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
    return NextResponse.json({ error: "Failed to update offer", details: error.message }, { status: 500 });
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

    const [deleted] = await sql`
      DELETE FROM offers WHERE id = ${id} RETURNING *;
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: "Offer not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}