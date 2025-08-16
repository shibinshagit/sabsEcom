"use client"

import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import OfferSection from "@/components/sections/offer-section"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import ProductList from "@/components/sections/product-list"
import { useAuth } from "@/lib/contexts/auth-context"
import { Suspense } from "react"

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Loading navbar...</div>}>
        <Navbar />
      </Suspense>

      <OfferSection />
      {!isAuthenticated && <NewUserSpinnerSection />}
      <Services />
      <ProductList />
      <Footer />
    </main>
  )
}
