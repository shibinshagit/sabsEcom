"use client"

import Navbar from "@/components/ui/navbar"
import HeroSection from "@/components/ui/hero-section"
import FeaturedMenu from "@/components/sections/featured-menu"
import AboutSection from "@/components/sections/about-section"
import TestimonialsSection from "@/components/sections/testimonials-section"
import Footer from "@/components/ui/footer"
import CategoriesStories from "@/components/sections/categories-stories"
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts } from "@/lib/store/slices/productSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HomePage() {
  // Latest Items logic
  const dispatch = useDispatch<AppDispatch>()
  const { items: products, loading } = useSelector((state: RootState) => state.products)
  useEffect(() => { dispatch(fetchProducts()) }, [dispatch])
  const latestProducts = products.slice(0, 6) // Show 6 latest

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoriesStories />
      <FeaturedMenu />
      <AboutSection />
      <TestimonialsSection />
      {/* Latest Items Section */}
      <section className="py-16 bg-gradient-to-b from-amber-50 via-white to-amber-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-amber-700 mb-8 text-center">Latest Items</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-64 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestProducts.map((item) => (
                <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 animate-slide-up rounded-2xl border-0 bg-white/70 backdrop-blur-xl shadow-gold relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-yellow-300/60 z-10" style={{boxShadow: '0 0 0 2px #ffe06655'}} />
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <Image
                      src={item.image_url || `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300 rounded-t-2xl border-b-2 border-gray-200/40"
                    />
                    {item.is_new && (
                      <Badge className="absolute top-4 left-4 animate-pulse bg-yellow-400 text-black shadow-md border border-white/60">NEW</Badge>
                    )}
                    {item.is_featured && !item.is_new && (
                      <Badge className="absolute top-4 left-4 bg-yellow-400 text-black shadow-md border border-white/60">Featured</Badge>
                    )}
                  </div>
                  <CardContent className="p-6 flex flex-col gap-3">
                    <h3 className="font-playfair text-2xl font-bold mb-1 text-gray-900 leading-tight tracking-tight line-clamp-1">{item.name}</h3>
                    <p className="text-gray-500 text-base mb-2 line-clamp-2 italic">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-yellow-600">₹{item.price}</span>
                      <Button size="sm" className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold rounded-full px-5 py-2">Add to Cart</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* <Footer /> */}
    </main>
  )
}
