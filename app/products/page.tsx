"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts, fetchCategories, setSelectedCategory } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import Navbar from "@/components/ui/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Footer from "@/components/ui/footer"
import { useSearchParams } from "next/navigation"

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items, categories, selectedCategory, loading } = useSelector((state: RootState) => state.products)
  const { formatPrice } = useSettings()
  const [searchTerm, setSearchTerm] = useState("")

  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category")

  const { shop } = useShop();

  // Theme colors
  const theme = shop === "A"
    ? {
        accent: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-400",
        badge: "bg-yellow-400 text-black",
        price: "text-yellow-600",
        shadow: "shadow-gold",
        btn: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black border-yellow-400",
        star: "fill-yellow-400 text-yellow-400",
      }
    : {
        accent: "bg-gradient-to-r from-gray-200 via-gray-300 to-white text-gray-900 border-gray-400",
        badge: "bg-gradient-to-r from-gray-300 via-gray-400 to-white text-gray-900 border-gray-400",
        price: "text-gray-500",
        shadow: "shadow-platinum",
        btn: "bg-gradient-to-r from-gray-200 via-gray-300 to-white hover:from-gray-300 hover:to-gray-400 text-gray-900 border-gray-300",
        star: "fill-gray-400 text-gray-400",
      }

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())

    if (categoryFromUrl) {
      dispatch(setSelectedCategory(Number(categoryFromUrl)))
    }
  }, [dispatch, categoryFromUrl])

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-64 bg-black flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="/product.jpg"
            alt="Menu Background"
            fill
            className="object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="font-playfair text-5xl font-bold text-white mb-4">Our Products</h1>
          <p className="text-xl text-gray-200">Premium Cosmetics & Gadgets</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 h-12 rounded-full bg-white/70 backdrop-blur-md border-2 ${shop === "A" ? "border-yellow-300/60 focus:border-yellow-400" : "border-gray-300/60 focus:border-gray-400"} shadow-lg font-medium text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-yellow-100/40 focus:outline-none`}
                style={{ boxShadow: shop === "A" ? '0 2px 8px #ffe06633' : '0 2px 8px #bfc1c633' }}
              />
            </div>
          </div>
          <div className="w-full overflow-x-auto py-2 scrollbar-hide">
            <div className="flex gap-2 px-2 min-w-max">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => dispatch(setSelectedCategory(null))}
                className={`rounded-full px-5 py-2 font-semibold shadow transition-all duration-200
                  ${selectedCategory === null
                    ? shop === "A"
                      ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-400"
                      : "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-black border-gray-400"
                    : "bg-white/10 text-gray-700 border border-gray-300"
                  }`}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => dispatch(setSelectedCategory(category.id))}
                  className={`rounded-full px-5 py-2 font-semibold shadow transition-all duration-200
                    ${selectedCategory === category.id
                      ? shop === "A"
                        ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-400"
                        : "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-black border-gray-400"
                      : "bg-white/10 text-gray-700 border border-gray-300"
                    }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, i) => (
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
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className={`group hover:shadow-2xl transition-all duration-300 animate-slide-up rounded-2xl border-0 bg-white/70 backdrop-blur-xl ${theme.shadow} relative overflow-hidden`} // Add relative for border
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Premium border overlay */}
                <div className={`absolute inset-0 pointer-events-none rounded-2xl border-2 ${shop === "A" ? "border-yellow-300/60" : "border-gray-300/60"} z-10`} style={{boxShadow: shop === "A" ? '0 0 0 2px #ffe06655' : '0 0 0 2px #bfc1c655'}} />
                <div className="relative overflow-hidden rounded-t-2xl">
                  <Image
                    src={
                      item.image_url || `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(item.name)}`
                    }
                    alt={item.name}
                    width={400}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300 rounded-t-2xl border-b-2 border-gray-200/40"
                  />
                  {item.is_new && (
                    <Badge className={`absolute top-4 left-4 animate-pulse ${theme.badge} shadow-md border border-white/60`}>NEW</Badge>
                  )}
                  {item.is_featured && !item.is_new && (
                    <Badge className={`absolute top-4 left-4 ${theme.badge} shadow-md border border-white/60`}>Featured</Badge>
                  )}
                  {item.is_featured && item.is_new && (
                    <Badge className={`absolute top-4 left-4 top-12 ${theme.badge} shadow-md border border-white/60`}>Featured</Badge>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center font-semibold shadow">
                      <Star className={`w-4 h-4 mr-1 ${theme.star}`} />
                      4.8
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 flex flex-col gap-3">
                  <h3 className="font-playfair text-2xl font-bold mb-1 text-gray-900 leading-tight tracking-tight line-clamp-1">{item.name}</h3>
                  <p className="text-gray-500 text-base mb-2 line-clamp-2 italic">{item.description}</p>

                  {item.features && item.features.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Key contents</p>
                      <div className="flex flex-wrap gap-1">
                        {item.features.slice(0, 3).map((feature: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 rounded-full border border-gray-300/60 bg-white/60 text-gray-700 font-medium">
                            {feature}
                          </Badge>
                        ))}
                        {item.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full border border-gray-300/60 bg-white/60 text-gray-700 font-medium">
                            +{item.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {item.specifications_text && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Specifications</p>
                      <p className="text-sm text-blue-500 font-medium">{item.specifications_text}</p>
                    </div>
                  )}

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className={`text-3xl font-extrabold ${theme.price} drop-shadow-sm`}>{formatPrice(item.price)}</span>
                      {item.warranty_months && <p className="text-xs text-gray-400 mt-1">{item.warranty_months} months Expiry</p>}
                    </div>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className={`${theme.btn} rounded-full px-6 py-2 font-bold shadow-lg border-2 ${shop === "A" ? "border-yellow-300/60" : "border-gray-300/60"} text-base`}
                      disabled={!item.is_available}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {item.is_available ? "Add to Cart" : "Unavailable"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
