import type { MetadataRoute } from "next"
import { sql } from "@/lib/database"
import { getSiteUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/shipping-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/return-refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/cancellation-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms-of-service`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  try {
    const [products, categories] = await Promise.all([
      sql`
        SELECT id, created_at
        FROM products
        WHERE is_available = TRUE
        ORDER BY id DESC
        LIMIT 5000
      `,
      sql`
        SELECT id, slug, name
        FROM categories
        WHERE is_active = TRUE
        ORDER BY sort_order, name
        LIMIT 500
      `,
    ])

    const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${siteUrl}/product/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${siteUrl}/products?category=${encodeURIComponent(c.slug || String(c.id))}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...categoryRoutes, ...productRoutes]
  } catch (error) {
    console.error("Sitemap generation failed:", error)
    return staticRoutes
  }
}
