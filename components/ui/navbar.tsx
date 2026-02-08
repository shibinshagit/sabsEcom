"use client"

import type React from "react"
import { Suspense } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Search, ShoppingCart, Heart, Menu, X, User, LogOut, Settings, Package, Users, BarChart3, Calendar, MessageSquare, Star, ChevronDown, Globe, Zap, Crown, Gift, ShoppingBag, Sparkles, Watch, Bell } from "lucide-react"
import EnhancedSearch from "@/components/ui/enhanced-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSelector } from "react-redux"
import { useSettings } from "@/lib/contexts/settings-context"
import { useLoginModal } from '@/lib/stores/useLoginModal'
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
  shop?: "A" | "B" | "Both"
  is_special?: boolean
}

function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { isOpen: isLoginModalOpen, openModal, closeModal } = useLoginModal()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { settings } = useSettings()
  const { user, logout, isAuthenticated } = useAuth()
  const { shop, setShop, isLoading: shopLoading, isShopSwitchEnabled } = useShop()
  const { user: clerkUser } = useUser()
  const { selectedCurrency, setSelectedCurrency, getCurrencySymbol } = useCurrency()
  const searchParams = useSearchParams()
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
  const wishlistCount = wishlistItems.length

  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home"

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    
    // Clear previous debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    
    if (term.trim().length === 0) {
      setShowSearchDropdown(false)
      setSearchResults([])
      setSearchSuggestions([])
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

    // Debounce search requests
    const timer = setTimeout(async () => {
      try {
        const searchUrl = new URL('/api/products/search', window.location.origin)
        searchUrl.searchParams.set('q', term.trim())
        searchUrl.searchParams.set('shop', shop)
        searchUrl.searchParams.set('currency', selectedCurrency)
        searchUrl.searchParams.set('limit', '8') // Show 8 results in dropdown

        const response = await fetch(searchUrl.toString())
        const searchData = await response.json()
        
        setSearchResults(searchData.items || [])
        setSearchSuggestions(searchData.suggestions || [])
        
        // Update URL for products page
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
        setSearchResults([])
        setSearchSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    setSearchDebounceTimer(timer)
  }

  const handleSearchResultClick = (productId: number) => {
    setShowSearchDropdown(false)
    setSearchTerm("")
    router.push(`/product/${productId}`)
  }

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        const productsResponse = await fetch('/api/admin/products')
        const productsData = await productsResponse.json()
        
      const shopFilteredCategories = shop
  ? categoriesData.filter((cat: Category) => 
      !cat.shop || cat.shop === shop || cat.shop === "Both"
    )
  : categoriesData
        
       const shopFilteredProducts = shop
  ? productsData.filter((product: any) => 
      product.shop_category === shop || product.shop_category === "Both"
    )
  : productsData
        
        const productCounts = shopFilteredProducts.reduce((acc: any, product: any) => {
          const categoryId = product.category_id?.toString()
          if (categoryId) {
            acc[categoryId] = (acc[categoryId] || 0) + 1
          }
          return acc
        }, {})
        
        const categoriesWithProducts = shopFilteredCategories.filter((category: Category) => {
          const categoryId = category.id?.toString()
          return productCounts[categoryId] && productCounts[categoryId] > 0
        })
        
        setCategories(categoriesWithProducts)
        setProducts(shopFilteredProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
        setCategories([
          { id: 1, name: "Spare Parts", slug: "parts" },
          { id: 2, name: "Accessories", slug: "accessories" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shop])

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

  const startAutoScroll = () => {
    if (categories.length <= 5) return
    
    const navContainer = document.querySelector('.categories-scroll-container')
    if (!navContainer) return
    
    // Start from the beginning
    navContainer.scrollLeft = 0
    
    setIsAutoScrolling(true)
    const interval = setInterval(() => {
      const maxScroll = navContainer.scrollWidth - navContainer.clientWidth
      const currentScroll = navContainer.scrollLeft
      
      if (currentScroll >= maxScroll - 10) { // Small buffer to ensure we reach the end
        // Smooth scroll back to beginning
        navContainer.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        // Scroll by one category width approximately
        const categoryWidth = 120 // Approximate width of each category button
        navContainer.scrollTo({ 
          left: currentScroll + categoryWidth, 
          behavior: 'smooth' 
        })
      }
    }, 2500) // Scroll every 2.5 seconds
    
    setAutoScrollInterval(interval)
  }

  // Start auto-scroll when categories load and are more than 5
  useEffect(() => {
    if (categories.length > 5 && !loading && !isAutoScrolling) {
      setTimeout(() => startAutoScroll(), 2000) // Start after 2 seconds
    }
  }, [categories.length, loading])

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval)
      }
    }
  }, [autoScrollInterval])

  const handleNavClick = async (item: (typeof navigation)[0], e: React.MouseEvent) => {
    if (item.name === "Logout") {
      e.preventDefault()
      await handleLogout()
      return
    }

    if (item.name === "All Products") {
      window.location.href = "/products"
      return
    }

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
    openModal()
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
        className={`sticky top-0 z-40 border-b border-border bg-background bg-white text-foreground transition-all duration-300 ${isScrolled ? "shadow-md" : ""}`}
        style={{ top: "var(--banner-height, 0px)" }}
      >
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-10">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  {settings.restaurant_logo ? (
                    <div className="relative w-11 h-11 transition-transform duration-300 group-hover:scale-110">
                      <Image
                        src={settings.restaurant_logo || "/placeholder.svg"}
                        alt={settings.restaurant_name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-11 h-11 bg-foreground flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                      <ShoppingBag className="w-5 h-5 text-background" />
                    </div>
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="text-2xl font-bold text-foreground">{settings.restaurant_name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spare Parts & Accessories</span>
                  </div>
                </Link>

                {/* Enhanced Search Bar */}
                <EnhancedSearch 
                  className="flex-1 max-w-2xl"
                  placeholder="Search parts and accessories..."
                />
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-4">
                {/* Currency Dropdown (disabled for India-only for now)
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:bg-muted p-3 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold">{selectedCurrency}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-2 border border-border shadow-sm">
                    <div className="bg-background">
                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('AED')}
                        className={`cursor-pointer p-3 hover:bg-muted transition-colors ${selectedCurrency === 'AED' ? 'bg-muted text-foreground' : 'text-foreground'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted flex items-center justify-center">
                              <span className="text-foreground font-bold text-sm">AED</span>
                            </div>
                            <div>
                              <span className="font-medium">UAE Dirham</span>
                              <p className="text-xs text-muted-foreground">AED</p>
                            </div>
                          </div>
                          {selectedCurrency === 'AED' && (
                            <div className="w-2 h-2 bg-foreground"></div>
                          )}
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('INR')}
                        className={`cursor-pointer p-3 hover:bg-muted transition-colors ${selectedCurrency === 'INR' ? 'bg-muted text-foreground' : 'text-foreground'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted flex items-center justify-center">
                              <span className="text-foreground font-bold text-sm">₹</span>
                            </div>
                            <div>
                              <span className="font-medium">Indian Rupee</span>
                              <p className="text-xs text-muted-foreground">INR</p>
                            </div>
                          </div>
                          {selectedCurrency === 'INR' && (
                            <div className="w-2 h-2 bg-foreground"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                */}

                <Link href="/orders">
                  <Button variant="ghost" className="text-foreground hover:bg-muted p-3">
                    <ShoppingBag className="w-6 h-6" />
                  </Button>
                </Link>

                <Link href="/wishlist" className="relative group">
                  <Button variant="ghost" className="text-foreground hover:bg-muted p-3">
                    <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link href="/order" className="relative group">
                  <Button variant="ghost" className="text-foreground hover:bg-muted p-3">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-foreground hover:bg-muted p-3">
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
                    <DropdownMenuContent align="end" className="w-80 p-0 border border-border shadow-sm">
                      <div className="bg-foreground text-background p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {user?.isClerkUser && clerkUser?.imageUrl ? (
                              <Image
                                src={clerkUser.imageUrl}
                                alt="Profile"
                                width={48}
                                height={48}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-6 h-6 text-background" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-background font-semibold text-lg">{user?.name || "User"}</h3>
                            <p className="text-background/80 text-sm">{user?.email}</p>
                            {user?.isClerkUser && (
                              <p className="text-background/60 text-xs">Google Account</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-background">
                        <div className="p-2">
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/dashboard" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-foreground" />
                              </div>
                              <span className="font-medium text-gray-700">My Profile</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/orders" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-foreground" />
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
                              <div className="w-8 h-8 bg-muted flex items-center justify-center">
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
                      <Button variant="ghost" className="text-foreground hover:bg-muted p-3">
                        <User className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-0 border border-border shadow-sm">
                      <div className="bg-foreground text-background p-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-3">
                            <User className="w-6 h-6 text-background" />
                          </div>
                          <h3 className="text-background font-semibold text-lg">Welcome!</h3>
                          <p className="text-background/80 text-sm">Sign in to access your account</p>
                        </div>
                      </div>

                      <div className="bg-background p-4">
                        <Button
                          onClick={handleLoginClick}
                          className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium py-3 transition-colors"
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {loading ? (
                  <div className="flex gap-4">
                    <div className="animate-pulse bg-muted px-6 py-2 h-10 w-16 flex-shrink-0"></div>
                    <div className="animate-pulse bg-muted px-6 py-2 h-10 w-20 flex-shrink-0"></div>
                    <div className="animate-pulse bg-muted px-6 py-2 h-10 w-24 flex-shrink-0"></div>
                  </div>
                ) : (
                  <>
                    {/* All Products - Always visible and constant with hover dropdown */}
                    <div className="relative group">
                      <Link
                        key="all-products"
                        href="/products"
                        onClick={(e) => handleNavClick(baseNavigation[0], e)}
                        className={`hidden lg:flex items-center rounded-full px-6 py-2 font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          pathname === '/products' && !searchParams.get('category')
                            ? "bg-muted text-foreground shadow-sm"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        All Products
                        <span className="ml-1 text-xs opacity-70">▼</span>
                      </Link>
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                            Categories
                          </div>
                          {categories.length > 0 ? (
                            <div className="space-y-1 max-h-80 overflow-y-auto">
                              {categories.map((category) => (
                                <Link
                                  key={category.id}
                                  href={`/products?category=${category.slug || category.id}`}
                                  className={`block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors ${
                                    category.is_special 
                                      ? "border-l-2 border-border hover:bg-muted" 
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    const item = {
                                      name: category.name,
                                      href: `/products?category=${category.slug || category.id}`,
                                      categoryId: category.id,
                                      isCategory: true
                                    }
                                    handleNavClick(item, e)
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{category.name}</span>
                                    {category.is_special && (
                                      <span className="text-xs text-foreground">✨</span>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">
                              No categories available
                            </div>
                          )}
                          <div className="border-t border-gray-100 mt-3 pt-3">
                            <Link
                              href="/products"
                              className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                              onClick={(e) => handleNavClick(baseNavigation[0], e)}
                            >
                              View All Products
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrolling Categories Container */}
                    <div 
                      className={`hidden lg:flex items-center space-x-2 categories-scroll-container ${
                        categories.length > 5 
                          ? 'overflow-x-auto scrollbar-hide' 
                          : ''
                      }`}
                      style={{
                        maxWidth: categories.length > 5 
                          ? (isShopSwitchEnabled ? '900px' : '1100px') // Expand when shop switcher is hidden
                          : 'auto',
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onMouseEnter={() => {
                        if (categories.length > 5 && autoScrollInterval) {
                          clearInterval(autoScrollInterval)
                          setIsAutoScrolling(false)
                        }
                      }}
                      onMouseLeave={() => {
                        if (categories.length > 5) {
                          setTimeout(() => startAutoScroll(), 1000) // Delay restart
                        }
                      }}
                    >
                      {/* Category links only */}
                      {categories.map(category => {
                        const item = {
                          name: category.name,
                          href: `/products?category=${category.slug || category.id}`,
                          categoryId: category.id,
                          isCategory: true
                        }
                        return (
                          <Link
                            key={category.id}
                            href={item.href}
                            onClick={(e) => handleNavClick(item, e)}
                            className={`rounded-full px-6 py-2 font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                              isActiveCategoryLink(item)
                                ? "bg-muted text-foreground shadow-sm"
                                : "text-foreground hover:bg-muted"
                            } ${
                              category.is_special 
                                ? "border-2 border-border shadow-sm" 
                                : ""
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {category.name}
                              {category.is_special && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full font-bold bg-background text-foreground">
                                  ✨
                                </span>
                              )}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Shop switcher (disabled for single shop for now)
              {isShopSwitchEnabled && (
                <div className="ml-4 flex items-center border border-border bg-background shadow-sm">
                  <button
                    onClick={() => handleShopToggle("A")}
                    className={`px-4 py-2 text-xs font-semibold ${
                      shop === "A" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                    title="Spare Parts"
                  >
                    Shop A
                  </button>
                  <button
                    onClick={() => handleShopToggle("B")}
                    className={`px-4 py-2 text-xs font-semibold ${
                      shop === "B" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                    title="Accessories"
                  >
                    Shop B
                  </button>
                </div>
              )}
              */}
            </div>
          </div>
        </div>

        {/* Tablet Header */}
        <div className="hidden md:block lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold text-foreground">{settings.restaurant_name}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Spare Parts & Accessories</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Currency Dropdown for Tablet (disabled for India-only for now)
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:bg-muted p-2 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-semibold">{selectedCurrency}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 p-1 border border-border shadow-sm">
                    <div className="bg-background">
                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('AED')}
                        className={`cursor-pointer p-2 hover:bg-muted transition-colors ${selectedCurrency === 'AED' ? 'bg-muted text-foreground' : 'text-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-bold text-sm">AED</span>
                          <span className="text-sm">UAE Dirham</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setSelectedCurrency('INR')}
                        className={`cursor-pointer p-2 hover:bg-muted transition-colors ${selectedCurrency === 'INR' ? 'bg-muted text-foreground' : 'text-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-bold text-sm">₹</span>
                          <span className="text-sm">Indian Rupee</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                */}

                <Button variant="ghost" className="text-foreground hover:bg-muted p-2">
                  <Bell className="w-5 h-5" />
                </Button>

                <Link href="/wishlist" className="relative">
                  <Button variant="ghost" className="text-foreground hover:bg-muted p-2">
                    <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Cart and Profile icons - visible on tablet */}
                <Link href="/order" className="relative">
                  <Button variant="ghost" className="text-foreground hover:bg-muted p-2">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-foreground hover:bg-muted p-2">
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
                    <DropdownMenuContent align="end" className="w-64 p-0 border border-border shadow-sm">
                      <div className="bg-foreground text-background p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {user?.isClerkUser && clerkUser?.imageUrl ? (
                              <Image
                                src={clerkUser.imageUrl}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-5 h-5 text-background" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-background font-semibold">{user?.name || "User"}</h3>
                            <p className="text-background/80 text-sm">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-background p-2 space-y-1">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex items-center gap-3 p-2 hover:bg-muted">
                            <User className="w-4 h-4 text-foreground" />
                            <span className="text-foreground">Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-muted text-foreground cursor-pointer">
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
                    className="text-foreground hover:bg-muted p-2"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="relative mb-3 search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search parts and accessories"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-12 h-10 bg-background border border-border text-sm"
                onFocus={() => searchTerm.length >= 2 && setShowSearchDropdown(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                </div>
              )}
              
              {/* Search Dropdown for Tablet */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background shadow-sm border border-border z-50 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="px-3 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
                        {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
                      </div>
                      {searchResults.map((product: any) => (
                        <div
                          key={product.id}
                          onClick={() => handleSearchResultClick(product.id)}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        >
                          <Image
                            src={product.image_urls?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            width={35}
                            height={35}
                            className="object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm line-clamp-1">{product.name}</p>
                            {product.display_price ? (
                              <p className="text-foreground font-semibold text-xs">
                                {product.display_price.symbol} {product.display_price.price}
                              </p>
                            ) : (
                              <p className="text-muted-foreground text-xs">Price unavailable</p>
                            )}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={handleViewAllResults}
                        className="p-3 text-center text-foreground hover:bg-muted cursor-pointer font-medium text-sm border-t"
                      >
                        View all results
                      </div>
                    </>
                  ) : searchTerm.length >= 2 ? (
                    <div className="p-3 text-center text-muted-foreground">
                      <p className="text-sm">No products found</p>
                      {searchSuggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSearchTerm(suggestion)
                                handleSearch(suggestion)
                              }}
                              className="px-2 py-1 bg-muted hover:bg-muted/80 text-xs"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Category tabs removed from tablet header */}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="text-foreground p-0">
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
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
                    <div className="w-10 h-10 bg-foreground flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                      <ShoppingBag className="w-5 h-5 text-background" />
                    </div>
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="text-2xl font-bold text-foreground">{settings.restaurant_name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Spare Parts & Accessories</span>
                  </div>
                </Link>
             
              <div className="flex items-center gap-2">
                {/* Currency for Mobile (disabled for India-only for now)
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:bg-muted p-1">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-bold">{selectedCurrency}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 p-1 border border-border shadow-sm">
                    <DropdownMenuItem
                      onClick={() => setSelectedCurrency('AED')}
                      className={`cursor-pointer p-2 text-sm ${selectedCurrency === 'AED' ? 'bg-muted text-foreground' : 'text-foreground'
                        }`}
                    >
                      AED
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedCurrency('INR')}
                      className={`cursor-pointer p-2 text-sm ${selectedCurrency === 'INR' ? 'bg-muted text-foreground' : 'text-foreground'
                        }`}
                    >
                      INR ₹
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                */}

                <Link href="/wishlist" className="relative">
                  <Heart className={`w-5 h-5 text-foreground ${wishlistCount > 0 ? 'fill-current' : ''}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link href="/order" className="relative">
                  <ShoppingCart className="w-5 h-5 text-foreground" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Button
                  onClick={handleLoginClick}
                  variant="ghost"
                  className="text-foreground hover:bg-muted p-1"
                >
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <EnhancedSearch
                placeholder="Search parts and accessories..."
                onSearchSubmit={(query) => {
                  router.push(`/products?search=${encodeURIComponent(query)}`)
                  setIsOpen(false)
                }}
                className="w-full"
              />
            </div>

            {/* Category tabs removed from mobile header */}

            {/* Mobile Navigation Menu */}
            {isOpen && (
              <div className="mt-4 bg-background shadow-sm max-h-[40vh] overflow-hidden border border-border">
                {loading ? (
                  <div className="space-y-2 p-4">
                    <div className="animate-pulse bg-muted h-10 w-full"></div>
                    <div className="animate-pulse bg-muted h-10 w-3/4"></div>
                    <div className="animate-pulse bg-muted h-10 w-1/2"></div>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[40vh]">
                    <div className="p-4 space-y-2">
                      {/* All Products - Featured */}
                      <Link
                        href="/products"
                        onClick={(e) => {
                          handleNavClick(baseNavigation[0], e)
                          setIsOpen(false)
                        }}
                        className={`block px-4 py-3 text-base font-semibold transition-colors rounded-lg border-2 ${
                          pathname === '/products' && !searchParams.get('category')
                            ? "text-foreground bg-background border-border"
                            : "text-gray-700 hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        All Products
                       </Link>

                       {/* Categories Section */}
                       {categories.length > 0 && (
                         <>
                           <div className="px-3 py-2 mt-6 text-xs font-medium text-gray-500 uppercase tracking-wider border-t border-gray-200 pt-4">
                             Categories
                           </div>
                          <div className="space-y-1 pb-4">
                            {categories.map((category) => {
                              const item = {
                                name: category.name,
                                href: `/products?category=${category.slug || category.id}`,
                                categoryId: category.id,
                                isCategory: true
                              }
                              return (
                                <Link
                                  key={category.id}
                                  href={item.href}
                                  onClick={(e) => {
                                    handleNavClick(item, e)
                                    setIsOpen(false)
                                  }}
                                  className={`block px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg relative overflow-hidden ${
                                    isActiveCategoryLink(item)
                                      ? "text-foreground bg-background"
                                      : "text-gray-600 hover:bg-gray-50"
                                  } ${
                                    category.is_special 
                                      ? "border-l-4 border-border bg-muted shadow-sm" 
                                      : ""
                                  }`}
                                >
                                  {category.is_special && (
                                    <div className="absolute inset-0 bg-black/5 animate-pulse"></div>
                                  )}
                                  <div className="flex items-center justify-between relative z-10">
                                    <span className={category.is_special ? "font-semibold" : ""}>{category.name}</span>
                                    {category.is_special && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse bg-foreground text-background">
                                        ✨ Special
                                      </span>
                                    )}
                                  </div>
                                  {category.is_special && (
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-foreground animate-pulse"></div>
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={isLoginModalOpen} onClose={closeModal} />
    </>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<div>Loading navbar...</div>}>
      <Nav />
    </Suspense>
  )
}