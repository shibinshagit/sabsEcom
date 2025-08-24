"use client"

import { useSelector, useDispatch } from "react-redux"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { removeFromWishlist } from "@/lib/store/slices/wishlistSlice"
import type { RootState, AppDispatch } from "@/lib/store"
import { useSettings } from "@/lib/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Star, Trash2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const { formatPrice } = useSettings()

  const handleRemoveFromWishlist = (productId: number) => {
    dispatch(removeFromWishlist(productId))
  }

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
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
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
              </p>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
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
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-orange-600 font-bold text-lg">{formatPrice(item.price)}</p>
                      <p className="text-gray-400 text-sm line-through">
                        {formatPrice(item.price * 1.6)}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-600 text-xs">SAVE 38%</Badge>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                  </div>

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
      </div>

      <Footer />
    </main>
  )
}
