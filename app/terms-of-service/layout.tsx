import { buildPageMetadata } from "@/lib/page-metadata"

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms for shopping at Sabs Online Store, including orders, delivery in the UAE and India, and how we handle disputes.",
  path: "/terms-of-service",
})

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
