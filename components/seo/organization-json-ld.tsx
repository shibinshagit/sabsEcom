import { getSiteUrl, SITE_NAME, SITE_SHORT_NAME } from "@/lib/seo"
import {
  STORE_EMAIL,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
  STORE_PHONE_TEL,
  STORE_WHATSAPP_URL,
} from "@/lib/store-info"

export default function OrganizationJsonLd() {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    email: STORE_EMAIL,
    telephone: STORE_PHONE_TEL,
    foundingDate: "2015",
    description:
      "Sabs Online Store offers authentic beauty, skincare, and cosmetics with delivery across UAE and India.",
    address: [
      {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressCountry: "AE",
        description: "Where Sabs began in 2015. UAE customer orders.",
      },
      {
        "@type": "PostalAddress",
        streetAddress: "23/384/A62 Prince Tower, Near KNH Hospital, Railway Station Road Uppala",
        addressLocality: "Kasaragod",
        addressCountry: "IN",
        description: "India fulfillment office.",
      },
    ],
    areaServed: ["AE", "IN"],
    sameAs: [STORE_FACEBOOK_URL, STORE_INSTAGRAM_URL, STORE_WHATSAPP_URL],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
