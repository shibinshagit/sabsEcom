import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getSiteUrl, SITE_SHORT_NAME } from "@/lib/seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Shop Beauty & Skincare Products",
  description:
    "Browse Sabs Online beauty, skincare, and cosmetics — serums, creams, sun care, and more. Shop with AED or INR pricing and doorstep delivery in UAE and India.",
  keywords: [
    "shop beauty products online",
    "Sabs skincare",
    "cosmetics UAE",
    "cosmetics India",
    "buy serum online",
    "buy cream online",
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: `Shop Beauty & Skincare | ${SITE_SHORT_NAME}`,
    description:
      "Explore authentic Sabs beauty and skincare products with delivery across UAE and India.",
    url: `${siteUrl}/products`,
    type: "website",
  },
}

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return children
}
