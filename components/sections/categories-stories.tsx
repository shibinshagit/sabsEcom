"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchCategories } from "@/lib/store/slices/productSlice"
import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function CategoriesStories() {
  const dispatch = useDispatch<AppDispatch>()
  const { categories, loading } = useSelector((state: RootState) => state.products)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  // Sort categories by sort_order
  const sortedCategories = [...categories].sort((a, b) => {
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  if (loading) {
    return (
      <section className="py-4 bg-white border-b border-gray-100">
        <div className="px-4">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
                <div className="w-12 h-3 bg-gray-300 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 bg-white border-b border-gray-100 sticky top-16 z-40">
      <div className="px-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {sortedCategories.map((category, index) => {
            const isActive = activeCategory === category.id

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="flex-shrink-0 text-center group"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <div className="relative">
                  {/* Story Ring */}
                  <div
                    className={`w-16 h-16 rounded-full p-0.5 transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-tr from-gray-400 to-gray-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <div className="w-full h-full bg-white rounded-full p-0.5">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={
                            category.image_url ||
                            `/placeholder.svg?height=60&width=60&query=${encodeURIComponent(category.name) || "/placeholder.svg"}`
                          }
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Name */}
                <p
                  className={`text-xs mt-2 font-medium transition-colors duration-200 ${
                    isActive ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {category.name.length > 10 ? `${category.name.substring(0, 10)}...` : category.name}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

