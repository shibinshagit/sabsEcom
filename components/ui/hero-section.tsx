"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useShop } from "@/lib/contexts/shop-context"

interface Slide {
  id: number
  title: string
  subtitle: string
  image_url: string
  button_text: string
  button_link: string
  is_active: boolean
  sort_order: number
}

export default function HeroSection() {
  const { shop } = useShop()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSlides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop])

  const fetchSlides = async () => {
    try {
      const response = await fetch(`/api/slider?shop=${shop}`)
      if (response.ok) {
        const data = await response.json()
        setSlides(data)
      }
    } catch (error) {
      console.error("Failed to fetch slides:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [slides.length])

  if (loading) {
    return (
      <section className="relative h-screen overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className={`absolute inline-flex h-40 w-40 rounded-full ${shop === "A" ? "bg-gradient-to-tr from-yellow-400 via-yellow-500 to-yellow-700" : "bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500"} opacity-80 blur-2xl animate-pulse`} />
            <span className={`absolute inline-flex h-44 w-44 rounded-full border-4 ${shop === "A" ? "border-yellow-400" : "border-gray-400"} opacity-60 animate-spin-slow`} />
            <Image
              src="/logo.png"
              alt="Logo"
              width={90}
              height={90}
              className={`relative z-10 rounded-full shadow-lg border-4 ${shop === "A" ? "border-yellow-400" : "border-gray-400"} bg-white p-2`}
              priority
            />
          </div>
        </div>
      </section>
    )
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome to SABS-STORE</h1>
            <p className="text-xl mb-8">Premium Beauty & Accessories</p>
            <Link href="/products">
              <Button className={`${shop === "A"
                ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black border border-yellow-300"
                : "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 hover:from-gray-400 hover:via-gray-500 hover:to-gray-600 text-black border border-gray-300"} font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300`}>
                View Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image_url || "/placeholder.svg"}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            {slides[currentSlide]?.title}
          </h1>
          {slides[currentSlide]?.subtitle && (
            <p className="text-xl md:text-2xl text-gray-200 mb-8 animate-slide-up">{slides[currentSlide].subtitle}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            {slides[currentSlide]?.button_text && slides[currentSlide]?.button_link && (
              <Link href={slides[currentSlide].button_link}>
                <Button size="lg" className={`${shop === "A"
                  ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black border border-yellow-300"
                  : "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 hover:from-gray-400 hover:via-gray-500 hover:to-gray-600 text-black border border-gray-300"} font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300`}>
                  {slides[currentSlide].button_text}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
            {/* <Link href="/reservations">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3 bg-transparent"
              >
                Make Reservation
              </Button>
            </Link> */}
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? shop === "A"
                    ? "bg-amber-500"
                    : "bg-gray-400"
                  : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 animate-bounce">
        <div className={`w-6 h-10 border-2 rounded-full flex justify-center ${shop === "A" ? "border-white" : "border-gray-300"}`}>
          <div className={`w-1 h-3 rounded-full mt-2 animate-pulse ${shop === "A" ? "bg-white" : "bg-gray-300"}`} />
        </div>
      </div>
    </section>
  )
}
