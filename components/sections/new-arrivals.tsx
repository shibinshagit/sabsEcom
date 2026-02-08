
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ChevronRight, Tag, Grid3X3, List, SlidersHorizontal } from "lucide-react"
import Image from "next/image"

const NewArrivals: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryTransition, setCategoryTransition] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const { items, loading } = useSelector((state: RootState) => state.products)
  const { formatPrice } = useSettings()

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const newArrivals = items.filter((item) => item.is_new).slice(0, 12)

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  return (
    <div className="bg-background">
      <div className="hidden lg:block px-6 mt-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-foreground">New Arrivals</h3>
            <span className="text-muted-foreground">({newArrivals.length} items)</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {newArrivals?.length > 0 && (
        <div className="px-4 lg:px-6 mt-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-foreground" />
                <span className="font-bold text-lg lg:text-xl">New Arrivals</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {loading ? (
              <div
                className={`grid gap-3 lg:gap-6 ${
                  viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted h-40 lg:h-48 mb-3"></div>
                    <div className="h-4 bg-muted mb-2"></div>
                    <div className="h-4 bg-muted w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`grid gap-3 lg:gap-6 ${
                  viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {newArrivals.map((item) => (
                  <Card
                    key={item.id}
                    className={`bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                      <Image
                        src={
                          item.image_url ||
                          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                        }
                        alt={item.name}
                        width={200}
                        height={200}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "list" ? "w-full h-full" : "w-full h-40 lg:h-48"
                        }`}
                      />
                      <Badge className="absolute top-2 left-2 bg-foreground text-background text-xs">NEW</Badge>
                      {item.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-muted text-foreground text-xs">HOT</Badge>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs flex items-center">
                        <Star className="w-3 h-3 fill-white text-white mr-1" />
                        4.8
                      </div>
                    </div>

                    <CardContent className={`p-3 lg:p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-foreground font-bold text-sm lg:text-lg">{formatPrice(item.price)}</p>
                          <p className="text-muted-foreground text-xs lg:text-sm line-through">
                            {formatPrice(item.price * 1.6)}
                          </p>
                        </div>
                        <Badge className="bg-muted text-foreground text-xs">NEW</Badge>
                      </div>

                      <h3 className="text-sm lg:text-base font-medium text-foreground line-clamp-2 mb-2">{item.name}</h3>

                      {viewMode === "list" && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{item.description}</p>
                      )}

                      {item.features && item.features.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {item.features.slice(0, 2).map((feature: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs px-2 py-0.5 bg-muted text-muted-foreground"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-foreground text-foreground" />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">(4.8) • New</span>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-foreground text-background hover:bg-foreground/90 py-2 lg:py-3 text-sm lg:text-base font-medium"
                        disabled={!item.is_available}
                      >
                        {item.is_available ? "Add to Cart" : "Unavailable"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {newArrivals.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🆕</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No new arrivals yet</h3>
                <p className="text-muted-foreground">Check back soon for the latest products!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NewArrivals
