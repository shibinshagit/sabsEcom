import { buildPageMetadata } from "@/lib/page-metadata"

export const metadata = buildPageMetadata({
  title: "Shipping Policy",
  description:
    "Sabs Online shipping for UAE and India. Orders are processed Sunday to Thursday. Free shipping over AED 200 or ₹3000. Express delivery is AED 10 in the UAE.",
  path: "/shipping-policy",
})

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
