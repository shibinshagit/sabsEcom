import type { Metadata } from "next"
import HomeClient from "./home-client"
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, getSiteUrl } from "@/lib/seo"
import { getPublicProducts } from "@/lib/products/get-public-products"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    type: "website",
  },
}

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getPublicProducts>> = []
  try {
    products = await getPublicProducts()
  } catch (error) {
    console.error("Failed to server-render products:", error)
  }
  return <HomeClient initialProducts={products} />
}
