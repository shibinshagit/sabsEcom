
// import Navbar from "@/components/ui/navbar"
// import Footer from "@/components/ui/footer"
// import OfferSection from "@/components/sections/offer-section"
// import Services from "@/components/sections/services"
// import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
// import ProductList from "@/components/sections/product-list"

// export default function HomePage() {
//   return (
//     <main className="min-h-screen">
//       <Navbar />
//       <OfferSection/>
//       <NewUserSpinnerSection/>
//       <Services/>
//       <ProductList/>
//       <Footer />
//     </main>
//   )
// }

"use client"

import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import OfferSection from "@/components/sections/offer-section"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import ProductList from "@/components/sections/product-list"
import { useAuth } from "@/lib/contexts/auth-context"

export default function HomePage() {
  const { isAuthenticated } = useAuth() // Using the same useAuth hook as Navbar

  return (
    <main className="min-h-screen">
      <Navbar />
      <OfferSection />
      {!isAuthenticated && <NewUserSpinnerSection />}
      <Services />
      <ProductList />
      <Footer />
    </main>
  )
}