import { buildPageMetadata } from "@/lib/page-metadata"

export const metadata = buildPageMetadata({
  title: "Return and Refund Policy",
  description:
    "Sabs Online returns for beauty products. Unopened sealed items can be returned within 7 days. Opened cosmetics are not eligible, except for damage claims.",
  path: "/return-refund-policy",
})

export default function ReturnPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
