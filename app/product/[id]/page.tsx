"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { addToWishlistAPI, removeFromWishlistAPI } from '@/lib/store/slices/wishlistSlice'

import { useCurrency } from "@/lib/contexts/currency-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, Globe, AlertCircle, Plus, Minus, Truck, Shield, RotateCcw, Award, Zap, ChevronRight, Eye, Sparkles } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Product {
  id: number
  name: string
  description: string
  price: number 
  price_aed: number | null
  price_inr: number | null
  default_currency: 'AED' | 'INR'
  image_url: string
  category_id: number
  category_name: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  features: string[]
  specifications_text: string
  warranty_months: number
  brand: string
  model: string
  condition_type: string
  storage_capacity: string
  color: string
  stock_quantity: number
  shop_category: string
}

export default function ProductPage() {
  // ADD AUTH CONTEXT
  const { user, isAuthenticated } = useAuth()
  
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { selectedCurrency, setSelectedCurrency, formatPrice } = useCurrency()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Animation states
  const [showBlur, setShowBlur] = useState(false)
  const [animationType, setAnimationType] = useState<'cart' | 'wishlist' | 'buy' | null>(null)

  // Trigger blur animation
  const triggerBlurAnimation = (type: 'cart' | 'wishlist' | 'buy') => {
    setAnimationType(type)
    setShowBlur(true)
    
    // Hide animation after 2.5 seconds
    setTimeout(() => {
      setShowBlur(false)
      setAnimationType(null)
    }, 2500)
  }

  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.id === productId)
  }

  const hasSelectedCurrencyPrice = (product: Product) => {
    if (selectedCurrency === 'AED') {
      return product.price_aed && product.price_aed > 0
    } else if (selectedCurrency === 'INR') {
      return product.price_inr && product.price_inr > 0
    }
    return true
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
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      } else {
        console.error("Product not found")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product && hasSelectedCurrencyPrice(product)) {
      dispatch(addToCart({
        menuItem: product,
        quantity,
        selectedCurrency,
        userId: user?.id
      }))
      // Trigger cart animation
      triggerBlurAnimation('cart')
    }
  }

  const handleBuyNow = () => {
    if (product && hasSelectedCurrencyPrice(product)) {
      dispatch(addToCart({
        menuItem: product,
        quantity,
        selectedCurrency,
        userId: user?.id
      }))
      // Trigger buy animation
      triggerBlurAnimation('buy')
      
      // Navigate after animation
      setTimeout(() => {
        router.push('/order')
      }, 1500)
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
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-96 lg:h-[600px] rounded-2xl"></div>
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
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  const currencyAvailable = hasSelectedCurrencyPrice(product)

  // Mock additional images for demo
  const productImages = [
    product.image_url,
    product.image_url,
    product.image_url,
    product.image_url
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      <Navbar />
      
      {/* Blur Overlay with Animation */}
      {showBlur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" />
          
          {/* Animated Icon */}
          <div className="relative z-10">
            {animationType === 'wishlist' && (
              <div className="animate-in zoom-in duration-500 animate-out zoom-out fade-out delay-1500 duration-1000">
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-full p-8 shadow-2xl animate-bounce">
                  <Heart className="w-20 h-20 text-white fill-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-full p-8 opacity-30 animate-ping" />
                <div className="text-center mt-4">
                  <p className="text-white font-semibold text-lg bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
                    Added to Wishlist! ❤️
                  </p>
                </div>
              </div>
            )}
            
            {animationType === 'cart' && (
              <div className="animate-in zoom-in duration-500 animate-out zoom-out fade-out delay-1500 duration-1000">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-8 shadow-2xl animate-bounce">
                  <ShoppingCart className="w-20 h-20 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-8 opacity-30 animate-ping" />
                <div className="text-center mt-4">
                  <p className="text-white font-semibold text-lg bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
                    Added to Cart! 🛒
                  </p>
                </div>
              </div>
            )}

            {animationType === 'buy' && (
              <div className="animate-in zoom-in duration-500 animate-out zoom-out fade-out delay-1000 duration-1000">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl animate-bounce">
                  <Zap className="w-20 h-20 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 opacity-30 animate-ping" />
                <div className="text-center mt-4">
                  <p className="text-white font-semibold text-lg bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
                    Processing Order... ⚡
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={`transition-all duration-300 ${showBlur ? "blur-sm" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Enhanced Breadcrumb */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-white/80 rounded-xl px-4 py-2 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">{product.category_name}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium truncate max-w-48">{product.name}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                <Eye className="w-3 h-3 mr-1" />
                {Math.floor(Math.random() * 1000) + 100} views
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem>Copy Link</DropdownMenuItem>
                  <DropdownMenuItem>Share on Social</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Currency availability warning */}
          {!currencyAvailable && (
            <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                This product is not available in {selectedCurrency}. Please switch to {product.default_currency} to view pricing and make a purchase.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Enhanced Product Images */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="overflow-hidden rounded-2xl shadow-2xl bg-white p-4">
                  <Image
                    src={productImages[selectedImageIndex] || `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-80 sm:h-96 lg:h-[500px] object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Premium Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {product.is_featured && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        HOT
                      </Badge>
                    )}
                    {product.is_new && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                        NEW
                      </Badge>
                    )}
                  </div>
                  
                  <Badge className="absolute bottom-6 left-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                    Shop {product.shop_category}
                  </Badge>
                  
                  {/* Stock indicator */}
                  <div className="absolute bottom-6 right-6">
                    <Badge variant={product.stock_quantity > 5 ? "default" : "destructive"} className="shadow-lg">
                      {product.stock_quantity > 5 ? "In Stock" : `Only ${product.stock_quantity} left`}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-3">
                {productImages.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      selectedImageIndex === index 
                        ? "ring-2 ring-orange-500 shadow-lg" 
                        : "hover:shadow-md"
                    }`}
                  >
                    <Image
                      src={image || `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(product.name)}`}
                      alt={`${product.name} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Product Details */}
            <div className="space-y-8">
              {/* Title and Rating */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">(4.8 • 234 reviews)</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Award className="w-3 h-3 mr-1" />
                        Bestseller
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Price Section */}
              <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border-0 shadow-lg rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                      {currencyAvailable 
                        ? formatPrice(product.price_aed, product.price_inr, product.default_currency)
                        : `Not available in ${selectedCurrency}`
                      }
                    </span>
                    {currencyAvailable && (
                      <div className="flex flex-col">
                        <span className="text-lg text-gray-400 line-through">
                          {selectedCurrency === 'AED' ? 'AED 899' : 'INR 25,999'}
                        </span>
                        <Badge className="bg-red-100 text-red-700 text-xs">Save 20%</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Door step Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <RotateCcw className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">30-day returns</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">Warranty</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Enhanced Product Info */}
              <div className="space-y-6">
                <Card className="p-6 border-0 shadow-lg rounded-2xl">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    About Product
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </Card>

                {/* Key Features */}
                {product.features && product.features.length > 0 && (
                  <Card className="p-6 border-0 shadow-lg rounded-2xl">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
                      Key Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Specifications */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Brand", value: product.brand },
                      { label: "Model", value: product.model },
                      { label: "Currency", value: selectedCurrency },
                      { 
                        label: "Available in", 
                        value: [
                          product.price_aed && product.price_aed > 0 ? 'AED' : null,
                          product.price_inr && product.price_inr > 0 ? 'INR' : null
                        ].filter(Boolean).join(', ')
                      },
                      ...(product.storage_capacity ? [{ label: "Storage", value: product.storage_capacity }] : []),
                      ...(product.color ? [{ label: "Color", value: product.color }] : []),
                      { label: "Warranty", value: `${product.warranty_months} months` },
                      { label: "Stock", value: `${product.stock_quantity} available` }
                    ].map((spec, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 font-medium">{spec.label}:</span>
                        <span className={`text-sm font-semibold ${spec.label === 'Stock' ? 'text-green-600' : 'text-gray-900'}`}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Enhanced Quantity Selector */}
              <Card className="p-6 border-0 shadow-lg rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Quantity:</span>
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-lg hover:bg-white transition-colors"
                      disabled={!currencyAvailable}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-6 py-2 font-bold text-lg min-w-16 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="rounded-lg hover:bg-white transition-colors"
                      disabled={!currencyAvailable}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Enhanced Action Buttons */}
              <div className="space-y-4 sticky bottom-4 z-10">
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white py-4 text-lg font-bold rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
                  disabled={!product.is_available || product.stock_quantity === 0 || !currencyAvailable}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {!currencyAvailable 
                    ? `Not available in ${selectedCurrency}` 
                    : "Buy Now - Quick Checkout"
                  }
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleAddToCart}
                    variant="outline" 
                    className="py-3 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    disabled={!product.is_available || product.stock_quantity === 0 || !currencyAvailable}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={() => handleToggleWishlist(product)}
                    variant="outline" 
                    className={`py-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isInWishlist(product.id)
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 border-2'
                        : 'border-2 border-gray-200 hover:border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {isInWishlist(product.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}