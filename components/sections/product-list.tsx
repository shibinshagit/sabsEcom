"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts, fetchCategories, setSelectedCategory } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useShop } from "@/lib/contexts/shop-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ChevronRight, Zap, Grid3X3, List, SlidersHorizontal, Tag, Heart, ChevronDown, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { addToWishlistAPI, removeFromWishlistAPI } from '@/lib/store/slices/wishlistSlice'

interface ProductListProps {
  showSpinner?: boolean
  onCloseSpinner?: () => void
}

export default function ProductList({ showSpinner = false, onCloseSpinner }: ProductListProps) {
  const { user, isAuthenticated } = useAuth()
  const [authInitialized, setAuthInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryTransition, setCategoryTransition] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Animation states
  const [showBlur, setShowBlur] = useState(false)
  const [animationType, setAnimationType] = useState<'cart' | 'wishlist' | null>(null)

  const dispatch = useDispatch<AppDispatch>()
  const { items, categories, selectedCategory, loading } = useSelector((state: RootState) => state.products)
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const { selectedCurrency, formatPrice } = useCurrency()
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category")
  const { shop } = useShop()
  const router = useRouter()

  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.id === productId)
  }

  const hasSelectedCurrencyPrice = (product: any) => {
    if (selectedCurrency === 'AED') {
      return product.price_aed && product.price_aed > 0
    } else if (selectedCurrency === 'INR') {
      return product.price_inr && product.price_inr > 0
    }
    return true
  }

  // Trigger blur animation
  const triggerBlurAnimation = (type: 'cart' | 'wishlist') => {
    setAnimationType(type)
    setShowBlur(true)
    
    // Hide animation after 2 seconds
    setTimeout(() => {
      setShowBlur(false)
      setAnimationType(null)
    }, 2000)
  }

  const handleToggleWishlist = async (product: any) => {
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist')
      return
    }

    try {
      if (isInWishlist(product.id)) {
        await dispatch(removeFromWishlistAPI(product.id)).unwrap()
      } else {
        const wishlistItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          price_aed: product.price_aed,
          price_inr: product.price_inr,
          default_currency: product.default_currency,
          image_url: product.image_url,
          category_id: product.category_id,
          category_name: product.category_name,
          description: product.description,
          brand: product.brand,
          is_available: product.is_available,
          shop_category: product.shop_category,
          features: product.features
        }
        await dispatch(addToWishlistAPI(wishlistItem)).unwrap()
        // Trigger wishlist animation
        triggerBlurAnimation('wishlist')
      }
    } catch (error) {
      console.error('wishlist operation failed:', error)
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      alert(`Failed to update wishlist: ${errorMessage}`)
    }
  }

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setAuthInitialized(true)
    }, 300)

    return () => clearTimeout(initTimer)
  }, [isAuthenticated])

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())
    if (categoryFromUrl) {
      dispatch(setSelectedCategory(Number(categoryFromUrl)))
    }
  }, [dispatch, categoryFromUrl])

  // Add this useEffect to handle search from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl)
    } else {
      setSearchTerm("")
    }
  }, [searchParams])

  const handleCategoryChange = (categoryId: number | null) => {
    setCategoryTransition(true)
    setTimeout(() => {
      dispatch(setSelectedCategory(categoryId))
      setCategoryTransition(false)
    }, 150)
  }

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({
      menuItem: product,
      quantity: 1,
      selectedCurrency,
      userId: user?.id
    }))
    // Trigger cart animation
    triggerBlurAnimation('cart')
  }

  const shopFilteredItems = items.filter((item: any) => {
    return item.shop_category === shop
  })

  const currencyFilteredItems = shopFilteredItems.filter((item: any) => {
    return hasSelectedCurrencyPrice(item)
  })

  // Updated filteredItems logic to handle URL search
  const filteredItems = currencyFilteredItems.filter((item) => {
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory
    const searchFromUrl = searchParams.get("search") || ""
    const searchTermToUse = searchFromUrl || searchTerm

    const matchesSearch = searchTermToUse.length === 0 ||
      item.name.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTermToUse.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const shouldShowSpinButton = authInitialized && !isAuthenticated && !showSpinner

  // Updated getCurrentCategoryName function
  const getCurrentCategoryName = () => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl) {
      return `Search results for "${searchFromUrl}" in SHOP ${shop} (${selectedCurrency})`
    }
    if (selectedCategory === null) return `SHOP ${shop} (${selectedCurrency})`
    const category = categories.find((cat) => cat.id === selectedCategory)
    return `Shop ${shop} - ${category?.name || "Products"} (${selectedCurrency})`
  }

  const lightningDeals = filteredItems.filter((item) => item.is_featured).slice(0, 4)
  const clearanceDeals = filteredItems.filter((item) => {
    if (selectedCurrency === 'AED' && item.price_aed) {
      return item.price_aed < 50
    } else if (selectedCurrency === 'INR' && item.price_inr) {
      return item.price_inr < 2000
    }
    return item.price < 50
  }).slice(0, 4)
  const newArrivals = filteredItems.filter((item) => item.is_new).slice(0, 12)

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Blur Overlay with Animation */}
      {showBlur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" />
          
          {/* Animated Icon */}
          <div className="relative z-10">
            {animationType === 'wishlist' && (
              <div className="animate-in zoom-in duration-500 animate-out zoom-out fade-out delay-1000 duration-1000">
                <div className="bg-red-500 rounded-full p-8 shadow-2xl animate-bounce">
                  <Heart 
                    className="w-16 h-16 text-white fill-white animate-pulse" 
                  />
                </div>
                {/* Floating effect */}
                <div className="absolute inset-0 bg-red-500 rounded-full p-8 opacity-30 animate-ping" />
              </div>
            )}
            
            {animationType === 'cart' && (
              <div className="animate-in zoom-in duration-500 animate-out zoom-out fade-out delay-1000 duration-1000">
                <div className="bg-orange-500 rounded-full p-8 shadow-2xl animate-bounce">
                  <ShoppingCart 
                    className="w-16 h-16 text-white animate-pulse" 
                  />
                </div>
                {/* Floating effect */}
                <div className="absolute inset-0 bg-orange-500 rounded-full p-8 opacity-30 animate-ping" />
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${categoryTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"} ${showBlur ? "blur-sm" : ""}`}
      >
        {/* Desktop Controls */}
        <div className="hidden lg:block px-6 mt-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* <h3 className="text-xl font-bold text-gray-900">{`Lightning deals in ${getCurrentCategoryName() === 'shop A' ? 'Beauty' : 'Accessories'}`}</h3> */}
            
              {currencyFilteredItems.length !== shopFilteredItems.length && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Filtered by {selectedCurrency} availability
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lightning Deals Section */}
        {lightningDeals.length > 0 && (
          <div className="px-4 lg:px-6 mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-900">Lightning deals</h3>
                    <span className="text-gray-500">({filteredItems.length} items)</span>
                    
                </div>
                 <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-10">
                {lightningDeals.map((item, index) => (
                  <Card
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <Image
                        key={item.id}
                        onClick={() => router.push(`/product/${item.id}`)}
                        src={
                          item.image_url ||
                          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                        }
                        alt={item.name}
                        width={200}
                        height={200}
                        className="w-full h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      />
                      <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center text-xs lg:text-sm font-bold">
                        {index + 1}
                      </div>
                      <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">FLASH</Badge>
       <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs"> {item.features?.[0]
    ? item.features[0].length > 7
      ? item.features[0].slice(0, 7) + "..."
      : item.features[0]
    : "Assured"}</Badge>
                    </div>
                    <CardContent className="p-3 lg:p-4">
                      <p className="text-red-500 font-bold text-sm lg:text-base">
                        {formatPrice(item.price_aed, item.price_inr, item.default_currency)}
                      </p>
                      
                      <p className="text-xs lg:text-sm text-gray-600 mt-1 line-clamp-2">{item.name}</p>

                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full py-2 text-xs lg:text-sm font-medium transform transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => handleToggleWishlist(item)}
                        className={`w-full mt-2 rounded-full py-2 text-xs lg:text-sm font-medium transform transition-all duration-200 hover:scale-105 active:scale-95 ${isInWishlist(item.id)
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                      >
                        {isInWishlist(item.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Products Grid */}
        <div className="px-4 lg:px-6 mt-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-500" />
                <span className="font-bold text-lg lg:text-xl">Fast Selling Products</span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            {loading ? (
              <div
                className={`grid gap-3 lg:gap-6 ${viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  }`}
              >
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-40 lg:h-48 rounded-xl mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`grid gap-3 lg:gap-6 ${viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  }`}
              >
                {filteredItems.map((item) => (
                  <div key={item.id} className="cursor-pointer">
                    <Card
                      className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${viewMode === "list" ? "flex" : ""
                        }`}
                    >
                      <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                        <Image
                          onClick={() => router.push(`/product/${item.id}`)}
                          src={
                            item.image_url ||
                            `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                          }
                          alt={item.name}
                          width={200}
                          height={200}
                          className={`object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer ${viewMode === "list" ? "w-full h-full" : "w-full h-40 lg:h-48"
                            }`}
                        />
                        {item.is_new && (
                          <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">NEW</Badge>
                        )}
                        {item.is_featured && (
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">HOT</Badge>
                        )}
                        {/* <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs"> {item.features?.[0]
    ? item.features[0].length > 7
      ? item.features[0].slice(0, 7) + "..."
      : item.features[0]
    : "N/A"}</Badge> */}

                      </div>
                      <CardContent className={`p-3 lg:p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-red-500 font-bold text-sm lg:text-lg">
                              {formatPrice(item.price_aed, item.price_inr, item.default_currency)}
                            </p>
      
                          </div>
                        </div>
                        <h3 className="text-sm lg:text-base font-medium text-gray-900 line-clamp-2 mb-2">{item.name}</h3>
                        {viewMode === "list" && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{item.description}</p>
                        )}
                        {/* {item.features && item.features.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {item.features.slice(0, 2).map((feature: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )} */}

                        <Button
                          onClick={() => handleAddToCart(item)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full py-2 lg:py-3 text-sm lg:text-base font-medium shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                          disabled={!item.is_available}
                        >
                          {item.is_available ? "Add to Cart" : "Unavailable"}
                        </Button>
                        <Button
                          onClick={() => handleToggleWishlist(item)}
                          className={`w-full mt-2 rounded-full py-2 text-sm font-medium transform transition-all duration-200 hover:scale-105 active:scale-95 ${isInWishlist(item.id)
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                          {isInWishlist(item.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
            {/* Updated no products found section */}
            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                {searchParams.get("search") ? (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No products found for "{searchParams.get("search")}"
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Try different keywords or browse categories below
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        router.push("/products")
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found in Shop {shop}</h3>
                    <p className="text-gray-500">
                      No products available with {selectedCurrency} pricing. Try switching currency or check the other shop.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}