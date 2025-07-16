"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function FeaturedMenu() {
  const dispatch = useDispatch<AppDispatch>()
  const { featuredItems, loading } = useSelector((state: RootState) => state.products)
  const { formatPrice } = useSettings()
  const { shop } = useShop()

  // Theme colors
  const theme = shop === "A"
    ? {
        accent: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-400",
        badge: "bg-yellow-400 text-black",
        price: "text-yellow-600",
        shadow: "shadow-gold",
        btn: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black border-yellow-400",
      }
    : {
        accent: "bg-gradient-to-r from-gray-200 via-gray-300 to-white text-gray-900 border-gray-400",
        badge: "bg-gradient-to-r from-gray-300 via-gray-400 to-white text-gray-900 border-gray-400",
        price: "text-gray-500",
        shadow: "shadow-platinum",
        btn: "bg-gradient-to-r from-gray-200 via-gray-300 to-white hover:from-gray-300 hover:to-gray-400 text-gray-900 border-gray-300",
      }

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold mb-4">Featured Products</h2>
            <div className={`w-24 h-1 mx-auto ${theme.accent}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 h-64 rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-600 text-lg mb-6">Discover our premium cosmetics collection</p>
          <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.slice(0, 6).map((item, index) => (
            <Card
              key={item.id}
              className={`group hover:shadow-2xl transition-all duration-300 animate-slide-up rounded-2xl border-0 bg-white/70 backdrop-blur-xl ${theme.shadow}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative overflow-hidden rounded-t-2xl">
                <Image
                  src={item.image_url || `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300 rounded-t-2xl"
                />
                {item.is_new && (
                  <Badge className={`absolute top-4 left-4 animate-pulse ${theme.badge}`}>NEW</Badge>
                )}
                {item.is_featured && !item.is_new && (
                  <Badge className={`absolute top-4 left-4 ${theme.badge}`}>Featured</Badge>
                )}
                {item.is_featured && item.is_new && (
                  <Badge className={`absolute top-4 left-4 top-12 ${theme.badge}`}>Featured</Badge>
                )}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/70 text-white px-2 py-1 rounded-full text-sm flex items-center">
                    <Star className={`w-4 h-4 ${shop === "A" ? "fill-yellow-400 text-yellow-400" : "fill-gray-400 text-gray-400"} mr-1`} />
                    4.9
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-playfair text-xl font-bold mb-2 text-gray-900">{item.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${theme.price}`}>{formatPrice(item.price)}</span>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    size="sm"
                    className={`${theme.btn} rounded-full px-5 py-2 font-semibold shadow`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {item.warranty_months && (
                  <p className="text-sm text-gray-500 mt-2">Expiry: {item.warranty_months} months</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/products">
            <Button size="lg" className={`${theme.btn} font-semibold px-8 rounded-full shadow`}>
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
