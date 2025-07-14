"use client"

import { useState, useEffect } from "react"
import { Quote, Star } from "lucide-react"
import Image from "next/image"

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

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials")
      if (response.ok) {
        const data = await response.json()
        // Filter to show only featured testimonials, fallback to all if none featured
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
    ))
  }

  if (loading) {
    return (
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-12 animate-fade-in">What Our Guests Say</h2>
          <div className="animate-pulse">
            <div className="bg-white shadow-lg rounded-xl p-10 md:p-16">
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-300 rounded mb-8 w-1/2 mx-auto"></div>
              <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-12 animate-fade-in">What Our Guests Say</h2>
          <div className="bg-white shadow-lg rounded-xl p-10 md:p-16">
            <p className="text-gray-600 text-lg">No testimonials available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-12 animate-fade-in">What Our Guests Say</h2>

        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            className={`transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
          >
            <div className="relative bg-white shadow-lg rounded-xl p-10 md:p-16 animate-scale-in">
              <Quote className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 text-amber-500 bg-white rounded-full p-2" />
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6">{testimonial.review_text}</p>

              {/* Rating */}
              <div className="flex justify-center mb-6">{renderStars(testimonial.rating)}</div>

              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4">
                  {testimonial.customer_avatar ? (
                    <Image
                      src={testimonial.customer_avatar || "/placeholder.svg"}
                      alt={testimonial.customer_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl font-bold">{testimonial.customer_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-xl">{testimonial.customer_name}</h3>
                {testimonial.customer_role && <span className="text-gray-500">{testimonial.customer_role}</span>}
              </div>
            </div>
          </div>
        ))}

        {/* Indicators */}
        {testimonials.length > 1 && (
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-colors ${i === current ? "bg-amber-500" : "bg-gray-400"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
