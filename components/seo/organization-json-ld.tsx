import { getSiteUrl, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo"

export default function OrganizationJsonLd() {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    email: "sabsonlinestore@gmail.com",
    foundingDate: "2015",
    description:
      "Sabs Online Store offers authentic beauty, skincare, and cosmetics with delivery across UAE and India.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "23/384/A62 Prince Tower, Near KNH Hospital, Railway Station Road Uppala",
      addressLocality: "Kasaragod",
      addressCountry: "IN",
    },
    areaServed: ["AE", "IN"],
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
