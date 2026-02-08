
"use client"

import { useState, useEffect } from "react"
import { Quote, Star, Sparkles } from "lucide-react"
import Image from "next/image"
import { useShop } from "@/lib/contexts/shop-context"

interface Testimonial {
  id: number
  customer_name: string
  customer_role: string
  customer_avatar: string
  review_text: string
  rating: number
  is_featured: boolean
  is_active: boolean
}

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const { shop } = useShop()

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials")
      if (response.ok) {
        const data = await response.json()
        const featured = data.filter((t: Testimonial) => t.is_featured)
        setTestimonials(featured.length > 0 ? featured : data.slice(0, 3))
      }
    } catch (error) {
      console.error("Failed to fetch testimonials:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (testimonials.length > 0) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % testimonials.length)
      }, 6000)
      return () => clearInterval(timer)
    }
  }, [testimonials.length])

  const theme = {
    bg: "bg-background",
    cardBg: "bg-card border border-border",
    title: "text-foreground",
    text: "text-muted-foreground",
    quote: "text-foreground",
    star: "fill-foreground text-foreground",
    indicator: "bg-foreground",
    indicatorInactive: "bg-muted",
    shadow: "shadow-sm",
    icon: Sparkles,
    floatingElements: "from-black/10 to-black/20",
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < rating ? theme.star : "text-gray-300"}`} />
    ))
  }

  const IconComponent = theme.icon

  if (loading) {
    return (
      <section id="testimonials" className={`py-24 ${theme.bg} relative overflow-hidden`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className={`text-5xl md:text-6xl font-bold mb-16 ${theme.title} animate-fade-in`}>
            What Our Customers Say
          </h2>
          <div className="animate-pulse">
            <div className={`${theme.cardBg} shadow-sm p-12 md:p-20`}>
              <div className="h-6 bg-muted mb-6"></div>
              <div className="h-6 bg-muted mb-6 w-3/4 mx-auto"></div>
              <div className="h-6 bg-muted mb-10 w-1/2 mx-auto"></div>
              <div className="w-24 h-24 bg-muted mx-auto mb-6"></div>
              <div className="h-6 bg-muted w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className={`py-24 ${theme.bg} relative overflow-hidden`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className={`text-5xl md:text-6xl font-bold mb-16 ${theme.title} animate-fade-in`}>
            What Our Customers Say
          </h2>
          <div className={`${theme.cardBg} shadow-sm p-12 md:p-20`}>
            <p className={`${theme.text} text-xl`}>No testimonials available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="testimonials" className={`py-24 ${theme.bg} relative overflow-hidden`}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 bg-gradient-to-r ${theme.floatingElements} animate-float opacity-40`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <div className="mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <IconComponent className="w-12 h-12 text-foreground animate-pulse" />
          </div>
          <h2 className={`text-5xl md:text-7xl font-bold mb-6 ${theme.title} leading-tight`}>What Our Customers Say</h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            {shop === "A" ? "Real stories from riders who trust our parts" : "Feedback from riders who love our accessories"}
          </p>
        </div>

        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            className={`transition-all duration-1000 ${
              i === current ? "opacity-100 scale-100" : "opacity-0 scale-95 h-0 overflow-hidden"
            }`}
          >
            <div
              className={`relative ${theme.cardBg} ${theme.shadow} p-12 md:p-20 animate-scale-in border transform hover:-translate-y-1 transition-all duration-500`}
            >
              <Quote
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 ${theme.quote} bg-white p-3 shadow-sm`}
              />

              <p className={`${theme.text} text-xl md:text-2xl leading-relaxed mb-8 font-light italic`}>
                "{testimonial.review_text}"
              </p>

              {/* Rating */}
              <div className="flex justify-center mb-8 gap-1">{renderStars(testimonial.rating)}</div>

              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 overflow-hidden mb-6 shadow-sm">
                  {testimonial.customer_avatar ? (
                    <Image
                      src={testimonial.customer_avatar || "/placeholder.svg"}
                      alt={testimonial.customer_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-foreground text-3xl font-bold">{testimonial.customer_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className={`font-bold text-2xl mb-2 ${theme.title}`}>{testimonial.customer_name}</h3>
                {testimonial.customer_role && (
                  <span className="text-muted-foreground text-lg">
                    {testimonial.customer_role}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Enhanced Indicators */}
        {testimonials.length > 1 && (
          <div className="flex justify-center space-x-4 mt-12">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-4 h-4 transition-all duration-300 transform hover:scale-125 ${
                  i === current ? `${theme.indicator} scale-125 shadow-sm` : theme.indicatorInactive
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
