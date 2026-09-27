"use client"

import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import ProductList from "@/components/sections/product-list"
import { ProductListSkeleton } from "@/components/sections/product-list-skeleton"
import BeforeAfterVideoSection from "@/components/sections/before-after-video-section"
import HomeHeroBanner from "@/components/sections/home-hero-banner"
import { useAuth } from "@/lib/contexts/auth-context"
import { Suspense } from "react"

export default function HomeClient() {
  const { isAuthenticated } = useAuth()
  return (
    <main className="min-h-screen">
      <Navbar />
      <HomeHeroBanner />
      {!isAuthenticated && <NewUserSpinnerSection />}
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      </Suspense>
      <BeforeAfterVideoSection />
      <Services />
      <Footer />
    </main>
  )
}
