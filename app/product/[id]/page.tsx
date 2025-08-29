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
import { Star, ArrowLeft, ShoppingCart, Heart, Share2, Globe, AlertCircle } from "lucide-react"
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
      router.push('/order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-8 w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-300 h-96 rounded-xl"></div>
              <div className="space-y-4">
                <div className="bg-gray-300 h-8 w-3/4"></div>
                <div className="bg-gray-300 h-6 w-1/2"></div>
                <div className="bg-gray-300 h-4 w-full"></div>
                <div className="bg-gray-300 h-4 w-5/6"></div>
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="bg-orange-500 hover:bg-orange-600">
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  const currencyAvailable = hasSelectedCurrencyPrice(product)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{product.category_name}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
         
        </div>

        {/* Currency availability warning */}
        {!currencyAvailable && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              This product is not available in {selectedCurrency}. Please switch to {product.default_currency} to view pricing and make a purchase.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={product.image_url || `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(product.name)}`}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-96 lg:h-[500px] object-cover rounded-xl shadow-lg"
              />
              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-orange-500 text-white">HOT</Badge>
              )}
              {product.is_new && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">NEW</Badge>
              )}
              <Badge className="absolute bottom-4 left-4 bg-blue-500 text-white text-xs">
                {product.shop_category}
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
            </div>

            {/* Price - Now uses currency context with proper multi-currency support */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-bold text-red-500">
                  {currencyAvailable 
                    ? formatPrice(product.price_aed, product.price_inr, product.default_currency)
                    : `Not available in ${selectedCurrency}`
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Free shipping • 30-day returns {currencyAvailable && `• Available`}
              </p>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About Product</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Brand:</span>
                  <span className="ml-2 font-medium">{product.brand}</span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-2 font-medium">{product.model}</span>
                </div>
                <div>
                  <span className="text-gray-500">Currency:</span>
                  <span className="ml-2 font-medium">{selectedCurrency}</span>
                </div>
                <div>
                  <span className="text-gray-500">Available in:</span>
                  <span className="ml-2 font-medium">
                    {[
                      product.price_aed && product.price_aed > 0 ? 'AED' : null,
                      product.price_inr && product.price_inr > 0 ? 'INR' : null
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
                {product.storage_capacity && (
                  <div>
                    <span className="text-gray-500">Storage:</span>
                    <span className="ml-2 font-medium">{product.storage_capacity}</span>
                  </div>
                )}
                {product.color && (
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <span className="ml-2 font-medium">{product.color}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Warranty:</span>
                  <span className="ml-2 font-medium">{product.warranty_months} months</span>
                </div>
                <div>
                  <span className="text-gray-500">Stock:</span>
                  <span className="ml-2 font-medium text-green-600">{product.stock_quantity} available</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3"
                  disabled={!currencyAvailable}
                >
                  -
                </Button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3"
                  disabled={!currencyAvailable}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 text-lg font-medium"
                  disabled={!product.is_available || product.stock_quantity === 0 || !currencyAvailable}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {!currencyAvailable 
                    ? `Not available in ${selectedCurrency}` 
                    : "Buy Now"
                  }
                </Button>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleAddToCart}
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={!product.is_available || product.stock_quantity === 0 || !currencyAvailable}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  onClick={() => handleToggleWishlist(product)}
                  variant="outline" 
                  size="sm" 
                  className={`flex-1 ${
                    isInWishlist(product.id)
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : ''
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist(product.id) ? 'fill-red-500' : ''}`} />
                  {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
