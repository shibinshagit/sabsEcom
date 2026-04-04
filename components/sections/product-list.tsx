"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts, fetchCategories, setSelectedCategory } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useShop } from "@/lib/contexts/shop-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { useLoginModal } from '@/lib/stores/useLoginModal'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Zap, Grid3X3, List, SlidersHorizontal, Tag, Heart, ChevronDown, ShoppingCart, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { addToWishlistAPI, removeFromWishlistAPI } from '@/lib/store/slices/wishlistSlice'
import SearchFilters from "@/components/ui/search-filters"
import ShopSwitchPopup from "@/components/ui/shop-switch-popup"
import { useShopSwitchPopup } from "@/lib/hooks/useShopSwitchPopup"
import FloatingShopAd from "@/components/ui/floating-shop-ad"
import { useFloatingShopAd } from "@/lib/hooks/useFloatingShopAd"

interface ProductListProps {
  showSpinner?: boolean
  onCloseSpinner?: () => void
}

export default function ProductList({ showSpinner = false, onCloseSpinner }: ProductListProps) {
  const { user, isAuthenticated } = useAuth()
  const [authInitialized, setAuthInitialized] = useState(false)
  const { openModal } = useLoginModal()
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
  const { selectedCurrency, formatPrice, formatPriceWithSmallDecimals } = useCurrency()
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category")
  const { shop } = useShop()
  const isShopA = shop === "A"
  const accentTextClass = isShopA ? "text-fuchsia-600" : "text-orange-500"
  const accentBadgeClass = isShopA
    ? "bg-gradient-to-r from-fuchsia-500 to-violet-600"
    : "bg-gradient-to-r from-orange-500 to-red-500"
  const primaryButtonClass = isShopA
    ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700"
    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
  const lightningFlowerAssets = [
    { src: "/images/pink-flower-white-background-cutout.png", top: "6%", left: "4%", size: 68, delay: "0s", duration: "5.2s", opacity: 0.34 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "14%", left: "18%", size: 84, delay: "0.6s", duration: "6.1s", opacity: 0.3 },
    { src: "/images/pink-flower-white-background-cutout.png", top: "9%", left: "35%", size: 64, delay: "1.2s", duration: "4.8s", opacity: 0.3 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "13%", left: "54%", size: 90, delay: "1.8s", duration: "6.4s", opacity: 0.28 },
    { src: "/images/pink-flower-white-background-cutout.png", top: "8%", left: "73%", size: 70, delay: "2.2s", duration: "5.4s", opacity: 0.32 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "15%", left: "88%", size: 62, delay: "2.8s", duration: "4.9s", opacity: 0.26 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "56%", left: "8%", size: 78, delay: "0.4s", duration: "5.8s", opacity: 0.3 },
    { src: "/images/pink-flower-white-background-cutout.png", top: "69%", left: "26%", size: 66, delay: "1.1s", duration: "5.1s", opacity: 0.3 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "64%", left: "44%", size: 92, delay: "1.9s", duration: "6.6s", opacity: 0.26 },
    { src: "/images/pink-flower-white-background-cutout.png", top: "71%", left: "66%", size: 74, delay: "2.4s", duration: "5.3s", opacity: 0.3 },
    { src: "/images/top-view-pink-flower-with-drops-cutout.png", top: "62%", left: "84%", size: 86, delay: "3s", duration: "6.2s", opacity: 0.28 },
  ]

  // Shop switching popup
  const { isPopupOpen, closePopup, switchShop } = useShopSwitchPopup({
    intervalMinutes: 3, // Show every 3 minutes
    initialDelayMinutes: 1, // Wait 1 minute before first show
    maxShowsPerSession: 4 // Max 4 times per session
  })

  // Floating shop ad
  const { isAdVisible, closeAd, switchShop: switchShopFromAd } = useFloatingShopAd({
    showAfterScrollPixels: 400, // Show after scrolling 400px
    displayDurationMinutes: 2, // Show for 2 minutes
    cooldownMinutes: 4, // 4 minute cooldown
    maxShowsPerSession: 3 // Max 3 times per session
  })
  const router = useRouter()

  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.id === productId)
  }

  const hasSelectedCurrencyPrice = (product: any) => {
    // if (selectedCurrency === 'AED') {
    //   return product.price_aed && product.price_aed > 0
    // } else if (selectedCurrency === 'INR') {
    //   return product.price_inr && product.price_inr > 0
    // }
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
      // alert('Please login to add items to wishlist')
      openModal()
      return
    }

    try {
      if (isInWishlist(product.id)) {
        await dispatch(removeFromWishlistAPI(product.id)).unwrap()
      } else {
        // Get the best available variant for pricing
        const availableVariant = product.variants?.find((v: any) => 
          v.available_aed || v.available_inr
        ) || product.variants?.[0];

        const wishlistItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          price_aed: availableVariant?.discount_aed || availableVariant?.price_aed || product.price_aed,
          price_inr: availableVariant?.discount_inr || availableVariant?.price_inr || product.price_inr,
          default_currency: product.default_currency || "AED",
          image_url: product.image_urls?.[0] || product.image_url || '',
          image_urls: product.image_urls || [],
          category_id: product.category_id,
          category_name: product.category_name,
          description: product.description,
          brand: product.brand,
          is_available: product.is_available,
          shop_category: product.shop_category,
          features: product.features,
          variants: product.variants,
          condition_type: product.condition_type
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

  // Debug currency changes
  useEffect(() => {
    console.log('Currency changed to:', selectedCurrency)
  }, [selectedCurrency])

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
    if (!isAuthenticated) {
      openModal()
      return
    }
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
    return item.shop_category === shop || item.shop_category === 'Both'
  })

  const currencyFilteredItems = shopFilteredItems.filter((item: any) => {
    return hasSelectedCurrencyPrice(item)
  })

  // State for search results
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState("")
  const [searchSortBy, setSearchSortBy] = useState("relevance")
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<any>({})

  // Apply filters to search results
  const applyFilters = (items: any[], filters: any) => {
    if (!filters || Object.keys(filters).length === 0) return items
    
    return items.filter(item => {
      // Get the best available variant for filtering
      const availableVariant = item.variants?.find((v: any) => 
        selectedCurrency === 'AED' ? v.available_aed : v.available_inr
      ) || item.variants?.[0]

      const originalPrice = selectedCurrency === 'AED' 
        ? (availableVariant?.price_aed || 0)
        : (availableVariant?.price_inr || 0)

      const discountPrice = selectedCurrency === 'AED' 
        ? (availableVariant?.discount_aed || 0)
        : (availableVariant?.discount_inr || 0)

      // A product has a discount only if:
      // 1. Both original price and discount price exist and are > 0
      // 2. Discount price is meaningfully less than original price (at least 1% difference)
      const hasDiscount = originalPrice > 0 && 
                         discountPrice > 0 && 
                         discountPrice < originalPrice &&
                         ((originalPrice - discountPrice) / originalPrice) >= 0.01

      // Use discount price if available, otherwise original price
      const currentPrice = hasDiscount ? discountPrice : originalPrice

      // Apply discount filter
      if (filters.discount && !hasDiscount) return false

      // Calculate discount percentage for range filters
      const discountPercentage = hasDiscount ? ((originalPrice - currentPrice) / originalPrice) * 100 : 0

      // Apply discount percentage range filters
      if (filters.discount_10_20 && (discountPercentage < 10 || discountPercentage >= 20)) return false
      if (filters.discount_20_30 && (discountPercentage < 20 || discountPercentage >= 30)) return false
      if (filters.discount_30_40 && (discountPercentage < 30 || discountPercentage >= 40)) return false
      if (filters.discount_40_plus && discountPercentage < 40) return false

      // Apply price range slider filter
      if (filters.priceRange && Array.isArray(filters.priceRange)) {
        const [minPrice, maxPrice] = filters.priceRange
        if (currentPrice < minPrice || currentPrice > maxPrice) return false
      }

      // Apply featured filter
      if (filters.featured && !item.is_featured) return false

      // Apply new arrivals filter
      if (filters.new_arrivals && !item.is_new) return false

      return true
    })
  }

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters)
  }

  // Use search API when there's a search term
  useEffect(() => {
    const searchFromUrl = searchParams.get("search")
    if (searchFromUrl && searchFromUrl.trim().length >= 2) {
      setIsSearchActive(true)
      setCurrentSearchQuery(searchFromUrl.trim())
      setIsSearchLoading(true)
      // Clear category selection when searching to show results across all categories
      dispatch(setSelectedCategory(null))
      fetchSearchResults(searchFromUrl.trim(), searchSortBy)
    } else {
      setIsSearchActive(false)
      setSearchResults([])
      setCurrentSearchQuery("")
      setIsSearchLoading(false)
    }
  }, [searchParams, shop, selectedCurrency, searchSortBy, dispatch])

  const fetchSearchResults = async (query: string, sort: string = 'relevance') => {
    try {
      setIsSearchLoading(true)
      const searchUrl = new URL('/api/products/search', window.location.origin)
      searchUrl.searchParams.set('q', query)
      searchUrl.searchParams.set('shop', shop)
      searchUrl.searchParams.set('currency', selectedCurrency)
      if (selectedCategory) {
        searchUrl.searchParams.set('category', selectedCategory.toString())
      }
      searchUrl.searchParams.set('limit', '50')
      searchUrl.searchParams.set('sort', sort)

      const response = await fetch(searchUrl.toString())
      const searchData = await response.json()
      
      let results = searchData.items || []
      
      // Apply client-side sorting for options not handled by API
      if (sort === 'name') {
        results = results.sort((a: any, b: any) => a.name.localeCompare(b.name))
      } else if (sort === 'newest') {
        results = results.sort((a: any, b: any) => {
          // First priority: items with is_new flag
          if (a.is_new && !b.is_new) return -1
          if (!a.is_new && b.is_new) return 1
          
          // Second priority: creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      } else if (sort === 'price_low' || sort === 'price_high') {
        results = results.sort((a: any, b: any) => {
          const aVariant = a.variants?.find((v: any) => 
            selectedCurrency === 'AED' ? v.available_aed : v.available_inr
          ) || a.variants?.[0]
          const bVariant = b.variants?.find((v: any) => 
            selectedCurrency === 'AED' ? v.available_aed : v.available_inr
          ) || b.variants?.[0]
          
          // Get the actual selling price (discount price if available, otherwise regular price)
          const aPrice = selectedCurrency === 'AED' 
            ? (aVariant?.discount_aed && aVariant.discount_aed > 0 ? aVariant.discount_aed : aVariant?.price_aed || 0)
            : (aVariant?.discount_inr && aVariant.discount_inr > 0 ? aVariant.discount_inr : aVariant?.price_inr || 0)
          const bPrice = selectedCurrency === 'AED' 
            ? (bVariant?.discount_aed && bVariant.discount_aed > 0 ? bVariant.discount_aed : bVariant?.price_aed || 0)
            : (bVariant?.discount_inr && bVariant.discount_inr > 0 ? bVariant.discount_inr : bVariant?.price_inr || 0)
          
          return sort === 'price_low' ? aPrice - bPrice : bPrice - aPrice
        })
      } else if (sort === 'discount') {
        results = results.sort((a: any, b: any) => {
          const aVariant = a.variants?.find((v: any) => 
            selectedCurrency === 'AED' ? v.available_aed : v.available_inr
          ) || a.variants?.[0]
          const bVariant = b.variants?.find((v: any) => 
            selectedCurrency === 'AED' ? v.available_aed : v.available_inr
          ) || b.variants?.[0]
          
          // Calculate discount percentage for each product
          const aOriginalPrice = selectedCurrency === 'AED' ? (aVariant?.price_aed || 0) : (aVariant?.price_inr || 0)
          const aDiscountPrice = selectedCurrency === 'AED' ? (aVariant?.discount_aed || 0) : (aVariant?.discount_inr || 0)
          const aDiscountPercent = aOriginalPrice > 0 && aDiscountPrice > 0 
            ? Math.round(((aOriginalPrice - aDiscountPrice) / aOriginalPrice) * 100) 
            : 0
          
          const bOriginalPrice = selectedCurrency === 'AED' ? (bVariant?.price_aed || 0) : (bVariant?.price_inr || 0)
          const bDiscountPrice = selectedCurrency === 'AED' ? (bVariant?.discount_aed || 0) : (bVariant?.discount_inr || 0)
          const bDiscountPercent = bOriginalPrice > 0 && bDiscountPrice > 0 
            ? Math.round(((bOriginalPrice - bDiscountPrice) / bOriginalPrice) * 100) 
            : 0
          
          // Sort by highest discount first
          return bDiscountPercent - aDiscountPercent
        })
      }
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearchLoading(false)
    }
  }

  const handleSortChange = (newSort: string) => {
    setSearchSortBy(newSort)
    if (currentSearchQuery) {
      fetchSearchResults(currentSearchQuery, newSort)
    }
  }

  const handleClearSearch = () => {
    router.push('/products')
  }

  // Updated filteredItems logic with filters applied
  const baseFilteredItems = isSearchActive ? searchResults : currencyFilteredItems.filter((item) => {
    return selectedCategory === null || item.category_id === selectedCategory
  })
  
  // Apply sorting to regular products (non-search)
  const sortedBaseItems = !isSearchActive && searchSortBy !== 'relevance' ? 
    [...baseFilteredItems].sort((a: any, b: any) => {
      if (searchSortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (searchSortBy === 'newest') {
        // First priority: items with is_new flag
        if (a.is_new && !b.is_new) return -1
        if (!a.is_new && b.is_new) return 1
        
        // Second priority: creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (searchSortBy === 'price_low' || searchSortBy === 'price_high') {
        const aVariant = a.variants?.find((v: any) => 
          selectedCurrency === 'AED' ? v.available_aed : v.available_inr
        ) || a.variants?.[0]
        const bVariant = b.variants?.find((v: any) => 
          selectedCurrency === 'AED' ? v.available_aed : v.available_inr
        ) || b.variants?.[0]
        
        // Get the actual selling price (discount price if available, otherwise regular price)
        const aPrice = selectedCurrency === 'AED' 
          ? (aVariant?.discount_aed && aVariant.discount_aed > 0 ? aVariant.discount_aed : aVariant?.price_aed || 0)
          : (aVariant?.discount_inr && aVariant.discount_inr > 0 ? aVariant.discount_inr : aVariant?.price_inr || 0)
        const bPrice = selectedCurrency === 'AED' 
          ? (bVariant?.discount_aed && bVariant.discount_aed > 0 ? bVariant.discount_aed : bVariant?.price_aed || 0)
          : (bVariant?.discount_inr && bVariant.discount_inr > 0 ? bVariant.discount_inr : bVariant?.price_inr || 0)
        
        return searchSortBy === 'price_low' ? aPrice - bPrice : bPrice - aPrice
      } else if (searchSortBy === 'discount') {
        const aVariant = a.variants?.find((v: any) => 
          selectedCurrency === 'AED' ? v.available_aed : v.available_inr
        ) || a.variants?.[0]
        const bVariant = b.variants?.find((v: any) => 
          selectedCurrency === 'AED' ? v.available_aed : v.available_inr
        ) || b.variants?.[0]
        
        // Calculate discount percentage for each product
        const aOriginalPrice = selectedCurrency === 'AED' ? (aVariant?.price_aed || 0) : (aVariant?.price_inr || 0)
        const aDiscountPrice = selectedCurrency === 'AED' ? (aVariant?.discount_aed || 0) : (aVariant?.discount_inr || 0)
        const aDiscountPercent = aOriginalPrice > 0 && aDiscountPrice > 0 
          ? Math.round(((aOriginalPrice - aDiscountPrice) / aOriginalPrice) * 100) 
          : 0
        
        const bOriginalPrice = selectedCurrency === 'AED' ? (bVariant?.price_aed || 0) : (bVariant?.price_inr || 0)
        const bDiscountPrice = selectedCurrency === 'AED' ? (bVariant?.discount_aed || 0) : (bVariant?.discount_inr || 0)
        const bDiscountPercent = bOriginalPrice > 0 && bDiscountPrice > 0 
          ? Math.round(((bOriginalPrice - bDiscountPrice) / bOriginalPrice) * 100) 
          : 0
        
        // Sort by highest discount first
        return bDiscountPercent - aDiscountPercent
      }
      return 0
    }) : baseFilteredItems
  
  const filteredItems = applyFilters(sortedBaseItems, activeFilters)

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
      {/* Search Filters */}
      <SearchFilters
        isSearchActive={isSearchActive}
        searchQuery={currentSearchQuery}
        totalResults={filteredItems.length}
        sortBy={searchSortBy}
        onSortChange={handleSortChange}
        onClearSearch={handleClearSearch}
        onFilterChange={handleFilterChange}
        products={sortedBaseItems}
      />

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
                <Badge
                  variant="outline"
                  className={isShopA ? "text-fuchsia-700 border-fuchsia-300" : "text-orange-600 border-orange-300"}
                >
                  Filtered by {selectedCurrency} availability
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lightning Deals Section - Only show when not searching */}
        {lightningDeals.length > 0 && !isSearchActive && (
          <div className="px-4 lg:px-6 mt-6">
            <div className="max-w-7xl mx-auto">
              <section
                className={`relative isolate overflow-hidden rounded-2xl border p-4 lg:p-6 ${
                  isShopA
                    ? "bg-white/24 border-white/45 backdrop-blur-3xl [backdrop-filter:blur(28px)_saturate(180%)] ring-1 ring-white/55 shadow-[0_28px_90px_-28px_rgba(139,92,246,0.55)]"
                    : "bg-white border-orange-100"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/42 via-white/8 to-violet-100/20" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/65 via-white/12 to-transparent" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.24)]" />
                <div className="pointer-events-none absolute -top-28 right-0 h-80 w-80 rounded-full bg-fuchsia-400/45 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 left-6 h-80 w-80 rounded-full bg-violet-400/42 blur-3xl" />
                {isShopA && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {lightningFlowerAssets.map((flower, idx) => (
                      <div
                        key={`lightning-image-flower-${idx}`}
                        className="absolute"
                        style={{
                          top: flower.top,
                          left: flower.left,
                          opacity: flower.opacity,
                          animation: `softFloat ${flower.duration} ease-in-out ${flower.delay} infinite`,
                        }}
                      >
                        <Image
                          src={flower.src}
                          alt=""
                          width={flower.size}
                          height={flower.size}
                          className="select-none saturate-125 drop-shadow-[0_0_12px_rgba(219,39,119,0.35)]"
                        />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-fuchsia-100/18 to-violet-100/24" />
                    <div className="absolute left-[10%] top-[24%] h-36 w-36 rounded-full bg-fuchsia-300/35 blur-2xl animate-[pulse_3.8s_ease-in-out_infinite]" />
                    <div className="absolute right-[12%] bottom-[18%] h-32 w-32 rounded-full bg-rose-300/35 blur-2xl animate-[pulse_4.6s_ease-in-out_infinite]" />
                    <div className="absolute right-[32%] top-[46%] h-24 w-24 rounded-full bg-violet-300/30 blur-2xl animate-[pulse_5.2s_ease-in-out_infinite]" />
                  </div>
                )}

                <div className="relative z-10 flex items-end justify-between gap-4 mb-6">
                  <div className={`space-y-1.5 rounded-xl px-4 py-3 border backdrop-blur-md ${
                    isShopA
                      ? "bg-white/34 border-white/60 [backdrop-filter:blur(18px)_saturate(170%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_-18px_rgba(192,38,211,0.55)]"
                      : "bg-white/60 border-white/70"
                  }`}>
                    <h3 className="text-xl lg:text-3xl font-bold text-zinc-900 tracking-[-0.02em] leading-tight">Handpicked For You</h3>
                    {/* <p className="text-sm lg:text-base text-zinc-600">{lightningDeals.length} curated picks with limited-time savings</p> */}
                  </div>
                
                </div>

                <div className="relative z-10 -mx-1 px-1">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                    {lightningDeals.map((item, index) => {
                      // Get the best available variant
                      const availableVariant = item.variants?.find((v: any) =>
                        v.available_aed || v.available_inr
                      ) || item.variants?.[0]

                      // Calculate discount percentage based on selected currency
                      let discountPercent = 0
                      if (availableVariant) {
                        console.log("Lightning Deals - Currency:", selectedCurrency, "Variant:", availableVariant)
                        if (selectedCurrency === "AED" && availableVariant.price_aed && availableVariant.discount_aed && availableVariant.price_aed > availableVariant.discount_aed) {
                          discountPercent = Math.round(((availableVariant.price_aed - availableVariant.discount_aed) / availableVariant.price_aed) * 100)
                          console.log("AED Discount:", discountPercent, "Price:", availableVariant.price_aed, "Discount:", availableVariant.discount_aed)
                        } else if (selectedCurrency === "INR" && availableVariant.price_inr && availableVariant.discount_inr && availableVariant.price_inr > availableVariant.discount_inr) {
                          discountPercent = Math.round(((availableVariant.price_inr - availableVariant.discount_inr) / availableVariant.price_inr) * 100)
                          console.log("INR Discount:", discountPercent, "Price:", availableVariant.price_inr, "Discount:", availableVariant.discount_inr)
                        }
                      }

                      return (
                        <Card
                          key={item.id}
                          className={`snap-start rounded-lg overflow-hidden transition-all duration-300 border backdrop-blur-xl ${
                            isShopA
                              ? "bg-white/42 [backdrop-filter:blur(16px)_saturate(160%)] border-white/55 ring-1 ring-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_34px_-24px_rgba(147,51,234,0.5)] hover:ring-fuchsia-300/70 hover:border-white/70"
                              : "bg-white border-zinc-200/80 hover:border-orange-200 shadow-sm hover:shadow-lg"
                          } flex-shrink-0 w-[220px] sm:w-[240px] lg:w-[260px]`}
                        >
                          <div className="relative">
                            <div className={`absolute inset-x-0 top-0 h-1 ${isShopA ? "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-rose-500" : "bg-gradient-to-r from-orange-500 to-red-500"}`} />
                            <Image
                              key={item.id}
                              onClick={() => router.push(`/product/${item.id}`)}
                              src={
                                item.image_urls?.[0] ||
                                `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                              }
                              alt={item.name || "Product"}
                              width={260}
                              height={260}
                              className="w-full h-40 lg:h-48 object-cover transition-transform duration-500 hover:scale-[1.04] cursor-pointer"
                            />

                            <div className="absolute top-2 left-2 bg-zinc-900/90 text-white rounded-md px-2 py-1 text-[11px] font-semibold shadow-md">
                              #{index + 1}
                            </div>

                            {discountPercent > 0 && (
                              <Badge className={`absolute top-2 right-2 ${accentBadgeClass} text-white text-[10px] px-2 py-1 rounded-md shadow-sm font-semibold`}>
                                Save {discountPercent}%
                              </Badge>
                            )}

                            {item.is_featured && (
                              <Badge className="absolute bottom-2 left-2 bg-white/95 text-zinc-800 text-[10px] px-2 py-1 rounded-md shadow-sm font-semibold border border-zinc-200">
                                Top Selling
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-4">
                            <p className="text-sm text-zinc-900 line-clamp-2 leading-snug font-medium">{item.name}</p>

                            <div className="mt-2 min-h-[36px]">
                              {availableVariant && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {(
                                    (selectedCurrency === "AED" && !availableVariant.available_aed) ||
                                    (selectedCurrency === "INR" && !availableVariant.available_inr)
                                  ) ? (
                                    <span className="text-red-600 font-semibold text-sm">Not Available</span>
                                  ) : (
                                    <>
                                      <span className="text-rose-600 font-semibold text-sm lg:text-base">
                                        {formatPriceWithSmallDecimals(
                                          availableVariant.discount_aed,
                                          availableVariant.discount_inr,
                                          "AED",
                                          true,
                                          "#e11d48"
                                        )}
                                      </span>
                                      {discountPercent > 0 && (
                                        <span className="text-zinc-500 text-xs line-through">
                                          {formatPriceWithSmallDecimals(
                                            availableVariant.price_aed,
                                            availableVariant.price_inr,
                                            "AED",
                                            true,
                                            "#6B7280"
                                          )}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => router.push(`/product/${item.id}`)}
                                className={`${primaryButtonClass} text-white rounded-md py-2 text-xs font-medium transition-all duration-200 hover:opacity-95 shadow-sm`}
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => handleToggleWishlist(item)}
                                className={`rounded-md py-2 text-xs font-medium transition-all duration-200 ${
                                  isInWishlist(item.id)
                                    ? "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200"
                                }`}
                              >
                                <span className="inline-flex items-center justify-center gap-1">
                                  <Heart className={`w-3.5 h-3.5 ${isInWishlist(item.id) ? "fill-current" : ""}`} />
                                  {isInWishlist(item.id) ? "Saved" : "Save"}
                                </span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Main Products Grid */}
        <div className="px-4 lg:px-6 mt-6 pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Show section header only when not searching */}
            {!isSearchActive && (
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-lg lg:text-xl">Fast Selling Products</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            )}
            
            {/* Show unified search results header when searching */}
            {isSearchActive && (
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-bold text-lg lg:text-xl">Search Results</span>
                  <span className="text-gray-500">({filteredItems.length} products)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
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
             {filteredItems.map((item) => {
  // Get the best available variant
  const availableVariant =
    item.variants?.find(
      (v: any) => v.available_aed || v.available_inr
    ) || item.variants?.[0];

  // Calculate discount percentage based on selected currency
  let discountPercent = 0;
  if (availableVariant) {
    console.log('Main Grid - Currency:', selectedCurrency, 'Variant:', availableVariant);
    if (selectedCurrency === 'AED' && availableVariant.price_aed && availableVariant.discount_aed && availableVariant.price_aed > availableVariant.discount_aed) {
      discountPercent = Math.round(((availableVariant.price_aed - availableVariant.discount_aed) / availableVariant.price_aed) * 100);
      console.log('AED Main Discount:', discountPercent, 'Price:', availableVariant.price_aed, 'Discount:', availableVariant.discount_aed);
    } else if (selectedCurrency === 'INR' && availableVariant.price_inr && availableVariant.discount_inr && availableVariant.price_inr > availableVariant.discount_inr) {
      discountPercent = Math.round(((availableVariant.price_inr - availableVariant.discount_inr) / availableVariant.price_inr) * 100);
      console.log('INR Main Discount:', discountPercent, 'Price:', availableVariant.price_inr, 'Discount:', availableVariant.discount_inr);
    }
  }

// Condition label mapping
const conditionLabels = {
  master: "Master",
  "first-copy": "1st Copy",
  "second-copy": "2nd Copy",
  hot: "Hot",
  sale: "Sale"
};

// Badge background color mapping
const conditionColors = {
  master: "bg-green-600",
  "first-copy": "bg-yellow-600",
  "second-copy": "bg-purple-600",
  hot: "bg-red-600",
  sale: "bg-blue-600"
};

const conditionLabel = conditionLabels[item.condition_type as keyof typeof conditionLabels] || "";
const badgeColor = conditionColors[item.condition_type as keyof typeof conditionColors] || "bg-gray-500";

  return (
    <div key={item.id} className="cursor-pointer">
      <Card
        className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group ${
          viewMode === "list" ? "flex items-center" : ""
        }`}
      >
        <div
          className={`relative ${
            viewMode === "list" ? "w-32 h-32 flex-shrink-0" : ""
          }`}
        >
          <Image
            onClick={() => router.push(`/product/${item.id}`)}
            src={
              item.image_urls?.[0] ||
              `/placeholder.svg?height=200&width=200&query=${
                encodeURIComponent(item.name) || "/placeholder.svg"
              }`
            }
            alt={item.name}
            width={200}
            height={200}
            className={`object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer ${
              viewMode === "list" ? "w-32 h-32 rounded-lg" : "w-full h-40 lg:h-48"
            }`}
          />

          {item.is_new && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              NEW
            </Badge>
          )}

          {item.condition_type && item.condition_type !== "none" && (
  <Badge
    className={`absolute top-2 right-2 ${badgeColor} text-white text-xs px-2 py-1 rounded capitalize`}
  >
    {conditionLabel}
  </Badge>
)}
  {discountPercent > 0 && (
                    <Badge className={`absolute bottom-2 right-2 ${accentBadgeClass} text-white text-xs px-2 py-1 rounded-full shadow-lg font-bold animate-pulse`}>
                      {discountPercent}% off
                    </Badge>
                  )}

        </div>

        <CardContent
          className={`p-3 lg:p-4 ${viewMode === "list" ? "flex-1" : ""}`}
        >
          <div className="flex items-center justify-between mb-2">
            {/* Price */}
            <p className="text-red-500 font-bold text-sm lg:text-lg">
             {availableVariant && (
    <div className="flex items-center gap-2 flex-wrap">
      {(
        // Check currency availability
        (selectedCurrency === "AED" && !availableVariant.available_aed) ||
        (selectedCurrency === "INR" && !availableVariant.available_inr)
      ) ? (
        // Show "Not Available" in red if unavailable
        <span className="text-red-600 font-bold text-sm lg:text-base">
          Not Available
        </span>
      ) : (
        <>
          {/* Discounted Price with smaller decimal */}
          <span className="text-red-500 font-bold text-sm lg:text-base">
            {formatPriceWithSmallDecimals(
              availableVariant.discount_aed,
              availableVariant.discount_inr,
              "AED",
              true,             // show symbol
              "#ef4444"    // ✅ color applied
            )}
          </span>

          {/* Original Price if discount is available */}
          {/* {discountPercent > 0 && (
            <span className="text-gray-500 text-xs line-through">
              {formatPriceWithSmallDecimals(
                availableVariant.price_aed,
                availableVariant.price_inr,
                "AED",
                false,          
                "#6B7280"
              )}
            </span>
          )} */}
        </>
      )}
    </div>
  )}
            </p>

            {/* Discount Percentage */}
             {discountPercent > 0 && (
                              <span className="text-gray-500 text-xs line-through">
                               {formatPriceWithSmallDecimals(
                                availableVariant.price_aed,
                                availableVariant.price_inr,
                                "AED",
                                true,           
                                "#6B7280"  
                              )}
                              </span>
                            )}
          </div>

          {/* Product Name */}
          <h3 className={`font-medium text-gray-900 mb-2 ${
            viewMode === "list" 
              ? "text-base lg:text-lg line-clamp-2" 
              : "text-sm lg:text-base line-clamp-2"
          }`}>
            {viewMode === "list" ? item.name : (item.name.length > 15 ? item.name.slice(0, 17) + "..." : item.name)}
          </h3>

          {viewMode === "list" && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {item.description}
            </p>
          )}


<div className="flex gap-2">
  <Button
    onClick={() => router.push(`/product/${item.id}`)}
    className={`flex-1 ${primaryButtonClass} text-white rounded-full py-2 lg:py-3 text-sm lg:text-base font-medium shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2 ${
      viewMode === "list" ? "hover:scale-102" : "hover:scale-105"
    } active:scale-95`}
    disabled={!item.is_available}
  >
    {item.is_available ? (
      <>
        <ShoppingCart className="w-4 h-4" />
        Buy
      </>
    ) : (
      "Unavailable"
    )}
  </Button>

  <Button
    onClick={() => handleToggleWishlist(item)}
    className={`px-3 lg:px-4 rounded-full py-2 text-sm font-medium transform transition-all duration-200 hover:scale-105 active:scale-95 ${
      isInWishlist(item.id)
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
    }`}
  >
    <Heart
      className={`w-4 h-4 ${isInWishlist(item.id) ? "fill-current" : ""}`}
    />
  </Button>
</div>

        </CardContent>
      </Card>
    </div>
  );
})}

              </div>
            )}
            {/* Loading state for search */}
            {isSearchLoading && (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Searching for "{searchParams.get("search")}"...
                </h3>
                <p className="text-gray-500">
                  Finding the best products for you
                </p>
              </div>
            )}
            
            {/* Updated no products found section */}
            {filteredItems.length === 0 && !loading && !isSearchLoading && (
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
                      className={isShopA ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found in Shop {shop === "A" ? "Beauty" : "Style"}</h3>
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

      {/* Shop Switch Popup */}
      <ShopSwitchPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        onSwitchShop={switchShop}
      />

      {/* Floating Shop Ad */}
      <FloatingShopAd
        isVisible={isAdVisible}
        onClose={closeAd}
        onSwitchShop={switchShopFromAd}
      />
    </div>
    
  )
}