import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureBeforeAfterVideosTable } from "@/lib/migrations/ensure-before-after-videos-table"

export async function GET(request: Request) {
  try {
    await ensureBeforeAfterVideosTable()

    const { searchParams } = new URL(request.url)
    const shop = searchParams.get("shop")
    const currentShop = shop === "A" || shop === "B" ? shop : null

    const videos =
      currentShop === null
        ? await sql`
            SELECT *
            FROM before_after_videos
            WHERE is_active = true
            ORDER BY display_order ASC, created_at DESC
          `
        : await sql`
            SELECT *
            FROM before_after_videos
            WHERE is_active = true
              AND shop IN (${currentShop}, 'Both')
            ORDER BY display_order ASC, created_at DESC
          `

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error fetching before/after videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
