import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/seo"

export function buildPageMetadata(input: {
  title: string
  description: string
  path: string
}): Metadata {
  const url = `${getSiteUrl()}${input.path}`
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: "website",
    },
  }
}
