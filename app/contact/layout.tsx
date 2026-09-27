import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getSiteUrl, SITE_SHORT_NAME } from "@/lib/seo"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Sabs Online Store for beauty and skincare orders, delivery questions, and support across UAE and India.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `Contact Us | ${SITE_SHORT_NAME}`,
    description:
      "Get in touch with Sabs Online Store for product and delivery support in UAE and India.",
    url: `${siteUrl}/contact`,
    type: "website",
  },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
