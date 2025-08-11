"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts, fetchCategories, setSelectedCategory } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Star,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  Zap,
  Tag,
  Menu,
  Bell,
  ShoppingCart,
  User,
  Heart,
  Grid3X3,
  List,
  SlidersHorizontal,
  Gift,
} from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import SpinWheel from "@/components/ui/offer-spinner"

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth()
  const [showSpinner, setShowSpinner] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryTransition, setCategoryTransition] = useState(false)

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setAuthInitialized(true)
    }, 300)

    if (!isAuthenticated) {
      const hasSeenSpinner = sessionStorage.getItem("hasSeenOfferSpinner")
      if (!hasSeenSpinner) {
        const timer = setTimeout(() => {
          setShowSpinner(true)
          sessionStorage.setItem("hasSeenOfferSpinner", "true")
        }, 1000)
        return () => {
          clearTimeout(timer)
          clearTimeout(initTimer)
        }
      }
    }

    return () => clearTimeout(initTimer)
  }, [isAuthenticated])

  const dispatch = useDispatch<AppDispatch>()
  const { items, categories, selectedCategory, loading } = useSelector((state: RootState) => state.products)
  const { formatPrice } = useSettings()
  const [searchTerm, setSearchTerm] = useState("")
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category")
  const { shop } = useShop()

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())
    if (categoryFromUrl) {
      dispatch(setSelectedCategory(Number(categoryFromUrl)))
    }
  }, [dispatch, categoryFromUrl])

  const handleCategoryChange = (categoryId: number | null) => {
    setCategoryTransition(true)
    setTimeout(() => {
      dispatch(setSelectedCategory(categoryId))
      setCategoryTransition(false)
    }, 150)
  }

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  const handleCloseSpinner = () => {
    setShowSpinner(false)
  }

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const shouldShowSpinButton = authInitialized && !isAuthenticated && !showSpinner

  // Get category-specific deals
  const getCurrentCategoryName = () => {
    if (selectedCategory === null) return "All Products"
    const category = categories.find((cat) => cat.id === selectedCategory)
    return category?.name || "Products"
  }

  const lightningDeals = filteredItems.filter((item) => item.is_featured).slice(0, 4)
  const clearanceDeals = filteredItems.filter((item) => item.price < 50).slice(0, 4)
  const newArrivals = filteredItems.filter((item) => item.is_new).slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offer Spinner Popup */}
      {showSpinner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <SpinWheel onClose={handleCloseSpinner} />
          </div>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 sticky top-0 z-40 shadow-lg">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold text-white">SABS ONLINE</h1>
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    placeholder="Search for anything..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-16 h-12 rounded-full bg-white border-0 text-base shadow-lg"
                  />
                  <ShoppingCart className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6 cursor-pointer hover:text-gray-700" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Bell className="w-6 h-6" />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Heart className="w-6 h-6" />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <ShoppingCart className="w-6 h-6" />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <User className="w-6 h-6" />
                </Button>
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="flex items-center gap-6">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                onClick={() => handleCategoryChange(null)}
                className={`rounded-full px-6 py-2 font-semibold transition-all duration-200 ${
                  selectedCategory === null ? "bg-white text-orange-600 shadow-lg" : "text-white hover:bg-white/20"
                }`}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full px-6 py-2 font-semibold transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-white text-orange-600 shadow-lg"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet Header */}
        <div className="hidden md:block lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-white">SABS ONLINE</h1>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                  <ShoppingCart className="w-5 h-5" />
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder="Search SABS ONLINE"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-12 h-10 rounded-full bg-white border-0 text-sm shadow-lg"
              />
              <ShoppingCart className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                onClick={() => handleCategoryChange(null)}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  selectedCategory === null ? "bg-white text-orange-600" : "text-white hover:bg-white/20"
                }`}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.id ? "bg-white text-orange-600" : "text-white hover:bg-white/20"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Menu className="w-6 h-6 text-white" />
              <h1 className="text-lg font-bold text-white">SABS ONLINE</h1>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search SABS ONLINE"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-10 h-9 rounded-full bg-white border-0 text-sm"
              />
              <ShoppingCart className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                onClick={() => handleCategoryChange(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                  selectedCategory === null ? "bg-white text-orange-600" : "text-white hover:bg-white/20"
                }`}
              >
                All
              </Button>
              {categories.slice(0, 6).map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    selectedCategory === category.id ? "bg-white text-orange-600" : "text-white hover:bg-white/20"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Transition */}
      <div
        className={`transition-all duration-300 ${categoryTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
      >
        {/* New User Gift Banner - Prominent Spin Button */}
        {shouldShowSpinButton && (
          <div className="px-4 lg:px-6 mt-4 lg:mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-2xl p-6 lg:p-8 text-center relative overflow-hidden shadow-xl border-4 border-white">
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                    <h3 className="text-white font-bold text-xl lg:text-3xl">New User Gift!</h3>
                    <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                  </div>
                  <p className="text-white text-lg lg:text-2xl font-bold mb-1">Spin to get $200</p>
                  <p className="text-white/90 text-sm lg:text-base mb-6">Coupon bundle waiting for you!</p>
                  <Button
                    onClick={() => setShowSpinner(true)}
                    className="bg-white text-orange-600 hover:bg-gray-100 px-8 lg:px-16 py-4 lg:py-6 rounded-full font-bold text-lg lg:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 border-orange-200"
                  >
                    🎯 SPIN NOW!
                  </Button>
                  <p className="text-white/80 text-xs lg:text-sm mt-3">Get up to 100% OFF on your first order!</p>
                </div>
                <div className="absolute top-4 right-6 text-white/20 text-4xl lg:text-8xl animate-pulse">🎁</div>
                <div className="absolute bottom-4 left-6 text-white/20 text-3xl lg:text-6xl animate-bounce">✨</div>
                <div className="absolute top-1/2 left-4 text-white/15 text-2xl lg:text-4xl animate-spin">🎪</div>
                <div className="absolute top-1/4 right-1/4 text-white/15 text-xl lg:text-3xl animate-pulse">💰</div>
              </div>
            </div>
          </div>
        )}

        {/* Back to School Banner - Responsive */}
        <div className="px-4 lg:px-6 mt-4 lg:mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-xl lg:rounded-2xl p-4 lg:p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-white font-bold text-lg lg:text-2xl mb-1 lg:mb-2">
                  {getCurrentCategoryName().toUpperCase()} SALE
                </h2>
                <div className="flex items-baseline gap-1 mb-2 lg:mb-4">
                  <span className="text-white text-xl lg:text-3xl font-bold">UP TO</span>
                  <span className="text-white text-3xl lg:text-6xl font-black">60% OFF</span>
                </div>
                <Button className="bg-white text-orange-500 hover:bg-gray-100 rounded-full px-4 lg:px-8 py-2 lg:py-3 text-sm lg:text-base font-bold">
                  SHOP NOW →
                </Button>
              </div>
              <div className="absolute top-2 right-4 text-white/20 text-4xl lg:text-8xl">🎯</div>
              <div className="absolute bottom-2 right-8 text-white/20 text-2xl lg:text-5xl">✨</div>
            </div>
          </div>
        </div>

        {/* Benefits Section - Responsive */}
        <div className="px-4 lg:px-6 mt-4 lg:mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
                <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                <div>
                  <p className="text-green-700 font-medium text-xs lg:text-sm">Free shipping</p>
                  <p className="text-green-600 text-xs">Unlimited orders</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                <div>
                  <p className="text-blue-700 font-medium text-xs lg:text-sm">Free returns</p>
                  <p className="text-blue-600 text-xs">Up to 90 days*</p>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
                <div>
                  <p className="text-purple-700 font-medium text-xs lg:text-sm">Secure payment</p>
                  <p className="text-purple-600 text-xs">100% protected</p>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
                <Star className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
                <div>
                  <p className="text-orange-700 font-medium text-xs lg:text-sm">Top quality</p>
                  <p className="text-orange-600 text-xs">Premium products</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:block px-6 mt-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-gray-900">{getCurrentCategoryName()}</h3>
              <span className="text-gray-500">({filteredItems.length} items)</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Category-Specific Deal Sections */}
        {lightningDeals.length > 0 && (
          <div className="px-4 lg:px-6 mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-lg lg:text-xl">Lightning deals in {getCurrentCategoryName()}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {lightningDeals.map((item, index) => (
                  <Card
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <Image
                        src={
                          item.image_url ||
                          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                        }
                        alt={item.name}
                        width={200}
                        height={200}
                        className="w-full h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center text-xs lg:text-sm font-bold">
                        {index + 1}
                      </div>
                      <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">FLASH</Badge>
                    </div>
                    <CardContent className="p-3 lg:p-4">
                      <p className="text-red-500 font-bold text-sm lg:text-base">{formatPrice(item.price)}</p>
                      <p className="text-gray-400 text-xs line-through">{formatPrice(item.price * 1.8)}</p>
                      <p className="text-xs lg:text-sm text-gray-600 mt-1 line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full py-2 text-xs lg:text-sm font-medium"
                      >
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
          <div className="px-4 lg:px-6 mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-lg lg:text-xl">New in {getCurrentCategoryName()}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {newArrivals.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <Image
                        src={
                          item.image_url ||
                          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                        }
                        alt={item.name}
                        width={200}
                        height={200}
                        className="w-full h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">NEW</Badge>
                    </div>
                    <CardContent className="p-3 lg:p-4">
                      <p className="text-green-600 font-bold text-sm lg:text-base">{formatPrice(item.price)}</p>
                      <p className="text-xs lg:text-sm text-gray-600 mt-1 line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(New)</span>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white rounded-full py-2 text-xs lg:text-sm font-medium"
                      >
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alternative Spin Button for authenticated users or after initial show */}
        {!shouldShowSpinButton && !isAuthenticated && (
          <div className="px-4 lg:px-6 mt-6">
            <div className="max-w-7xl mx-auto text-center">
              <Button
                onClick={() => setShowSpinner(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 lg:px-12 py-3 lg:py-4 rounded-full font-bold text-base lg:text-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
              >
                🎯 Spin for Discount!
              </Button>
              <p className="text-sm lg:text-base text-gray-600 mt-2">Get up to 100% OFF on your first order!</p>
            </div>
          </div>
        )}

        {/* Main Products Grid - Responsive */}
        <div className="px-4 lg:px-6 mt-6 pb-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div
                className={`grid gap-3 lg:gap-6 ${
                  viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
                className={`grid gap-3 lg:gap-6 ${
                  viewMode === "list" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                      <Image
                        src={
                          item.image_url ||
                          `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                        }
                        alt={item.name}
                        width={200}
                        height={200}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "list" ? "w-full h-full" : "w-full h-40 lg:h-48"
                        }`}
                      />
                      {item.is_new && (
                        <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">NEW</Badge>
                      )}
                      {item.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">HOT</Badge>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                        4.8
                      </div>
                    </div>
                    <CardContent className={`p-3 lg:p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-red-500 font-bold text-sm lg:text-lg">{formatPrice(item.price)}</p>
                          <p className="text-gray-400 text-xs lg:text-sm line-through">
                            {formatPrice(item.price * 1.6)}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-600 text-xs">-38%</Badge>
                      </div>
                      <h3 className="text-sm lg:text-base font-medium text-gray-900 line-clamp-2 mb-2">{item.name}</h3>
                      {viewMode === "list" && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{item.description}</p>
                      )}
                      {item.features && item.features.length > 0 && (
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
                      )}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(4.8) • 2.1k sold</span>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full py-2 lg:py-3 text-sm lg:text-base font-medium shadow-lg"
                        disabled={!item.is_available}
                      >
                        {item.is_available ? "Add to Cart" : "Unavailable"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or category selection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
