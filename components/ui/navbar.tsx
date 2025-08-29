"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Menu, X, ShoppingBag, User, LogOut, ShoppingCart, Search, Bell, Heart, Sparkles, Watch, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSelector } from "react-redux"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import type { RootState } from "@/lib/store"
import Image from "next/image"
import Banner from "@/components/ui/banner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useShop } from "@/lib/contexts/shop-context"
import LoginModal from "@/components/auth/login-modal"
import { useUser } from "@clerk/nextjs"

const baseNavigation = [
  { name: "All Products", href: "/products" },
]

interface Category {
  id: string | number
  name: string
  slug?: string
  shop?: "A" | "B"
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { settings } = useSettings()
  const { user, logout, isAuthenticated } = useAuth()
  const { shop, setShop } = useShop()
  const { user: clerkUser } = useUser()
  const { selectedCurrency, setSelectedCurrency, getCurrencySymbol } = useCurrency()
  const searchParams = useSearchParams()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const wishlistCount = wishlistItems.length

  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home"

  // Handle search functionality
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    
    if (term.trim().length === 0) {
      setShowSearchDropdown(false)
      setSearchResults([])
      // Update URL to clear search
      if (pathname === "/products") {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        router.push(`/products?${params.toString()}`)
      }
      return
    }

    if (term.trim().length < 2) {
      setShowSearchDropdown(false)
      return
    }

    setIsSearching(true)
    setShowSearchDropdown(true)

    try {
      // Search in products
      const response = await fetch(`/api/admin/products`)
      const allProducts = await response.json()
      
      // Filter products by shop and search term
      const filtered = allProducts.filter((product: any) => {
        const matchesShop = product.shop_category === shop
        const matchesSearch = 
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.description.toLowerCase().includes(term.toLowerCase()) ||
          (product.brand && product.brand.toLowerCase().includes(term.toLowerCase()))
        
        return matchesShop && matchesSearch
      })

      setSearchResults(filtered.slice(0, 5)) // Show top 5 results
      
      // Update URL with search term
      if (pathname === "/products" || pathname === "/") {
        const params = new URLSearchParams(searchParams.toString())
        params.set('search', term)
        if (pathname === "/") {
          router.push(`/products?${params.toString()}`)
        } else {
          router.push(`/products?${params.toString()}`)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search result click
  const handleSearchResultClick = (productId: number) => {
    setShowSearchDropdown(false)
    setSearchTerm("")
    router.push(`/product/${productId}`)
  }

  // Handle "View all results"
  const handleViewAllResults = () => {
    setShowSearchDropdown(false)
    const params = new URLSearchParams()
    params.set('search', searchTerm)
    router.push(`/products?${params.toString()}`)
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container')
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch categories and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        // Fetch products to calculate counts
        const productsResponse = await fetch('/api/admin/products')
        const productsData = await productsResponse.json()
        
        // Filter categories by shop
        const shopFilteredCategories = shop
          ? categoriesData.filter((cat: Category) => !cat.shop || cat.shop === shop)
          : categoriesData
        
        // Filter products by shop
        const shopFilteredProducts = shop
          ? productsData.filter((product: any) => product.shop_category === shop)
          : productsData
        
        // Calculate product counts per category
        const productCounts = shopFilteredProducts.reduce((acc: any, product: any) => {
          const categoryId = product.category_id?.toString()
          if (categoryId) {
            acc[categoryId] = (acc[categoryId] || 0) + 1
          }
          return acc
        }, {})
        
        // Filter categories to only show those with at least 1 product
        const categoriesWithProducts = shopFilteredCategories.filter((category: Category) => {
          const categoryId = category.id?.toString()
          return productCounts[categoryId] && productCounts[categoryId] > 0
        })
        
        setCategories(categoriesWithProducts)
        setProducts(shopFilteredProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
        setCategories([
          { id: 1, name: "Beauty Products", slug: "beauty" },
          { id: 2, name: "Style Accessories", slug: "style" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shop])

  // Build navigation with filtered categories (only categories with products)
  const navigation = [
    ...baseNavigation,
    ...categories.map(category => ({
      name: category.name,
      href: `/products?category=${category.slug || category.id}`,
      categoryId: category.id,
      isCategory: true
    }))
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const updateBannerHeight = () => {
      const bannerContainer = document.querySelector("[data-banner-container]")
      if (bannerContainer) {
        const height = (bannerContainer as HTMLElement).offsetHeight
        document.documentElement.style.setProperty("--banner-height", `${height}px`)
      } else {
        document.documentElement.style.setProperty("--banner-height", "0px")
      }
    }
    updateBannerHeight()
    const observer = new MutationObserver(updateBannerHeight)
    const bannerContainer = document.querySelector("[data-banner-container]")
    if (bannerContainer) {
      observer.observe(bannerContainer, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }
    return () => observer.disconnect()
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const handleNavClick = async (item: (typeof navigation)[0], e: React.MouseEvent) => {
    if (item.name === "Logout") {
      e.preventDefault()
      await handleLogout()
      return
    }

    if (item.name === "All Products") {
      // Force navigation to /products without query parameters
      window.location.href = "/products"
      return
    }

    // Handle category clicks normally
    if ((item as any).isCategory) {
      return
    }

    if ((item as any).scroll && pathname === "/") {
      e.preventDefault()
      const targetId = item.href.split("#")[1]
      const element = document.getElementById(targetId)
      if (element) {
        const navbarHeight = 80
        const bannerHeight = Number.parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--banner-height") || "0",
        )
        const offset = navbarHeight + bannerHeight
        const elementPosition = element.offsetTop - offset
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })
      }
      setIsOpen(false)
    }
  }

  const handleShopToggle = (selectedShop: "A" | "B") => {
    setShop(selectedShop)
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const isActiveCategoryLink = (item: any) => {
    if (item.name === "All Products") {
      if (pathname === "/products") {
        const categoryParam = searchParams.get('category')
        return !categoryParam
      }
      return false
    }

    if (item.isCategory) {
      if (pathname === "/products") {
        const categoryParam = searchParams.get('category')
        const itemCategoryParam = item.href.split('category=')[1] || ''
        return categoryParam === itemCategoryParam
      }
      return false
    }

    return pathname === item.href
  }

  return (
    <>
      <div data-banner-container>
        <Banner page={currentPage} />
      </div>
      <nav
        className={`sticky top-0 z-40 shadow-lg transition-all duration-300 ${isScrolled ? "shadow-xl" : ""} ${shop === "A"
          ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500"
          : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"
          }`}
        style={{ top: "var(--banner-height, 0px)" }}
      >
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  {settings.restaurant_logo ? (
                    <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
                      <Image
                        src={settings.restaurant_logo || "/placeholder.svg"}
                        alt={settings.restaurant_name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-white">
                    {shop === "A" ? "SABS ONLINE - BEAUTY" : "SABS ONLINE - STYLE"}
                  </h1>
                </Link>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-2xl search-container">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    placeholder={shop === "A" ? "Search beauty products..." : "Search for style accessories..."}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-12 pr-16 h-12 rounded-full bg-white border-0 text-base shadow-lg"
                    onFocus={() => searchTerm.length >= 2 && setShowSearchDropdown(true)}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                    </div>
                  )}
                  
                  {/* Search Dropdown */}
                  {showSearchDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <>
                          {searchResults.map((product: any) => (
                            <div
                              key={product.id}
                              onClick={() => handleSearchResultClick(product.id)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <Image
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                <p className="text-gray-500 text-xs line-clamp-1">{product.description}</p>
                                <p className="text-orange-600 font-semibold text-sm">
                                  {selectedCurrency === 'AED' && product.price_aed 
                                    ? `D ${product.price_aed}`
                                    : selectedCurrency === 'INR' && product.price_inr
                                    ? `₹ ${product.price_inr}`
                                    : `$${product.price}`
                                  }
                                </p>
                              </div>
                            </div>
                          ))}
                          {searchResults.length >= 5 && (
                            <div
                              onClick={handleViewAllResults}
                              className="p-3 text-center text-orange-600 hover:bg-orange-50 cursor-pointer font-medium"
                            >
                              View all results for "{searchTerm}"
                            </div>
                          )}
                        </>
                      ) : searchTerm.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>No products found for "{searchTerm}"</p>
                          <p className="text-sm">Try different keywords</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-4">
                {/* Currency Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold">{selectedCurrency}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-2 border-0 shadow-xl">
                    <div className="bg-white rounded-lg">
                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('AED')}
                        className={`cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors ${selectedCurrency === 'AED' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
                        onClick={() => setSelectedCurrency('INR')}
                        className={`cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors ${selectedCurrency === 'INR' ? 'bg-green-50 text-green-700' : 'text-gray-700'
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

                <Link href="/orders">
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                    <ShoppingBag className="w-6 h-6" />
                  </Button>
                </Link>

                <Link href="/wishlist" className="relative group">
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                    <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link href="/order" className="relative group">
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                        {user?.isClerkUser ? (
                          clerkUser?.imageUrl ? (
                            <Image
                              src={clerkUser.imageUrl}
                              alt="Profile"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <User className="w-6 h-6" />
                          )
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 border-0 shadow-2xl">
                      <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 rounded-t-lg p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {user?.isClerkUser && clerkUser?.imageUrl ? (
                              <Image
                                src={clerkUser.imageUrl}
                                alt="Profile"
                                width={48}
                                height={48}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">{user?.name || "User"}</h3>
                            <p className="text-white/80 text-sm">{user?.email}</p>
                            {user?.isClerkUser && (
                              <p className="text-white/60 text-xs">Google Account</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-b-lg">
                        <div className="p-2">
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/dashboard" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-700">My Profile</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/orders" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-700">My Orders</span>
                            </Link>
                          </DropdownMenuItem>

                        </div>

                        <div className="border-t border-gray-100 p-2">
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer rounded-lg p-3 hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <LogOut className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="font-medium">Logout</span>
                            </div>
                          </DropdownMenuItem>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                        <User className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-0 border-0 shadow-2xl">
                      <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 rounded-t-lg p-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-3">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-white font-semibold text-lg">Welcome!</h3>
                          <p className="text-white/80 text-sm">Sign in to access your account</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-b-lg p-4">
                        <Button
                          onClick={handleLoginClick}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                          Sign In / Login
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-3">
                          New customer? Create an account to get started
                        </p>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Desktop Navigation with Icon Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {loading ? (
                  <div className="flex gap-6">
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-16"></div>
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-20"></div>
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-24"></div>
                  </div>
                ) : (
                  navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`rounded-full px-6 py-2 font-semibold transition-all duration-200 ${isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                        ? `bg-white ${shop === "A" ? "text-orange-600" : "text-purple-600"} shadow-lg`
                        : "text-white hover:bg-white/20"
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))
                )}
              </div>

              <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-1 border border-white/30 transition-all duration-300">
                <div
                  className="absolute top-1 bg-white rounded-full transition-all duration-300 ease-out shadow-lg"
                  style={{
                    width: "calc(50% - 4px)",
                    height: "calc(100% - 8px)",
                    left: shop === "A" ? "4px" : "calc(50% + 0px)",
                  }}
                />
                <div className="relative flex">
                  <button
                    onClick={() => handleShopToggle("A")}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 relative z-10 ${shop === "A" ? "text-orange-600" : "text-white hover:text-gray-200"
                      }`}
                    title="Beauty Products"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShopToggle("B")}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 relative z-10 ${shop === "B" ? "text-purple-600" : "text-white hover:text-gray-200"
                      }`}
                    title="Style Accessories"
                  >
                    <Watch className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet Header */}
        <div className="hidden md:block lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-white">
                {shop === "A" ? "SABS ONLINE - BEAUTY" : "SABS ONLINE - STYLE"}
              </h1>
              <div className="flex items-center gap-3">
                {/* Currency Dropdown for Tablet */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-semibold">{selectedCurrency}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 p-1 border-0 shadow-xl">
                    <div className="bg-white rounded-lg">
                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('AED')}
                        className={`cursor-pointer rounded-lg p-2 hover:bg-gray-50 transition-colors ${selectedCurrency === 'AED' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-bold text-sm">AED</span>
                          <span className="text-sm">UAE Dirham</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('INR')}
                        className={`cursor-pointer rounded-lg p-2 hover:bg-gray-50 transition-colors ${selectedCurrency === 'INR' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold text-sm">₹</span>
                          <span className="text-sm">Indian Rupee</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                  <Bell className="w-5 h-5" />
                </Button>

                <Link href="/wishlist" className="relative">
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                    <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Cart and Profile icons - visible on tablet */}
                <Link href="/order" className="relative">
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                        {user?.isClerkUser && clerkUser?.imageUrl ? (
                          <Image
                            src={clerkUser.imageUrl}
                            alt="Profile"
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-0 border-0 shadow-2xl">
                      <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 rounded-t-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {user?.isClerkUser && clerkUser?.imageUrl ? (
                              <Image
                                src={clerkUser.imageUrl}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold">{user?.name || "User"}</h3>
                            <p className="text-white/80 text-sm">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-b-lg p-2 space-y-1">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <User className="w-4 h-4 text-orange-600" />
                            <span className="text-gray-700">Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={handleLoginClick}
                    variant="ghost"
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="relative mb-3 search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder={shop === "A" ? "Search beauty products" : "Search style accessories"}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-12 h-10 rounded-full bg-white border-0 text-sm shadow-lg"
                onFocus={() => searchTerm.length >= 2 && setShowSearchDropdown(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                </div>
              )}
              
              {/* Search Dropdown for Tablet */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.map((product: any) => (
                        <div
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={35}
                            height={35}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                            <p className="text-orange-600 font-semibold text-xs">
                              {selectedCurrency === 'AED' && product.price_aed 
                                ? `D ${product.price_aed}`
                                : selectedCurrency === 'INR' && product.price_inr
                                ? `₹ ${product.price_inr}`
                                : `$${product.price}`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                      {searchResults.length >= 5 && (
                        <div
                          onClick={handleViewAllResults}
                          className="p-3 text-center text-orange-600 hover:bg-orange-50 cursor-pointer font-medium text-sm"
                        >
                          View all results
                        </div>
                      )}
                    </>
                  ) : searchTerm.length >= 2 ? (
                    <div className="p-3 text-center text-gray-500">
                      <p className="text-sm">No products found</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {loading ? (
                <div className="flex gap-2">
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-12"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-16"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-20"></div>
                </div>
              ) : (
                navigation.slice(0, 6).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                      ? `bg-white ${shop === "A" ? "text-orange-600" : "text-purple-600"}`
                      : "text-white hover:bg-white/20"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="text-white p-0">
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
              <h1 className="text-lg font-bold text-white">{shop === "A" ? "BEAUTY" : "STYLE"}</h1>
              <div className="flex items-center gap-2">
                {/* Currency for Mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20 p-1">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-bold">{selectedCurrency}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 p-1 border-0 shadow-xl">
                    <DropdownMenuItem
                      onClick={() => setSelectedCurrency('AED')}
                      className={`cursor-pointer rounded p-2 text-sm ${selectedCurrency === 'AED' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                    >
                      AED
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedCurrency('INR')}
                      className={`cursor-pointer rounded p-2 text-sm ${selectedCurrency === 'INR' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                    >
                      INR ₹
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/wishlist" className="relative">
                  <Heart className={`w-5 h-5 text-white ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart and Profile icons are hidden on mobile - removed from here */}
              </div>
            </div>

            <div className="relative mb-3 search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={shop === "A" ? "Search beauty" : "Search style"}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-10 h-9 rounded-full bg-white border-0 text-sm"
                onFocus={() => searchTerm.length >= 2 && setShowSearchDropdown(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                </div>
              )}
              
              {/* Search Dropdown for Mobile */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.map((product: any) => (
                        <div
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            width={30}
                            height={30}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-xs line-clamp-1">{product.name}</p>
                            <p className="text-orange-600 font-semibold text-xs">
                              {selectedCurrency === 'AED' && product.price_aed 
                                ? `د.إ ${product.price_aed}`
                                : selectedCurrency === 'INR' && product.price_inr
                                ? `₹ ${product.price_inr}`
                                : `$${product.price}`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : searchTerm.length >= 2 ? (
                    <div className="p-3 text-center text-gray-500">
                      <p className="text-xs">No products found</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {loading ? (
                <div className="flex gap-2">
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-12"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-16"></div>
                </div>
              ) : (
                navigation.slice(0, 6).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                      ? `bg-white ${shop === "A" ? "text-orange-600" : "text-purple-600"}`
                      : "text-gray-700"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>

            {/* Mobile Navigation Menu */}
            {isOpen && (
              <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                {loading ? (
                  <div className="space-y-2">
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-3/4"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-1/2"></div>
                  </div>
                ) : (
                  navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                        ? `${shop === "A" ? "text-orange-600 bg-orange-50" : "text-purple-600 bg-purple-50"}`
                        : `text-gray-700`
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))
                )}

              </div>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  )
}