import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { beforeAfterVideoSchema } from "@/lib/before-after-videos"
import { ensureBeforeAfterVideosTable } from "@/lib/migrations/ensure-before-after-videos-table"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureBeforeAfterVideosTable()
    const id = Number(params.id)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = beforeAfterVideoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const [updated] = await sql`
      UPDATE before_after_videos
      SET
        title = ${payload.title},
        description = ${payload.description},
        media_type = ${payload.media_type},
        before_image_url = ${payload.before_image_url},
        after_image_url = ${payload.after_image_url},
        result_video_url = ${payload.result_video_url},
        video_url = ${payload.result_video_url},
        thumbnail_url = ${payload.thumbnail_url},
        content_type = 'result',
        shop = ${payload.shop},
        display_order = ${payload.display_order},
        is_active = ${payload.is_active},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!updated) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating before/after video:", error)
    return NextResponse.json(
      { error: "Failed to update video", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureBeforeAfterVideosTable()
    const id = Number(params.id)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const deleted = await sql`
      DELETE FROM before_after_videos
      WHERE id = ${id}
      RETURNING id
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting before/after video:", error)
    return NextResponse.json(
      { error: "Failed to delete video", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
