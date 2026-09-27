"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { addToWishlistAPI, removeFromWishlistAPI } from '@/lib/store/slices/wishlistSlice'
import { useCurrency } from "@/lib/contexts/currency-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Button } from "@/components/ui/button"
import { useLoginModal } from '@/lib/stores/useLoginModal'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, Globe, AlertCircle, Plus, Minus, Truck, Shield, Award, Zap, ChevronRight, Eye, Sparkles, Verified, MessageSquare } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import toast from 'react-hot-toast'
import LoginModal from "@/components/auth/login-modal"
import RecommendedProducts from "@/components/sections/recommended-products"
import { Metadata } from 'next'

interface Variant {
  id: number
  name: string
  price_aed: number
  price_inr: number
  discount_aed: number
  discount_inr: number
  available_aed: boolean
  available_inr: boolean
  stock_quantity: number
  free_delivery_aed: boolean
  free_delivery_inr: boolean
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  price_aed?: number | null
  price_inr?: number | null
  default_currency: 'AED' | 'INR'
  image_urls: string[]
  category_id: number
  category_name: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  features: string[]
  specifications_text: string
  warranty_months: number
  brand?: string
  model?: string
  condition_type?: 'master' | 'first-copy' | 'second-copy' | 'hot' | 'sale' | 'none'
  shop_category: string
  storage_capacity?: string
  color?: string
  stock_quantity: number
  sku?: string
  variants: Variant[]
}

interface ProductReview {
  id: number
  rating: number
  review_text: string
  is_approved?: boolean
  customer_name?: string
  user_email?: string
  created_at: string
}



export default function ProductPage() {
  const { user, isAuthenticated } = useAuth()
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { selectedCurrency, formatPriceWithSmallDecimals } = useCurrency()
  const { shop, setShop } = useShop()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)

  const [product, setProduct] = useState<Product | null>(null)
  const { openModal } = useLoginModal()
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [canReview, setCanReview] = useState(false)
  const [userReview, setUserReview] = useState<ProductReview | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [detailTab, setDetailTab] = useState<"about" | "features" | "specs" | "reviews">("about")

  // Animation states
  const [showBlur, setShowBlur] = useState(false)
  const [animationType, setAnimationType] = useState<'cart' | 'wishlist' | 'buy' | null>(null)

  const triggerBlurAnimation = (type: 'cart' | 'wishlist' | 'buy') => {
    setAnimationType(type)
    setShowBlur(true)
    setTimeout(() => {
      setShowBlur(false)
      setAnimationType(null)
    }, 2500)
  }

  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.id === productId)
  }

  const hasSelectedCurrencyPrice = (variant: Variant) => {
    return selectedCurrency === 'AED' ? variant.available_aed : variant.available_inr
  }

  const isVariantAvailable = (variant: Variant) => {
    return hasSelectedCurrencyPrice(variant) && variant.stock_quantity > 0
  }

  const getStockMessage = (variant: Variant) => {
    if (variant.stock_quantity === 0) {
      return 'Out of Stock'
    } else if (!hasSelectedCurrencyPrice(variant)) {
      return `Not available in ${selectedCurrency === 'INR' ? 'India' : 'UAE'}`
    } else if (variant.stock_quantity <= 5) {
      return `Only ${variant.stock_quantity} left`
    } else {
      return `${variant.stock_quantity} in stock`
    }
  }

  const handleToggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      // toast.error('Please login to add items to wishlist')
      openModal()
      return
    }
    try {
      if (isInWishlist(product.id)) {
        await dispatch(removeFromWishlistAPI(product.id)).unwrap()
        toast.success('Removed from wishlist')
      } else {
        const wishlistItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          price_aed: selectedVariant?.discount_aed || selectedVariant?.price_aed || product.price_aed,
          price_inr: selectedVariant?.discount_inr || selectedVariant?.price_inr || product.price_inr,
          default_currency: product.default_currency,
          image_url: product.image_urls?.[0] || '',
          image_urls: product.image_urls || [],
          category_id: product.category_id,
          category_name: product.category_name,
          description: product.description,
          brand: product.brand,
          is_available: product.is_available,
          shop_category: product.shop_category,
          features: product.features,
          variants: product.variants,
          condition_type: product.condition_type,
          selectedVariant: selectedVariant
        }
        await dispatch(addToWishlistAPI(wishlistItem)).unwrap()
        toast.success('Added to wishlist')
        triggerBlurAnimation('wishlist')
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
      toast.error('Failed to update wishlist')
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  useEffect(() => {
    fetchReviews()
  }, [params.id, isAuthenticated])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Auto-switch shop if product is only available in a different shop
        if (data.shop_category && data.shop_category !== 'Both' && data.shop_category !== shop) {
          console.log(`Auto-switching from Shop ${shop} to Shop ${data.shop_category} for product: ${data.name}`)
          setShop(data.shop_category)
          // toast.success(`Switched to Shop ${data.shop_category === 'A' ? 'Beauty' : 'Style'} to view this product`)
        }
        
        setProduct(data)
        // Set default variant based on currency availability
        const defaultVariant = data.variants?.find((v: Variant) => 
          selectedCurrency === 'AED' ? v.available_aed : v.available_inr
        ) || data.variants?.[0]
        setSelectedVariant(defaultVariant || null)
        // Prefer About, then Features, else Specs
        setDetailTab(
          data.description ? "about" : data.features?.length ? "features" : "specs"
        )
      } else {
        console.error("Product not found")
        // Redirect to 404 page if product doesn't exist
        router.push('/not-found')
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error('Failed to load product')
      // Redirect to home page on error
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/products/${params.id}/reviews`)
      if (!response.ok) {
        return
      }

      const data = await response.json()
      setAverageRating(Number(data.average_rating || 0))
      setReviewCount(Number(data.review_count || 0))
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
      setCanReview(Boolean(data.can_review))
      setUserReview(data.user_review || null)
      setReviewRating(Number(data.user_review?.rating || 0))
      setReviewText(data.user_review?.review_text || "")
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      openModal()
      return
    }
    if (product && selectedVariant && hasSelectedCurrencyPrice(selectedVariant)) {
      dispatch(addToCart({
        menuItem: product,
        quantity,
        selectedCurrency,
        userId: user?.id,
        variant_id: selectedVariant.id,
        selected_variant: selectedVariant
      }))
      triggerBlurAnimation('cart')
      toast.success('Added to cart')
    } else if (!hasSelectedCurrencyPrice(selectedVariant)) {
      toast.error(`This product is not available in ${selectedCurrency === 'INR' ? 'India' : 'UAE'}`)
    } else if ((selectedVariant?.stock_quantity ?? 0) === 0) {
      toast.error('This variant is currently out of stock')
    } else {
      toast.error('Unable to add to cart. Please try again.')
    }
  }

  const handleBuyNow = () => {
    if (product && selectedVariant && hasSelectedCurrencyPrice(selectedVariant)) {
      dispatch(addToCart({
        menuItem: product,
        quantity,
        selectedCurrency,
        userId: user?.id,
        variant_id: selectedVariant.id,
        selected_variant: selectedVariant
      }))
      triggerBlurAnimation('buy')
      setTimeout(() => {
        router.push('/order')
      }, 1500)
    } else if (!hasSelectedCurrencyPrice(selectedVariant)) {
      toast.error(`This product is not available in ${selectedCurrency === 'INR' ? 'India' : 'UAE'}`)
    } else if ((selectedVariant?.stock_quantity ?? 0) === 0) {
      toast.error('This variant is currently out of stock')
    } else {
      toast.error('Unable to process order. Please try again.')
    }
  }

  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant)
    setQuantity(1) // Reset quantity when variant changes
    
    // Show a toast if variant has low stock or is out of stock
    if (variant.stock_quantity === 0) {
      toast.error('This variant is out of stock')
    } else if (variant.stock_quantity <= 5) {
      toast.warn(`Only ${variant.stock_quantity} items left in stock!`)
    }
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      openModal()
      return
    }

    if (!canReview) {
      toast.error("Only customers who purchased this product can review it")
      return
    }

    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a star rating")
      return
    }

    try {
      setReviewSubmitting(true)
      const response = await fetch(`/api/products/${params.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          review_text: reviewText.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(data?.error || "Failed to submit review")
        return
      }

      toast.success("Review submitted for admin approval")
      await fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review")
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-32 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-80 sm:h-96 lg:h-[500px] rounded-2xl"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-200 to-gray-300 h-20 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-3/4 rounded-lg"></div>
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-6 w-1/2 rounded-lg"></div>
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-12 w-1/3 rounded-lg"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-200 to-gray-300 h-4 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="text-8xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-8 text-lg">The product you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  const currencyAvailable = selectedVariant ? hasSelectedCurrencyPrice(selectedVariant) : false

  // Condition label and color mapping
  const conditionLabels = {
    master: "Master",
    "first-copy": "1st Copy",
    "second-copy": "2nd Copy",
    hot: "Hot",
    sale: "Sale",
    none: ""
  }
const conditionColors = {
  master: "from-green-500 to-green-700",
  "first-copy": "from-yellow-500 to-yellow-700",
  "second-copy": "from-purple-500 to-purple-700",
  hot: "from-red-500 to-red-700",
  sale: "from-blue-500 to-blue-700",
  none: "from-gray-400 to-gray-600",
};

  const discountPercent = selectedVariant
    ? selectedCurrency === 'AED' && selectedVariant.price_aed && selectedVariant.discount_aed
      ? Math.round(((selectedVariant.price_aed - selectedVariant.discount_aed) / selectedVariant.price_aed) * 100)
      : selectedCurrency === 'INR' && selectedVariant.price_inr && selectedVariant.discount_inr
        ? Math.round(((selectedVariant.price_inr - selectedVariant.discount_inr) / selectedVariant.price_inr) * 100)
        : 0
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      <Navbar />

      {/* Blur Overlay with Animation */}
     {showBlur && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Enhanced backdrop with gradient and subtle animation */}
    <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-slate-900/40 to-black/30 backdrop-blur-md animate-in fade-in duration-500" />
    
    <div className="relative z-10">
      {animationType === 'wishlist' && (
        <div className="animate-in zoom-in-50 duration-700 animate-out zoom-out-95 fade-out delay-2000 duration-800">
          {/* Main icon container with enhanced styling */}
          <div className="relative">
            <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 rounded-3xl p-10 shadow-2xl animate-bounce transform hover:scale-105 transition-transform duration-300">
              <Heart className="w-24 h-24 text-white fill-white animate-pulse drop-shadow-lg" />
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            {/* Enhanced ring effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 rounded-3xl opacity-20 animate-ping scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 rounded-3xl opacity-10 animate-ping scale-125 animation-delay-200" />
          </div>
          
          {/* Enhanced message styling */}
          <div className="text-center mt-6 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="inline-block bg-gradient-to-r from-black/70 to-gray-900/70 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
              <p className="text-white font-bold text-xl tracking-wide">
                {isInWishlist(product.id) ? '💔 Removed from Wishlist' : '❤️ Added to Wishlist'}
              </p>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {animationType === 'cart' && (
        <div className="animate-in zoom-in-50 duration-700 animate-out zoom-out-95 fade-out delay-2000 duration-800">
          <div className="relative">
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-10 shadow-2xl animate-bounce transform hover:scale-105 transition-transform duration-300">
              <ShoppingCart className="w-24 h-24 text-white animate-pulse drop-shadow-lg" />
              {/* Shopping effect dots */}
              <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-bounce animation-delay-100" />
              <div className="absolute top-6 right-6 w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-300" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl opacity-20 animate-ping scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl opacity-10 animate-ping scale-125 animation-delay-200" />
          </div>
          
          <div className="text-center mt-6 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="inline-block bg-gradient-to-r from-black/70 to-gray-900/70 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
              <p className="text-white font-bold text-xl tracking-wide">
                🛒 Added to Cart Successfully!
              </p>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {animationType === 'buy' && (
        <div className="animate-in zoom-in-50 duration-700 animate-out zoom-out-95 fade-out delay-1800 duration-800">
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl p-10 shadow-2xl animate-bounce transform hover:scale-105 transition-transform duration-300">
              <Zap className="w-24 h-24 text-white animate-pulse drop-shadow-lg" />
              {/* Lightning effect */}
              <div className="absolute inset-0 bg-yellow-400/30 rounded-3xl animate-ping opacity-50" />
              <div className="absolute top-2 left-2 w-2 h-8 bg-yellow-300 rounded-full animate-pulse transform rotate-12" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl opacity-20 animate-ping scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl opacity-10 animate-ping scale-125 animation-delay-200" />
          </div>
          
          <div className="text-center mt-6 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="inline-block bg-gradient-to-r from-black/70 to-gray-900/70 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
              <p className="text-white font-bold text-xl tracking-wide">
                ⚡ Processing Your Order...
              </p>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent mt-2 animate-pulse" />
              {/* Progress indicator */}
              <div className="mt-3 w-32 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" style={{width: '100%', animation: 'progress 1.5s ease-in-out'}} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Enhanced floating particles */}
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  </div>
)}

<style jsx>{`
  @keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  @keyframes float {
    0%, 100% { 
      transform: translateY(0px) rotate(0deg);
      opacity: 0.4;
    }
    50% { 
      transform: translateY(-20px) rotate(180deg);
      opacity: 0.8;
    }
  }
  
  .animation-delay-100 {
    animation-delay: 100ms;
  }
  
  .animation-delay-200 {
    animation-delay: 200ms;
  }
  
  .animation-delay-300 {
    animation-delay: 300ms;
  }
`}</style>

      <div className={`transition-all duration-300 ${showBlur ? "blur-sm" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-white/80 rounded-xl px-4 py-2 transition-all duration-200 transform hover:scale-105"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span
                className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                onClick={() => router.push(`/products?category=${product.category_id}`)}
              >
                {product.category_name}
              </span>
              {/* <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium truncate max-w-48 sm:max-w-64">{product.name}</span> */}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                <Eye className="w-3 h-3 mr-1" />
                {Math.floor(Math.random() * 1000) + 100} views
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl" aria-label="Share product">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Product link copied to clipboard')).catch(() => toast.error('Failed to copy link'))}>
                    Copy Link
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>Share on Social</DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Currency availability warning */}
          {!currencyAvailable && (
            <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                This product is not available in {selectedCurrency === 'INR' ? 'India' : 'UAE'}. Please select a variant available in {selectedCurrency === 'INR' ? 'India' : 'UAE'}.
              </AlertDescription>
            </Alert>
          )}

          {/* Purchase layout: sticky gallery + buy box */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-12 lg:items-start">
            {/* Product Images - sticky on desktop so details don't leave a blank column */}
            <div className="lg:sticky lg:top-24 space-y-4 self-start w-full">
              <div className="relative group">
                <div className="overflow-hidden rounded-2xl shadow-xl bg-white p-3 sm:p-4 border border-gray-100">
                  <Image
                    src={product.image_urls[selectedImageIndex] || `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name)}`}
                    alt={product.name || 'Product image'}
                    width={600}
                    height={600}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 560px"
                    className="w-full h-[320px] sm:h-[400px] lg:h-[460px] object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    {product.is_new && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New Release
                      </Badge>
                    )}
                    {product.condition_type && product.condition_type !== 'none' && (
                      <Badge
                        className={`bg-gradient-to-r ${conditionColors[product.condition_type]} text-white font-medium text-sm px-3 py-1 rounded-full shadow-md capitalize`}
                      >
                        {conditionLabels[product.condition_type]}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={(selectedVariant?.stock_quantity ?? 0) > 5 ? "default" : "destructive"}
                    className={`absolute bottom-5 right-5 shadow-lg ${(selectedVariant?.stock_quantity ?? 0) <= 5 ? "bg-red-500 text-white" : ""}`}
                  >
                    {(selectedVariant?.stock_quantity ?? 0) > 5
                      ? "In Stock"
                      : (selectedVariant?.stock_quantity ?? 0) > 0
                      ? `Only ${selectedVariant?.stock_quantity ?? 0} left`
                      : "Out of Stock"}
                  </Badge>
                </div>
              </div>
              {product.image_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {product.image_urls.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                        selectedImageIndex === index ? "ring-2 ring-orange-500 shadow-md" : "hover:shadow-sm opacity-90 hover:opacity-100"
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    >
                      <Image
                        src={image || `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(product.name)}`}
                        alt={`${product.name} image ${index + 1}`}
                        width={100}
                        height={100}
                        sizes="(max-width: 768px) 25vw, 100px"
                        className="w-full h-16 sm:h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buy box */}
            <div className="space-y-5">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {reviewCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTab("reviews")
                        document.getElementById("product-details")?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-1">
                        {averageRating.toFixed(1)} ({reviewCount})
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTab("reviews")
                        document.getElementById("product-details")?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      className="text-sm text-gray-500 hover:text-orange-600"
                    >
                      Be the first to review
                    </button>
                  )}
                  {product.is_new && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <Award className="w-3 h-3 mr-1" />
                      Bestseller
                    </Badge>
                  )}
                </div>
              </div>

              <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-end gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-red-500">
                      {currencyAvailable && selectedVariant
                        ? formatPriceWithSmallDecimals(
                            selectedVariant.discount_aed,
                            selectedVariant.discount_inr,
                            selectedCurrency,
                            true,
                            "#ef4444"
                          )
                        : `Not available in ${selectedCurrency}`}
                    </span>
                    {currencyAvailable && (
                      <span className="text-base text-gray-400 line-through pb-1">
                        {formatPriceWithSmallDecimals(
                          selectedVariant?.price_aed,
                          selectedVariant?.price_inr,
                          selectedCurrency,
                          true,
                          "#6B7280"
                        )}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <Badge className="bg-red-100 text-red-700 text-xs mb-1">Save {discountPercent}%</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-green-500 shrink-0" />
                      {(selectedCurrency === 'AED' ? selectedVariant?.free_delivery_aed : selectedVariant?.free_delivery_inr) ? (
                        <span className="text-green-600 font-semibold">Free Delivery</span>
                      ) : (
                        <span>Doorstep Delivery</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Verified className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Sabs Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                      {product.warranty_months && product.warranty_months !== "0" ? (
                        <span>{product.warranty_months} Months Warranty</span>
                      ) : (
                        <span className="text-green-600 font-medium">Quality Assured</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {product.variants.length > 0 && (
                <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
                  <h3 className="font-semibold text-base text-gray-900 mb-3">Select Variant</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {product.variants.map((variant) => {
                      const isDisabled = !hasSelectedCurrencyPrice(variant) || variant.stock_quantity === 0;
                      const isSelected = selectedVariant?.id === variant.id;
                      const isLowStock = variant.stock_quantity > 0 && variant.stock_quantity <= 5;

                      return (
                        <Button
                          key={variant.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`p-3 text-sm h-auto w-full min-w-0 whitespace-normal text-left flex flex-col items-stretch gap-1 overflow-hidden ${
                            isSelected
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              : isDisabled
                              ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => handleVariantChange(variant)}
                          disabled={isDisabled}
                          aria-label={`Select variant ${variant.name}${isDisabled ? ' (not available)' : ''}`}
                        >
                          <span
                            className={`w-full break-words whitespace-normal leading-snug font-semibold ${
                              isSelected ? "text-white" : isDisabled ? "text-gray-500" : "text-gray-900"
                            }`}
                          >
                            {variant.name}
                          </span>
                          <span className="w-full shrink-0">
                            {formatPriceWithSmallDecimals(
                              variant.discount_aed,
                              variant.discount_inr,
                              selectedCurrency,
                              true,
                              isSelected ? "#fff" : isDisabled ? "#9ca3af" : "#ef4444"
                            )}
                          </span>
                          {variant.stock_quantity === 0 && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${isSelected ? "bg-white/20 text-white" : "bg-red-50 text-red-600"}`}>
                              Out of Stock
                            </span>
                          )}
                          {!hasSelectedCurrencyPrice(variant) && variant.stock_quantity > 0 && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${isSelected ? "bg-white/20 text-white" : "bg-red-50 text-red-600"}`}>
                              Not available in {selectedCurrency === 'INR' ? 'India' : 'UAE'}
                            </span>
                          )}
                          {variant.stock_quantity > 0 && hasSelectedCurrencyPrice(variant) && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                              isSelected ? "bg-white/20 text-white" : isLowStock ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                            }`}>
                              {isLowStock ? `Only ${variant.stock_quantity} left` : `${variant.stock_quantity} in stock`}
                            </span>
                          )}
                          {(selectedCurrency === 'AED' ? variant.free_delivery_aed : variant.free_delivery_inr) && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${isSelected ? "bg-white/20 text-white" : "bg-green-50 text-green-700"}`}>
                              Free Delivery
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-900">Quantity</span>
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-lg hover:bg-white"
                      disabled={!currencyAvailable || !selectedVariant || (selectedVariant?.stock_quantity ?? 0) === 0}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-5 py-1.5 font-bold min-w-14 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock_quantity ?? 0, quantity + 1))}
                      className="rounded-lg hover:bg-white"
                      disabled={!currencyAvailable || !selectedVariant || (selectedVariant?.stock_quantity ?? 0) === 0}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white py-4 text-base font-bold rounded-2xl shadow-lg disabled:opacity-50"
                  disabled={!product.is_available || !selectedVariant || (selectedVariant?.stock_quantity ?? 0) === 0 || !currencyAvailable}
                  aria-label="Buy now"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {!selectedVariant || !isVariantAvailable(selectedVariant)
                    ? (!hasSelectedCurrencyPrice(selectedVariant)
                      ? `Not available in ${selectedCurrency === 'INR' ? 'India' : 'UAE'}`
                      : 'Out of Stock')
                    : "Buy Now - Quick Checkout"}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="py-3 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                    disabled={!product.is_available || !selectedVariant || (selectedVariant?.stock_quantity ?? 0) === 0 || !currencyAvailable}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() => handleToggleWishlist(product)}
                    variant="outline"
                    className={`py-3 rounded-xl ${
                      isInWishlist(product.id)
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 border-2'
                        : 'border-2 border-gray-200 hover:border-red-200 hover:bg-red-50'
                    }`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {isInWishlist(product.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width product details (tabs keep purchase area compact) */}
          <section id="product-details" className="mt-12 lg:mt-16 scroll-mt-28">
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
              <div className="flex gap-1 min-w-max" role="tablist" aria-label="Product details">
                {[
                  { id: "about" as const, label: "About", show: Boolean(product.description) },
                  { id: "features" as const, label: "Features", show: Boolean(product.features?.length) },
                  { id: "specs" as const, label: "Specifications", show: true },
                  { id: "reviews" as const, label: `Reviews${reviewCount ? ` (${reviewCount})` : ""}`, show: true },
                ].filter((t) => t.show).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={detailTab === tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                      detailTab === tab.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
              {detailTab === "about" && product.description && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    About Product
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {detailTab === "features" && product.features?.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-500" />
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-2 h-2 mt-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === "specs" && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      ...(product.brand ? [{ label: "Brand", value: product.brand }] : []),
                      ...(product.model ? [{ label: "Model", value: product.model }] : []),
                      ...(product.color ? [{ label: "Color", value: product.color }] : []),
                      ...(product.storage_capacity ? [{ label: "Storage", value: product.storage_capacity }] : []),
                      ...(product.condition_type && product.condition_type !== 'none' ? [{ label: "Condition", value: conditionLabels[product.condition_type] }] : []),
                      { label: "Currency", value: selectedCurrency },
                      {
                        label: "Available in",
                        value: selectedVariant
                          ? [selectedVariant.available_aed ? 'UAE' : null, selectedVariant.available_inr ? 'India' : null].filter(Boolean).join(' / ') || 'N/A'
                          : 'N/A'
                      },
                      ...(product.warranty_months && product.warranty_months !== "0"
                        ? [{ label: "Warranty", value: `${product.warranty_months} months` }]
                        : []),
                      { label: "Stock", value: `${selectedVariant?.stock_quantity ?? 0} available` },
                    ].map((spec, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl gap-3">
                        <span className="text-sm text-gray-500 font-medium">{spec.label}</span>
                        <span className={`text-sm font-semibold text-right ${spec.label === 'Stock' ? 'text-green-600' : 'text-gray-900'}`}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {product.specifications_text && (
                    <p className="mt-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-5">
                      {product.specifications_text}
                    </p>
                  )}
                </div>
              )}

              {detailTab === "reviews" && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-yellow-500" />
                    Reviews & Ratings
                  </h3>

                  {reviewsLoading ? (
                    <p className="text-sm text-gray-500">Loading reviews...</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          {reviewCount > 0
                            ? `${averageRating.toFixed(1)} average from ${reviewCount} review${reviewCount > 1 ? "s" : ""}`
                            : "No reviews yet"}
                        </p>
                      </div>

                      <div className="border rounded-xl p-4 bg-gray-50 mb-5">
                        <p className="text-sm font-semibold text-gray-800 mb-2">
                          {userReview ? "Update your review" : "Write a review"}
                        </p>
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1"
                              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              <Star
                                className={`w-5 h-5 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience (optional)"
                          className="min-h-[96px] bg-white"
                          maxLength={1000}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-3">
                          {canReview ? (
                            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                              Verified buyer — you can submit a review.
                            </p>
                          ) : (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900 w-full sm:w-auto sm:flex-1">
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                              <div>
                                <p className="text-sm font-semibold leading-tight">Purchase required</p>
                                <p className="text-xs mt-0.5 text-amber-800">
                                  Buy this product first to submit a review.
                                </p>
                              </div>
                            </div>
                          )}
                          <Button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={!canReview || reviewSubmitting}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white shrink-0"
                          >
                            {reviewSubmitting ? "Saving..." : userReview ? "Update Review" : "Submit Review"}
                          </Button>
                        </div>
                        {userReview && userReview.is_approved === false && (
                          <p className="text-xs text-amber-600 mt-2">
                            Your review is pending admin approval before it appears publicly.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reviews.slice(0, 6).map((review) => (
                          <div key={review.id} className="border rounded-xl p-3 bg-gray-50/50">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-medium text-sm text-gray-900">
                                {review.customer_name || review.user_email || "Customer"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            {review.review_text ? (
                              <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
                            ) : (
                              <p className="text-xs text-gray-400">No comment added.</p>
                            )}
                          </div>
                        ))}
                        {reviews.length === 0 && (
                          <p className="text-sm text-gray-500 md:col-span-2">Be the first to review this product.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Recommended Products Section */}
      <RecommendedProducts 
        currentProductId={product.id}
        categoryId={product.category_id}
        shopCategory={product.shop_category}
      />

      <Footer />
    </div>
  )
}