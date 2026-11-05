import { buildPageMetadata } from "@/lib/page-metadata"

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How Sabs Online Store collects, uses, and protects your information when you shop for beauty and skincare in the UAE and India.",
  path: "/privacy-policy",
})

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
