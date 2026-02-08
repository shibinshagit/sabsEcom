
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
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

  // Enhanced theming
  const theme = {
    bg: "bg-background",
    overlay: "bg-black/55",
    title: "text-white",
    subtitle: "text-white/80",
    button: "bg-foreground text-background hover:bg-foreground/90 border border-foreground",
    buttonSecondary: "border border-white text-white hover:bg-white hover:text-black",
    indicator: "bg-white",
    indicatorInactive: "bg-white/30",
    scroll: "border-white/60",
    scrollDot: "bg-white/60",
    loadingBg: "bg-background",
    loadingRing: "border-foreground",
    loadingGlow: "bg-foreground/20",
    icon: Sparkles,
    particles: "from-black/10 to-black/20",
  }

  const IconComponent = theme.icon

  if (loading) {
    return (
      <section className={`relative h-screen overflow-hidden ${theme.loadingBg}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span
              className={`absolute inline-flex h-40 w-40 ${theme.loadingGlow} opacity-80 blur-2xl animate-pulse`}
            />
            <span
              className={`absolute inline-flex h-44 w-44 border-4 ${theme.loadingRing} opacity-60 animate-spin-slow`}
            />
            <div className={`relative z-10 shadow-lg border-4 ${theme.loadingRing} bg-white p-6`}>
              <IconComponent className="w-12 h-12 text-gray-800" />
            </div>
          </div>
        </div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r ${theme.particles} animate-float`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (slides.length === 0) {
    return (
      <section className={`relative h-screen overflow-hidden ${theme.bg}`}>
        <div className={`absolute inset-0 ${theme.overlay}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <div className="mb-8">
              <IconComponent className="w-20 h-20 mx-auto mb-6 text-white animate-pulse" />
            </div>
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${theme.title} animate-fade-in`}>
              {shop === "A" ? "Spare Parts, Ready" : "Accessories That Fit"}
            </h1>
            <p className={`text-xl md:text-2xl mb-8 ${theme.subtitle} animate-slide-up`}>
              {shop === "A" ? "Genuine parts for a smooth ride" : "Everyday accessories for your bike and rider"}
            </p>
            <Link href="/products">
              <Button className={`${theme.button} font-semibold px-8 py-4 text-lg`}>
                {shop === "A" ? "Browse Parts" : "Browse Accessories"}
                <ArrowRight className="ml-2 w-5 h-5" />
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
          className={`absolute inset-0 transition-all duration-1000 ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <Image
            src={slide.image_url || "/placeholder.svg"}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className={`absolute inset-0 ${theme.overlay}`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <IconComponent className="w-16 h-16 mx-auto mb-6 text-white animate-pulse" />
          </div>
          <h1 className={`text-5xl md:text-8xl font-bold mb-6 ${theme.title} animate-fade-in leading-tight`}>
            {slides[currentSlide]?.title}
          </h1>
          {slides[currentSlide]?.subtitle && (
            <p className={`text-xl md:text-3xl mb-8 ${theme.subtitle} animate-slide-up font-light`}>
              {slides[currentSlide].subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-scale-in">
            {slides[currentSlide]?.button_text && slides[currentSlide]?.button_link && (
              <Link href={slides[currentSlide].button_link}>
                <Button
                  size="lg"
                  className={`${theme.button} font-semibold px-10 py-4 text-lg`}
                >
                  {slides[currentSlide].button_text}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button
              size="lg"
              variant="outline"
              className={`${theme.buttonSecondary} px-10 py-4 text-lg`}
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 transition-all duration-300 ${
                index === currentSlide ? `${theme.indicator} scale-125` : theme.indicatorInactive
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 animate-bounce">
        <div className={`w-8 h-12 border-2 flex justify-center ${theme.scroll}`}>
          <div className={`w-1 h-3 mt-2 animate-pulse ${theme.scrollDot}`} />
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${theme.particles} animate-float opacity-60`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>
    </section>
  )
}
