
import Navbar from "@/components/ui/navbar"
import FeaturedMenu from "@/components/sections/featured-menu"
import AboutSection from "@/components/sections/about-section"
import TestimonialsSection from "@/components/sections/testimonials-section"
import Footer from "@/components/ui/footer"
import CategoriesStories from "@/components/sections/categories-stories"
import OfferSection from "@/components/sections/offer-section"
import Services from "@/components/sections/services"
import NewUserSpinnerSection from "@/components/sections/new-user-spinner-section"
import NewArrivals from "@/components/sections/new-arrivals"
import ProductList from "@/components/sections/product-list"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <OfferSection/>
      <NewUserSpinnerSection/>
      <Services/>
      <NewArrivals/>
      <ProductList/>
      <Footer />
    </main>
  )
}