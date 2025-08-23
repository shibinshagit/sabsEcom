"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/store"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft, ShoppingCart, Heart, Share2 } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number
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
  category_name: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { formatPrice } = useSettings()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

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
    if (product) {
      dispatch(addToCart({ menuItem: product, quantity }))
      // Navigate to cart page
      router.push('/order')
    }
  }

  const handleBuyNow = () => {
    if (product) {
      dispatch(addToCart({ menuItem: product, quantity }))
      router.push('/checkout')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
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

            {/* Price */}
            <div className="border-b pb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-bold text-red-500">{formatPrice(product.price)}</span>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price * 1.6)}</span>
                <Badge className="bg-red-100 text-red-600">-38% OFF</Badge>
              </div>
              <p className="text-sm text-gray-600">Free shipping • 30-day returns</p>
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
                >
                  -
                </Button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 text-lg font-medium"
                  disabled={!product.is_available || product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                
              </div>
              
              <div className="flex gap-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Wishlist
                </Button>
                
              </div>
            </div>

            {/* Additional Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">product specification</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Fast and free shipping</li>
                  <li>• 30-day return policy</li>
                  <li>• {product.warranty_months} months warranty</li>
                  <li>• Secure payment options</li>
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
