"use client"

import { useSelector, useDispatch } from "react-redux"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { removeFromWishlistAPI } from "@/lib/store/slices/wishlistSlice" 
import type { RootState, AppDispatch } from "@/lib/store"
import { useSettings } from "@/lib/contexts/settings-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Star, Trash2, ArrowLeft, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const { formatPrice } = useSettings()
  const { selectedCurrency, formatPrice: formatCurrencyPrice } = useCurrency()

  const hasSelectedCurrencyPrice = (item: any) => {
    if (selectedCurrency === 'AED') {
      return item.price_aed && item.price_aed > 0
    } else if (selectedCurrency === 'INR') {
      return item.price_inr && item.price_inr > 0
    }
    return true 
  }

  const currencyFilteredItems = wishlistItems.filter(item => hasSelectedCurrencyPrice(item))

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await dispatch(removeFromWishlistAPI(productId)).unwrap()
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      alert('Failed to remove item from wishlist. Please try again.')
    }
  }

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600">
                  {currencyFilteredItems.length} {currencyFilteredItems.length === 1 ? 'item' : 'items'} available
                </p>
                {currencyFilteredItems.length !== wishlistItems.length && (
                  <p className="text-orange-600 text-sm">
                    {wishlistItems.length - currencyFilteredItems.length} items hidden (no {selectedCurrency} pricing)
                  </p>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💝</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Start adding products you love to your wishlist!</p>
            <Link href="/products">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : currencyFilteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💱</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No items available in {selectedCurrency}</h3>
            <p className="text-gray-500 mb-6">
              You have {wishlistItems.length} items in your wishlist, but none have {selectedCurrency} pricing available.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/products">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full">
                  Browse Products
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="px-8 py-3 rounded-full"
              >
                Try Different Currency
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currencyFilteredItems.map((item) => (
              <Card key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <Link href={`/product/${item.id}`}>
                    <Image
                      src={item.image_url || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  
                  <Button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>

                  {item.shop_category && (
                    <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs">
                      {item.shop_category}
                    </Badge>
                  )}

                  {/* Currency badge */}
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
                    {selectedCurrency}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-orange-600 font-bold text-lg">
                        {formatCurrencyPrice(item.price_aed, item.price_inr, item.default_currency)}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full py-3 text-sm font-medium shadow-lg flex items-center justify-center gap-2"
                      disabled={!item.is_available}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {item.is_available ? 'Add to Cart' : 'Unavailable'}
                    </Button>

                    <Button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      Remove from Wishlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary section for filtered results */}
        {wishlistItems.length > 0 && currencyFilteredItems.length !== wishlistItems.length && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Currency Filter Applied</h3>
            </div>
            <p className="text-amber-700 text-sm">
              Showing {currencyFilteredItems.length} out of {wishlistItems.length} items with {selectedCurrency} pricing. 
              Switch currency in the navbar to see other items.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
