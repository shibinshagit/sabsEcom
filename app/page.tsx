"use client"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import UserCoupons from "@/components/sections/user-coupons"
import ProductList from "@/components/sections/product-list"
import { ProductListSkeleton } from "@/components/sections/product-list-skeleton"
import BeforeAfterVideoSection from "@/components/sections/before-after-video-section"
import { useAuth } from "@/lib/contexts/auth-context"
import { Suspense } from "react"

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  return (
    <main className="min-h-screen">

      <Navbar />
      {!isAuthenticated && <NewUserSpinnerSection />}

      {/* {isAuthenticated && (
        <section className="mt-4">z
          <UserCoupons />
        </section>
      )} */}
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      
      </Suspense>
      <BeforeAfterVideoSection />
      <Services />
      <Footer />
    </main>
  )
}