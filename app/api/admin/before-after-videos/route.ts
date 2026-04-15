import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { beforeAfterVideoSchema } from "@/lib/before-after-videos"
import { ensureBeforeAfterVideosTable } from "@/lib/migrations/ensure-before-after-videos-table"

export async function GET() {
  try {
    await ensureBeforeAfterVideosTable()

    const videos = await sql`
      SELECT *
      FROM before_after_videos
      ORDER BY display_order ASC, created_at DESC
    `

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error fetching admin videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    await ensureBeforeAfterVideosTable()

    const body = await request.json()
    const parsed = beforeAfterVideoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const [created] = await sql`
      INSERT INTO before_after_videos (
        title,
        description,
        media_type,
        before_image_url,
        after_image_url,
        result_video_url,
        video_url,
        thumbnail_url,
        content_type,
        shop,
        display_order,
        is_active
      ) VALUES (
        ${payload.title},
        ${payload.description},
        ${payload.media_type},
        ${payload.before_image_url},
        ${payload.after_image_url},
        ${payload.result_video_url},
        ${payload.result_video_url},
        ${payload.thumbnail_url},
        'result',
        ${payload.shop},
        ${payload.display_order},
        ${payload.is_active}
      )
      RETURNING *
    `

    return NextResponse.json(created)
  } catch (error) {
    console.error("Error creating before/after video:", error)
    return NextResponse.json(
      { error: "Failed to create video", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
