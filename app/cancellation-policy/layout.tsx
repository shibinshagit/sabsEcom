import { buildPageMetadata } from "@/lib/page-metadata"

export const metadata = buildPageMetadata({
  title: "Cancellation Policy",
  description:
    "How to cancel a Sabs Online order before it ships. Support is available Sunday to Thursday, 9:00 AM to 6:00 PM GST.",
  path: "/cancellation-policy",
})

export default function CancellationPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
