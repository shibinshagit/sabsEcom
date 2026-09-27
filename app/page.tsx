import type { Metadata } from "next"
import HomeClient from "./home-client"
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, getSiteUrl } from "@/lib/seo"

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

export default function HomePage() {
  return <HomeClient />
}
