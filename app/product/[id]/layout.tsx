import { Metadata } from "next"
import { ReactNode } from "react"
import ProductJsonLd from "@/components/seo/product-json-ld"
import { getProductById } from "@/lib/products/get-product"
import { getSiteUrl, SITE_SHORT_NAME } from "@/lib/seo"

interface ProductLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const product = await getProductById(id)

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
    product = await getProductById(id)
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
