import Navbar from "@/components/ui/navbar"
import HeroSection from "@/components/ui/hero-section"
import FeaturedMenu from "@/components/sections/featured-menu"
import AboutSection from "@/components/sections/about-section"
import TestimonialsSection from "@/components/sections/testimonials-section"
import Footer from "@/components/ui/footer"
import CategoriesStories from "@/components/sections/categories-stories"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoriesStories />
      <FeaturedMenu />
      <AboutSection />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
