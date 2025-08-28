"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { addToWishlist, removeFromWishlist } from "@/lib/store/slices/wishlistSlice"
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
    return true // fallback
  }

  const handleToggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      dispatch(removeFromWishlist({
        productId: product.id,
        userId: user?.id
      }))
    } else {
      dispatch(addToWishlist({
        item: {
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
        },
        userId: user?.id
      }))
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

  // FIXED ADD TO CART - NOW MATCHES PRODUCT LIST FORMAT
  const handleAddToCart = () => {
    if (product && hasSelectedCurrencyPrice(product)) {
      dispatch(addToCart({
        menuItem: product,
        quantity,
        selectedCurrency,
        userId: user?.id
      }))
      // Don't redirect to /order for "Add to Cart" - just add to cart
    }
  }

  // FIXED BUY NOW - NOW MATCHES PRODUCT LIST FORMAT
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

  // Currency switch handler
  const handleCurrencyChange = (currency: 'AED' | 'INR') => {
    setSelectedCurrency(currency)
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

          {/* Currency Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="font-semibold">{selectedCurrency}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 border-0 shadow-xl">
              <div className="bg-white rounded-lg">
                <DropdownMenuItem
                  onClick={() => handleCurrencyChange('AED')}
                  className={`cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                    selectedCurrency === 'AED' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">AED</span>
                      </div>
                      <div>
                        <span className="font-medium">UAE Dirham</span>
                        <p className="text-xs text-gray-500">AED</p>
                      </div>
                    </div>
                    {selectedCurrency === 'AED' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCurrencyChange('INR')}
                  className={`cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                    selectedCurrency === 'INR' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">₹</span>
                      </div>
                      <div>
                        <span className="font-medium">Indian Rupee</span>
                        <p className="text-xs text-gray-500">INR</p>
                      </div>
                    </div>
                    {selectedCurrency === 'INR' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                </div>
                <span className="text-sm text-gray-500">• 2.1k sold</span>
                <Badge variant="outline" className="text-xs">{product.condition_type}</Badge>
              </div>
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
                {currencyAvailable && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {selectedCurrency === 'AED' && product.price_aed
                        ? `AED ${(product.price_aed * 1.6).toFixed(2)}`
                        : selectedCurrency === 'INR' && product.price_inr
                        ? `₹ ${(product.price_inr * 1.6).toFixed(2)}`
                        : `${formatPrice(product.price_aed, product.price_inr, product.default_currency)} + 60%`
                      }
                    </span>
                    <Badge className="bg-red-100 text-red-600">-38% OFF</Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Free shipping • 30-day returns {currencyAvailable && `• Available in ${selectedCurrency}`}
              </p>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
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

            {/* Additional Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Product Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Fast and free shipping</li>
                  <li>• 30-day return policy</li>
                  <li>• {product.warranty_months} months warranty</li>
                  <li>• Secure payment options</li>
                  <li>• Available currencies: {[
                    product.price_aed && product.price_aed > 0 ? 'AED' : null,
                    product.price_inr && product.price_inr > 0 ? 'INR' : null
                  ].filter(Boolean).join(', ')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
