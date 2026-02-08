
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchCategories } from "@/lib/store/slices/productSlice"
import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"

export default function CategoriesStories() {
  const dispatch = useDispatch<AppDispatch>()
  const { categories, loading } = useSelector((state: RootState) => state.products)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const { shop } = useShop()

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const theme = {
    bg: "bg-background",
    border: "border-border",
    ring: "bg-foreground",
    ringInactive: "bg-muted",
    innerRing: "bg-background",
    text: "text-muted-foreground",
    textActive: "text-foreground",
    shadow: "shadow-sm",
    icon: Sparkles,
  }

  const sortedCategories = [...categories].sort((a, b) => {
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  if (loading) {
    return (
      <section className={`py-6 ${theme.bg} border-b ${theme.border} sticky top-20 z-40 ${theme.shadow}`}>
        <div className="px-4">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className={`w-20 h-20 ${theme.ringInactive} mb-3 p-1`}>
                  <div className={`w-full h-full ${theme.innerRing}`}></div>
                </div>
                <div className={`w-16 h-3 ${theme.ringInactive} mx-auto`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`py-6 ${theme.bg} border-b ${theme.border} sticky top-20 z-40 ${theme.shadow}`}
    >
      <div className="px-4">
        <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-2">
          {sortedCategories.map((category, index) => {
            const isActive = activeCategory === category.id
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="flex-shrink-0 text-center group transform transition-all duration-300 hover:scale-105"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  {/* Enhanced Story Ring */}
                  <div
                    className={`w-20 h-20 p-1 transition-all duration-500 transform ${
                      isActive ? `${theme.ring} scale-105 shadow-sm` : theme.ringInactive
                    }`}
                  >
                    <div className={`w-full h-full ${theme.innerRing} p-1 transition-all duration-300`}>
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={
                            category.image_url ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(category.name) || "/placeholder.svg"}`
                          }
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Overlay effect */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Floating icon */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1">
                      <theme.icon className="w-4 h-4 text-foreground animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <p
                  className={`text-xs mt-3 font-medium transition-all duration-300 ${
                    isActive ? `${theme.textActive} font-semibold` : theme.text
                  }`}
                >
                  {category.name.length > 12 ? `${category.name.substring(0, 12)}...` : category.name}
                </p>

                {/* Active indicator */}
                {isActive && (
                  <div className="w-1 h-1 mx-auto mt-1 bg-foreground animate-pulse" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
