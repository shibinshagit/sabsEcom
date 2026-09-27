import { getSiteUrl, SITE_SHORT_NAME } from "@/lib/seo"

type ProductJsonLdProps = {
  product: {
    id: number | string
    name?: string
    description?: string
    brand?: string
    image_urls?: string[]
    is_available?: boolean
    category_name?: string
    variants?: Array<{
      price_aed?: number
      price_inr?: number
      discount_aed?: number
      discount_inr?: number
      available_aed?: boolean
      available_inr?: boolean
      stock_quantity?: number
    }>
    average_rating?: number
    review_count?: number
  }
}

function absoluteUrl(pathOrUrl: string, siteUrl: string) {
  if (!pathOrUrl) return `${siteUrl}/logo.png`
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl
  return `${siteUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`
}

export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const siteUrl = getSiteUrl()
  const images = (product.image_urls || [])
    .filter(Boolean)
    .map((url) => absoluteUrl(url, siteUrl))
  if (!images.length) images.push(`${siteUrl}/logo.png`)

  const variant = product.variants?.[0]
  const offers: Record<string, unknown>[] = []

  if (variant?.available_aed && (variant.discount_aed || variant.price_aed)) {
    const price = Number(variant.discount_aed || variant.price_aed || 0)
    if (price > 0) {
      offers.push({
        "@type": "Offer",
        url: `${siteUrl}/product/${product.id}`,
        priceCurrency: "AED",
        price: price.toFixed(2),
        availability:
          product.is_available && (variant.stock_quantity ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: SITE_SHORT_NAME,
        },
      })
    }
  }

  if (variant?.available_inr && (variant.discount_inr || variant.price_inr)) {
    const price = Number(variant.discount_inr || variant.price_inr || 0)
    if (price > 0) {
      offers.push({
        "@type": "Offer",
        url: `${siteUrl}/product/${product.id}`,
        priceCurrency: "INR",
        price: price.toFixed(2),
        availability:
          product.is_available && (variant.stock_quantity ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: SITE_SHORT_NAME,
        },
      })
    }
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || "Sabs Product",
    description:
      product.description ||
      `${product.name || "Beauty product"} available at ${SITE_SHORT_NAME}.`,
    image: images,
    sku: String(product.id),
    brand: {
      "@type": "Brand",
      name: product.brand || "SABS",
    },
    category: product.category_name || "Beauty & Cosmetics",
    url: `${siteUrl}/product/${product.id}`,
  }

  if (offers.length === 1) {
    jsonLd.offers = offers[0]
  } else if (offers.length > 1) {
    jsonLd.offers = offers
  }

  if (product.review_count && product.review_count > 0 && product.average_rating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.average_rating).toFixed(1),
      reviewCount: product.review_count,
      bestRating: "5",
      worstRating: "1",
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
