import { Metadata } from 'next'
import AboutPageClient from './about-client'
import { getSiteUrl, SITE_SHORT_NAME } from '@/lib/seo'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Sabs Online Store began in Dubai in 2015. Discover our story and commitment to authentic beauty, skincare, and cosmetics with delivery across UAE and India.',
  keywords: [
    'about sabs online',
    'Sabs Online Store',
    'beauty products company',
    'skincare brand Dubai',
    'cosmetics retailer India',
    'authentic beauty products',
    'online beauty store UAE',
  ],
  authors: [{ name: `${SITE_SHORT_NAME} Team` }],
  creator: SITE_SHORT_NAME,
  publisher: SITE_SHORT_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: `About Us | ${SITE_SHORT_NAME}`,
    description:
      'Learn how Sabs Online grew from Dubai in 2015 into a trusted beauty and skincare store serving UAE and India.',
    type: 'website',
    url: `${siteUrl}/about`,
    siteName: SITE_SHORT_NAME,
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: `${SITE_SHORT_NAME} — Beauty & Skincare`,
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `About Us | ${SITE_SHORT_NAME}`,
    description:
      'Our story, mission, and commitment to quality beauty and skincare products.',
    images: ['/logo.png'],
    creator: '@sabsonline',
  },
  alternates: {
    canonical: '/about',
  },
  other: {
    'business:contact_data:street_address': '23/384/A62 Prince Tower, Near KNH Hospital',
    'business:contact_data:locality': 'Uppala',
    'business:contact_data:region': 'Kasaragod',
    'business:contact_data:postal_code': '671322',
    'business:contact_data:country_name': 'India',
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
