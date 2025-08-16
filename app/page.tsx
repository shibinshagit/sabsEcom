
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import OfferSection from "@/components/sections/offer-section"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import ProductList from "@/components/sections/product-list"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <OfferSection/>
      <NewUserSpinnerSection/>
      <Services/>
      <ProductList/>
      <Footer />
    </main>
  )
}