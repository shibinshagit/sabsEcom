import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureBannerColumns } from "@/lib/migrations/ensure-banner-columns"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await ensureBannerColumns()

    const data = await request.json()
    const { id } = await params

    /* basic validation */
    if (!data.title || !data.message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const placement = data.placement === "home_hero" ? "home_hero" : "popup"
    const isHomeHero = placement === "home_hero"
    const displayPages = isHomeHero ? ["home"] : data.display_pages || ["all"]
    const isDismissible = isHomeHero ? false : data.is_dismissible ?? true
    const autoDisappear = isHomeHero ? 0 : data.auto_disappear_seconds || 0

    const [banner] = await sql`
      UPDATE banners SET
        title = ${data.title},
        message = ${data.message},
        banner_type = ${data.banner_type || "promotion"},
        background_color = ${data.background_color || "#f59e0b"},
        text_color = ${data.text_color || "#ffffff"},
        button_text = ${data.button_text || ""},
        button_link = ${data.button_link || ""},
        button_color = ${data.button_color || "#ffffff"},
        background_image_url = ${data.background_image_url || ""},
        auto_disappear_seconds = ${autoDisappear},
        redisplay_after_minutes = ${Math.min(10, Math.max(1, Number(data.redisplay_after_minutes) || 5))},
        placement = ${placement},
        display_pages = ${displayPages},
        is_active = ${data.is_active ?? true},
        start_date = ${data.start_date === "" || data.start_date == null ? null : data.start_date},
        end_date = ${data.end_date === "" || data.end_date == null ? null : data.end_date},
        priority = ${data.priority || 0},
        is_dismissible = ${isDismissible},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    return NextResponse.json(banner)
  } catch (error) {
    console.error("Error updating banner:", error)
    return NextResponse.json(
      { error: "Failed to update banner", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await ensureBannerColumns()
    const { id } = await params

    const result = await sql`
      DELETE FROM banners
      WHERE id = ${id}
      RETURNING id
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting banner:", error)
    return NextResponse.json(
      { error: "Failed to delete banner", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
