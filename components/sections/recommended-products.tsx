"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/lib/contexts/currency-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Heart, ShoppingCart, Eye, Sparkles } from "lucide-react"
import Image from "next/image"

interface Variant {
  id: number
  name: string
  price_aed: number
  price_inr: number
  discount_aed?: number
  discount_inr?: number
  available_aed: boolean
  available_inr: boolean
  stock_quantity: number
}

interface Product {
  id: number
  name: string
  description: string
  image_urls: string[]
  category_id: number
  category_name: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  brand?: string
  model?: string
  shop_category: string
  variants: Variant[]
}

interface RecommendedProductsProps {
  currentProductId: number
  categoryId: number
  shopCategory: string
}

export default function RecommendedProducts({ 
  currentProductId, 
  categoryId, 
  shopCategory 
}: RecommendedProductsProps) {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedCurrency, getCurrencySymbol } = useCurrency()
  const { shop } = useShop()
  const router = useRouter()

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        setLoading(true)
        
        // Fetch products from the same category, excluding current product
        const response = await fetch(`/api/products/recommended?categoryId=${categoryId}&excludeId=${currentProductId}&shop=${shopCategory}&limit=8`)
        
        if (response.ok) {
          const data = await response.json()
          setRecommendedProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching recommended products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedProducts()
  }, [currentProductId, categoryId, shopCategory])

  const getProductPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return { price: 0, originalPrice: 0, hasDiscount: false }
    }

    const variant = product.variants[0] // Use first variant for display
    const isAED = selectedCurrency === 'AED'
    const isAvailable = isAED ? variant.available_aed : variant.available_inr
    
    if (!isAvailable) {
      return { price: 0, originalPrice: 0, hasDiscount: false }
    }

    const price = isAED ? variant.price_aed : variant.price_inr
    const discount = isAED ? (variant.discount_aed || 0) : (variant.discount_inr || 0)
    const finalPrice = discount > 0 ? discount : price
    const hasDiscount = discount > 0 && discount < price

    return {
      price: finalPrice,
      originalPrice: hasDiscount ? price : 0,
      hasDiscount
    }
  }

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recommended Products</h2>
            <p className="text-gray-600">Loading similar products...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (recommendedProducts.length === 0) {
    return null // Don't show section if no products
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2 text-center sm:text-left">
            Handpicked For You
          </h2>
          <p className="text-gray-600 text-sm max-w-xl mx-auto sm:mx-0 text-center sm:text-left">
            Similar products, selected to match this item.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {recommendedProducts.slice(0, 5).map((product) => {
            const { price, originalPrice, hasDiscount } = getProductPrice(product)
            const currencySymbol = getCurrencySymbol(selectedCurrency)

            return (
              <Card 
                key={product.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white border-0 shadow-md overflow-hidden"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={product.image_urls?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.is_new && (
                        <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                          New
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                          Featured
                        </Badge>
                      )}
                      {hasDiscount && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                          {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 backdrop-blur-sm hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProductClick(product.id)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      {price > 0 ? (
                        <>
                          <span className="text-sm font-bold text-orange-600">
                            {currencySymbol}{price}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-500 line-through">
                              {currencySymbol}{originalPrice}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Price not available</span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {product.category_name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">4.5</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="sm:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {recommendedProducts.slice(0, 6).map((product) => {
              const { price, originalPrice, hasDiscount } = getProductPrice(product)
              const currencySymbol = getCurrencySymbol(selectedCurrency)
              const discountPercent = hasDiscount && originalPrice > 0
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : 0

              return (
                <div 
                  key={product.id}
                  className="flex-none w-[220px] snap-start cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <Card className="group h-full overflow-hidden border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <Image
                          src={product.image_urls?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          {product.is_new && (
                            <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                              New
                            </Badge>
                          )}
                          {product.is_featured && (
                            <Badge className="bg-fuchsia-600 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                              Featured
                            </Badge>
                          )}
                        </div>

                        {discountPercent > 0 && (
                          <Badge className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                            {discountPercent}% OFF
                          </Badge>
                        )}

                        <button
                          type="button"
                          className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProductClick(product.id)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{product.brand}</p>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 mt-2 mb-2">
                          {price > 0 ? (
                            <>
                              <span className="text-sm font-bold text-fuchsia-700">
                                {currencySymbol}{price}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-500 line-through">
                                  {currencySymbol}{originalPrice}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Price not available</span>
                          )}
                        </div>

                        {/* Footer Meta */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-1 rounded-md truncate">
                            {product.category_name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">4.5</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* View More Button */}
        <div className="text-center mt-8">
          <Button
            onClick={() => router.push(`/products?category=${categoryId}`)}
            variant="outline"
            className="px-6 py-2 text-sm text-orange-600 border-orange-600 hover:bg-orange-50 hover:border-orange-700"
          >
            View More Similar Products
          </Button>
        </div>
      </div>
    </div>
  )
}
