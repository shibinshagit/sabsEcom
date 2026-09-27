import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/order",
          "/wishlist",
          "/sso-callback",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
