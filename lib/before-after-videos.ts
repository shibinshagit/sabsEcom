import { z } from "zod"

export const videoContentTypes = ["before", "after", "result"] as const
export const videoShopTypes = ["A", "B", "Both"] as const
export const videoMediaTypes = ["image", "video"] as const

const isValidMediaUrl = (value: string) => {
  if (!value || value.trim() === "") return false
  if (value.startsWith("/")) return true

  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export const beforeAfterVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().optional().default(""),
  media_type: z.enum(videoMediaTypes).default("video"),
  before_image_url: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isValidMediaUrl(v), "Before image URL must be a valid URL or path"),
  after_image_url: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isValidMediaUrl(v), "After image URL must be a valid URL or path"),
  result_video_url: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isValidMediaUrl(v), "Video URL must be a valid URL or path"),
  thumbnail_url: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isValidMediaUrl(v), "Thumbnail URL must be a valid URL or path"),
  content_type: z.enum(videoContentTypes).default("before"),
  shop: z.enum(videoShopTypes).default("Both"),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.media_type === "image") {
    if (!value.before_image_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["before_image_url"],
        message: "Before image is required for image content",
      })
    }
    if (!value.after_image_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["after_image_url"],
        message: "After image is required for image content",
      })
    }
  }

  if (value.media_type === "video" && !value.result_video_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["result_video_url"],
      message: "Video file is required for video content",
    })
  }
})

export type BeforeAfterVideoInput = z.infer<typeof beforeAfterVideoSchema>
