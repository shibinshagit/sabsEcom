import { Metadata } from "next"
import { ReactNode } from "react"
import ProductJsonLd from "@/components/seo/product-json-ld"
import { sql } from "@/lib/database"
import { getSiteUrl, SITE_SHORT_NAME } from "@/lib/seo"

interface ProductLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

async function fetchProduct(id: string) {
  if (!id || isNaN(Number(id))) return null

  const [product] = await sql`
    SELECT
      p.*,
      c.name AS category_name,
      rs.average_rating,
      rs.review_count,
      COALESCE(
        json_agg(
          json_build_object(
            'id', v.id,
            'name', v.name,
            'price_aed', v.price_aed,
            'price_inr', v.price_inr,
            'discount_aed', v.discount_aed,
            'discount_inr', v.discount_inr,
            'available_aed', v.available_aed,
            'available_inr', v.available_inr,
            'stock_quantity', v.stock_quantity
          ) ORDER BY v.id
        ) FILTER (WHERE v.id IS NOT NULL),
        '[]'::json
      ) AS variants
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants v ON p.id = v.product_id
    LEFT JOIN (
      SELECT
        product_id,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)::int AS review_count
      FROM product_reviews
      WHERE is_visible = TRUE AND is_approved = TRUE
      GROUP BY product_id
    ) rs ON rs.product_id = p.id
    WHERE p.id = ${Number(id)}
    GROUP BY p.id, c.name, rs.average_rating, rs.review_count
  `

  return product || null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const product = await fetchProduct(id)

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found at Sabs Online Store.",
      }
    }

    const productImage = product.image_urls?.[0] || "/logo.png"
    const productName = product.name || "Product"
    const productDescription =
      product.description ||
      `Shop ${productName} at ${SITE_SHORT_NAME}. Authentic beauty and skincare with delivery in UAE and India.`
    const shopName =
      product.shop_category === "A"
        ? "Beauty"
        : product.shop_category === "B"
          ? "Style"
          : "Beauty & Style"

    const title = `${productName} | ${SITE_SHORT_NAME} ${shopName}`
    const description = `${productDescription.slice(0, 155)}${productDescription.length > 155 ? "…" : ""}`
    const productUrl = `${getSiteUrl()}/product/${id}`
    const imageUrl = String(productImage).startsWith("http")
      ? String(productImage)
      : `${getSiteUrl()}${productImage}`

    return {
      title,
      description,
      alternates: {
        canonical: `/product/${id}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: productUrl,
        siteName: SITE_SHORT_NAME,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: productName,
          },
        ],
        locale: "en_IN",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@sabsonline",
        site: "@sabsonline",
      },
      other: {
        "product:brand": product.brand || "SABS",
        "product:category": product.category_name || "Beauty & Cosmetics",
        "product:availability": product.is_available ? "in stock" : "out of stock",
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Beauty Products",
      description: `Discover authentic beauty and skincare at ${SITE_SHORT_NAME} with delivery in UAE and India.`,
    }
  }
}

export default async function ProductLayout({ children, params }: ProductLayoutProps) {
  const { id } = await params
  let product = null
  try {
    product = await fetchProduct(id)
  } catch {
    product = null
  }

  return (
    <>
      {product ? <ProductJsonLd product={product as any} /> : null}
      {children}
    </>
  )
}
