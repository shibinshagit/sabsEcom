"use client"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import UserCoupons from "@/components/sections/user-coupons"
import ProductList from "@/components/sections/product-list"
import { ProductListSkeleton } from "@/components/sections/product-list-skeleton"
import { useAuth } from "@/lib/contexts/auth-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Suspense } from "react"

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { shop } = useShop()
  return (
    <main
      className={`min-h-screen ${shop === "A" ? "bg-gradient-to-b from-rose-50 via-white to-violet-50/30" : ""}`}
    >

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
      <Services />
      <Footer />
    </main>
  )
}