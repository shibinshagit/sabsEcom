import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

import { StoreProvider } from "@/lib/store/provider"
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { ShopProvider } from "@/lib/contexts/shop-context"
import UserNavVisibility from "@/components/ui/user-nav-visibility"
import { CurrencyProvider } from '@/lib/contexts/currency-context'
import WishlistSync from '@/components/wishlist-sync'
import CartSync from '@/components/cart-sync'
import { Toaster } from 'react-hot-toast'
import ConditionalCountrySelection from '@/components/ui/conditional-country-selection'
import { Analytics } from '@vercel/analytics/next'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  getSiteUrl,
  SITE_NAME,
  SITE_SHORT_NAME,
} from "@/lib/seo"
import OrganizationJsonLd from "@/components/seo/organization-json-ld"

import {
  ClerkProvider,
} from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_SHORT_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_SHORT_NAME }],
  creator: SITE_SHORT_NAME,
  publisher: SITE_SHORT_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: `${SITE_SHORT_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo.png"],
    creator: "@sabsonline",
    site: "@sabsonline",
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  category: "shopping",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${playfair.variable} font-sans`}>
          <OrganizationJsonLd />
          <AuthProvider>
            <SettingsProvider>
              <StoreProvider>
                <ShopProvider>
                  <CurrencyProvider>
                    <WishlistSync />
                    <CartSync />
                    <UserNavVisibility />
                    <ConditionalCountrySelection />
                    <Toaster 
                      position="top-center"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                      }}
                    />
                    <div className="pb-16 lg:pb-0">{children}</div>
                  </CurrencyProvider>
                </ShopProvider>
              </StoreProvider>
            </SettingsProvider>
          </AuthProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
