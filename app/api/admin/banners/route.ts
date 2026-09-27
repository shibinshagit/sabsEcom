import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "@/lib/database"
import { ensureBannerColumns } from "@/lib/migrations/ensure-banner-columns"

/* Empty date strings from the form must become null for Postgres timestamps */
const optionalDate = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().nullable().optional(),
)

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  banner_type: z.enum(["promotion", "announcement", "warning", "info"]).default("promotion"),
  background_color: z.string().default("#f59e0b"),
  text_color: z.string().default("#ffffff"),
  button_text: z.string().optional().default(""),
  button_link: z.string().optional().default(""),
  button_color: z.string().default("#ffffff"),
  background_image_url: z.string().optional().default(""),
  auto_disappear_seconds: z.coerce.number().int().nonnegative().default(0),
  redisplay_after_minutes: z.coerce.number().int().min(1).max(10).default(5),
  placement: z.enum(["popup", "home_hero"]).default("popup"),
  display_pages: z.array(z.string()).default(["all"]),
  is_active: z.boolean().default(true),
  start_date: optionalDate,
  end_date: optionalDate,
  priority: z.coerce.number().int().default(0),
  is_dismissible: z.boolean().default(true),
})

/* ---------- GET (list) ---------- */
export async function GET() {
  try {
    await ensureBannerColumns()

    const banners = await sql`
      SELECT *
      FROM banners
      ORDER BY priority DESC, created_at DESC
    `

    const normalized = banners.map((banner: any) => {
      let url = banner.background_image_url || ""
      if (url && typeof url === "string" && !url.startsWith("http")) {
        try {
          const parsed = JSON.parse(url)
          if (Array.isArray(parsed) && parsed[0]) url = parsed[0]
        } catch {
          const match = String(url).match(/https?:\/\/[^"}\s]+/)
          if (match) url = match[0]
        }
      }
      return { ...banner, background_image_url: url || "" }
    })

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Error fetching banners:", error)
    return NextResponse.json(
      { error: "Failed to fetch banners", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

/* ---------- POST (create) ---------- */
export async function POST(request: Request) {
  try {
    await ensureBannerColumns()

    const body = await request.json()
    const parse = bannerSchema.safeParse(body)
    if (!parse.success) {
      const firstIssue = parse.error.issues[0]
      return NextResponse.json(
        {
          error: firstIssue?.message || "Please check the form and try again",
          issues: parse.error.flatten(),
        },
        { status: 400 },
      )
    }
    const data = parse.data
    const isHomeHero = data.placement === "home_hero"
    const displayPages = isHomeHero
      ? ["home"]
      : data.display_pages?.length
        ? data.display_pages
        : ["all"]
    const isDismissible = isHomeHero ? false : data.is_dismissible
    const autoDisappear = isHomeHero ? 0 : data.auto_disappear_seconds

    const [banner] = await sql`
      INSERT INTO banners (
        title, message, banner_type, background_color, text_color,
        button_text, button_link, button_color,
        background_image_url, auto_disappear_seconds, redisplay_after_minutes,
        placement,
        display_pages, is_active,
        start_date, end_date,
        priority, is_dismissible
      ) VALUES (
        ${data.title}, ${data.message}, ${data.banner_type},
        ${data.background_color}, ${data.text_color},
        ${data.button_text}, ${data.button_link}, ${data.button_color},
        ${data.background_image_url}, ${autoDisappear}, ${data.redisplay_after_minutes},
        ${data.placement},
        ${displayPages}, ${data.is_active},
        ${data.start_date || null}, ${data.end_date || null},
        ${data.priority}, ${isDismissible}
      )
      RETURNING *
    `

    return NextResponse.json(banner)
  } catch (error) {
    console.error("Error creating banner:", error)
    return NextResponse.json(
      {
        error: "Failed to create banner",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
