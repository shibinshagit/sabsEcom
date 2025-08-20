import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

import { StoreProvider } from "@/lib/store/provider"
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { ShopProvider } from "@/lib/contexts/shop-context"
import UserNavVisibility from "@/components/ui/user-nav-visibility"

import {
  ClerkProvider,
} from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "SABS - ONLINE STORE",
  description: "Your trusted source for GADGETS AND COSMETICS.",
  generator: "Shah",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${playfair.variable} font-sans`}>
          {/* Remove the Clerk header completely */}
          <AuthProvider>
            <SettingsProvider>
              <StoreProvider>
                <ShopProvider>
                  {/* Your existing User Nav */}
                  <UserNavVisibility />

                  <div className="pb-16 lg:pb-0">{children}</div>
                </ShopProvider>
              </StoreProvider>
            </SettingsProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

