"use client"

import type React from "react"
import { Suspense } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Search, ShoppingCart, Heart, Menu, X, User, LogOut, Settings, Package, Users, BarChart3, Calendar, MessageSquare, Star, ChevronDown, Globe, Zap, Crown, Gift, ShoppingBag, Sparkles, Watch, Bell, Check } from "lucide-react"
import SearchPopup from "@/components/ui/search-popup"
import { Button } from "@/components/ui/button"
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
import { NavbarSkeleton } from "@/components/ui/navbar-skeleton"

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

function CurrencyMenu({
  selectedCurrency,
  setSelectedCurrency,
}: {
  selectedCurrency: string
  setSelectedCurrency: (c: "AED" | "INR") => void
}) {
  const options = [
    { code: "AED" as const, label: "UAE Dirham", symbol: "AED" },
    { code: "INR" as const, label: "Indian Rupee", symbol: "₹" },
  ]

  return (
    <DropdownMenuContent
      align="end"
      className="w-56 p-2 rounded-2xl border-0 bg-[#faf7f3] shadow-[0_16px_40px_-18px_rgba(44,36,28,0.45)] ring-1 ring-[#8a7258]/20"
    >
      <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7258]">
        Currency
      </p>
      {options.map((opt) => {
        const active = selectedCurrency === opt.code
        return (
          <DropdownMenuItem
            key={opt.code}
            onClick={() => setSelectedCurrency(opt.code)}
            className={`cursor-pointer rounded-xl px-2.5 py-2.5 focus:bg-[#8a7258]/10 ${
              active ? "bg-[#8a7258]/12" : ""
            }`}
          >
            <div className="flex w-full items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  active
                    ? "bg-[#8a7258] text-white"
                    : "bg-[#ebe4db] text-[#6b5a48]"
                }`}
              >
                {opt.symbol}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold leading-tight ${active ? "text-[#2c241c]" : "text-[#5c4f42]"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-[#8a7258]/80">{opt.code}</p>
              </div>
              {active && <Check className="h-4 w-4 shrink-0 text-[#8a7258]" strokeWidth={2.5} />}
            </div>
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuContent>
  )
}

function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
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
          { id: 1, name: "Beauty Products", slug: "beauty" },
          { id: 2, name: "Style Accessories", slug: "style" }
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
        className={`sticky top-0 z-40 shadow-lg transition-all duration-300 ${isScrolled ? "shadow-xl" : ""} ${
          shop === "A"
            ? "bg-[#8a7258] bg-cover bg-center"
            : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"
        }`}
        style={
          shop === "A"
            ? {
                top: 0,
                backgroundImage: "url('/images/header/nav-bg.png')",
                backgroundColor: "#8a7258",
              }
            : { top: 0 }
        }
      >
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4 mb-2">
                <Link href="/" className="flex items-center group shrink-0" aria-label={settings.restaurant_name}>
                  {settings.restaurant_logo ? (
                    <div
                      className={`relative w-44 h-14 transition-transform duration-300 group-hover:scale-105 ${
                        shop === "A" ? "bg-black/90 rounded-xl" : ""
                      }`}
                    >
                      <Image
                        src={settings.restaurant_logo || "/placeholder.svg"}
                        alt=""
                        fill
                        className={`object-contain object-center ${shop === "A" ? "p-1" : ""}`}
                        sizes="176px"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
                      <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                  )}
                </Link>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSearchOpen(true)}
                    className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0"
                    aria-label="Search products"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 px-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-semibold text-sm">{selectedCurrency}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <CurrencyMenu
                      selectedCurrency={selectedCurrency}
                      setSelectedCurrency={setSelectedCurrency}
                    />
                  </DropdownMenu>

                  <Link href="/orders">
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0">
                      <ShoppingBag className="w-5 h-5" />
                    </Button>
                  </Link>

                  <Link href="/wishlist" className="relative group">
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0">
                      <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                      {wishlistCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  <Link href="/order" className="relative group">
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0">
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0">
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
                              <User className="w-5 h-5" />
                            )
                          ) : (
                            <User className="w-5 h-5" />
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
                        <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl h-10 w-10 p-0">
                          <User className="w-5 h-5" />
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {loading ? (
                  <div className="flex gap-4">
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-16 flex-shrink-0"></div>
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-20 flex-shrink-0"></div>
                    <div className="animate-pulse bg-white/20 rounded-full px-6 py-2 h-10 w-24 flex-shrink-0"></div>
                  </div>
                ) : (
                  <>
                    {/* All Products - Always visible and constant with hover dropdown */}
                    <div className="relative group">
                      <Link
                        key="all-products"
                        href="/products"
                        onClick={(e) => handleNavClick(baseNavigation[0], e)}
                        className={`hidden lg:flex items-center px-3 py-2 text-sm font-medium tracking-wide transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                          pathname === '/products' && !searchParams.get('category')
                            ? "text-white border-white"
                            : "text-white/90 border-transparent hover:text-white hover:border-white/50"
                        }`}
                      >
                        All Products
                        <span className="ml-1.5 text-[10px] opacity-70">▼</span>
                      </Link>
                      <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-neutral-200 shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        <div className="p-2">
                          <div className="px-2.5 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.12em]">
                            {shop === "A" ? "Beauty Categories" : shop === "B" ? "Style Categories" : "Categories"}
                          </div>
                          {categories.length > 0 ? (
                            <div className="space-y-0.5 max-h-80 overflow-y-auto">
                              {categories.map((category) => (
                                <Link
                                  key={category.id}
                                  href={`/products?category=${category.slug || category.id}`}
                                  className="flex items-center justify-between px-2.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
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
                                  <span>{category.name}</span>
                                  {category.is_special && (
                                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                                      Featured
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                              No categories available
                            </div>
                          )}
                          <div className="border-t border-neutral-100 mt-2 pt-2">
                            <Link
                              href="/products"
                              className="block px-2.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
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
                            className={`px-3 py-2 text-sm font-medium tracking-wide transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                              isActiveCategoryLink(item)
                                ? "text-white border-white"
                                : "text-white/90 border-transparent hover:text-white hover:border-white/50"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {category.name}
                              {category.is_special && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
                                  New
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

              {/* Show entire shop switcher only if enabled in admin settings */}
              {!shopLoading && isShopSwitchEnabled && (
                <div className="relative bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-orange-900/30 backdrop-blur-md rounded-full p-1.5 border border-white/20 transition-all duration-500 flex-shrink-0 ml-4 shadow-2xl hover:shadow-purple-500/25">
                  {/* Animated Background Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-xl animate-pulse"></div>
                  
                  {/* Active Slider with Enhanced Glow */}
                  <div
                    className={`absolute top-1.5 rounded-full transition-all duration-500 ease-out shadow-2xl ${
                      shop === "A" 
                        ? "bg-gradient-to-r from-orange-400 to-pink-500 shadow-orange-500/50" 
                        : "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/50"
                    }`}
                    style={{
                      width: "calc(50% - 6px)",
                      height: "calc(100% - 12px)",
                      left: shop === "A" ? "6px" : "calc(50% + 0px)",
                      boxShadow: shop === "A" 
                        ? "0 0 20px rgba(251, 146, 60, 0.6), 0 0 40px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)" 
                        : "0 0 20px rgba(147, 51, 234, 0.6), 0 0 40px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                    }}
                  />
                  
                  {/* Shop switcher buttons */}
                  <div className="relative flex">
                    <button
                      onClick={() => handleShopToggle("A")}
                      className={`group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 relative z-10 transform hover:scale-110 ${
                        shop === "A" 
                          ? "text-white drop-shadow-lg" 
                          : "text-white/70 hover:text-white hover:drop-shadow-lg"
                      }`}
                      title="Beauty Products"
                    >
                      <Sparkles className={`w-6 h-6 transition-all duration-300 ${
                        shop === "A" 
                          ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" 
                          : "group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                      }`} />
                      {shop === "A" && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-pink-500/20 animate-ping"></div>
                      )}
                    </button>
                    <button
                      onClick={() => handleShopToggle("B")}
                      className={`group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 relative z-10 transform hover:scale-110 ${
                        shop === "B" 
                          ? "text-white drop-shadow-lg" 
                          : "text-white/70 hover:text-white hover:drop-shadow-lg"
                      }`}
                      title="Style Accessories"
                    >
                      <Watch className={`w-6 h-6 transition-all duration-300 ${
                        shop === "B" 
                          ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" 
                          : "group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                      }`} />
                      {shop === "B" && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-600/20 animate-ping"></div>
                      )}
                    </button>
                  </div>
                  
                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                    <div className={`absolute w-1 h-1 bg-white rounded-full animate-bounce ${shop === "A" ? "left-4 top-2" : "right-4 top-2"}`} style={{animationDelay: "0s"}}></div>
                    <div className={`absolute w-1 h-1 bg-white/60 rounded-full animate-bounce ${shop === "A" ? "left-6 bottom-3" : "right-6 bottom-3"}`} style={{animationDelay: "0.5s"}}></div>
                    <div className={`absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-bounce ${shop === "A" ? "left-8 top-4" : "right-8 top-4"}`} style={{animationDelay: "1s"}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tablet Header */}
        <div className="hidden md:block lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <Link href="/" className="flex items-center group shrink-0" aria-label={settings.restaurant_name}>
                {settings.restaurant_logo ? (
                  <div
                    className={`relative w-40 h-14 transition-transform duration-300 group-hover:scale-110 ${
                      shop === "A" ? "bg-black/90 rounded-xl" : ""
                    }`}
                  >
                    <Image
                      src={settings.restaurant_logo || "/placeholder.svg"}
                      alt=""
                      fill
                      className={`object-contain object-center ${shop === "A" ? "p-1" : ""}`}
                      sizes="160px"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                )}
              </Link>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSearchOpen(true)}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </Button>
                {/* Currency Dropdown for Tablet */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-semibold">{selectedCurrency}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <CurrencyMenu
                    selectedCurrency={selectedCurrency}
                    setSelectedCurrency={setSelectedCurrency}
                  />
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

            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {loading ? (
                <div className="flex gap-2">
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-12"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-16"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-20"></div>
                </div>
              ) : (
                navigation.slice(0, 6).map((item) => {
                  const isSpecial = (item as any).isCategory && categories.find(cat => cat.id === (item as any).categoryId)?.is_special;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`px-2.5 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap border-b-2 ${
                        isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                          ? "text-white border-white"
                          : "text-white/90 border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {item.name}
                        {isSpecial && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70">New</span>
                        )}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="block md:hidden">
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 items-center gap-2 mb-2">
              <div className="flex justify-start min-w-0">
                <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="text-white p-0 shrink-0">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
              <div className="flex justify-center min-w-0">
                <Link href="/" className="flex items-center justify-center group" aria-label={settings.restaurant_name}>
                  {settings.restaurant_logo ? (
                    <div
                      className={`relative w-32 h-12 transition-transform duration-300 group-hover:scale-110 ${
                        shop === "A" ? "bg-black/90 rounded-xl" : ""
                      }`}
                    >
                      <Image
                        src={settings.restaurant_logo || "/placeholder.svg"}
                        alt=""
                        fill
                        className={`object-contain object-center ${shop === "A" ? "p-1" : ""}`}
                        sizes="128px"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-11 bg-white/20 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                  )}
                </Link>
              </div>
              <div className="flex items-center justify-end gap-2 min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSearchOpen(true)}
                  className="text-white hover:bg-white/20 p-1"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                </Button>
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
                  <CurrencyMenu
                    selectedCurrency={selectedCurrency}
                    setSelectedCurrency={setSelectedCurrency}
                  />
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

            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {loading ? (
                <div className="flex gap-2">
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-12"></div>
                  <div className="animate-pulse bg-white/20 rounded-full px-3 py-1 h-6 w-16"></div>
                </div>
              ) : (
                navigation.slice(0, 6).map((item) => {
                  const isSpecial = (item as any).isCategory && categories.find(cat => cat.id === (item as any).categoryId)?.is_special;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`px-2.5 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap border-b-2 ${
                        isActiveCategoryLink(item) || ((item as any).scroll && pathname === "/" && item.href.includes("#"))
                          ? "text-white border-white"
                          : "text-white/90 border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {item.name}
                        {isSpecial && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70">New</span>
                        )}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>

            {/* Mobile Navigation Menu */}
            {isOpen && (
              <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl max-h-[40vh] overflow-hidden">
                {loading ? (
                  <div className="space-y-2 p-4">
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-3/4"></div>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-1/2"></div>
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
                        className={`block px-4 py-3 text-sm font-semibold transition-colors rounded-md ${
                          pathname === '/products' && !searchParams.get('category')
                            ? "text-neutral-900 bg-neutral-100"
                            : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        All Products
                       </Link>

                       {/* Categories Section */}
                       {categories.length > 0 && (
                         <>
                           <div className="px-3 py-2 mt-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.12em] border-t border-neutral-200 pt-4">
                             {shop === "A" ? "Beauty Categories" : shop === "B" ? "Style Categories" : "Categories"}
                           </div>
                          <div className="space-y-0.5 pb-4">
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
                                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-md ${
                                    isActiveCategoryLink(item)
                                      ? "text-neutral-900 bg-neutral-100 font-medium"
                                      : "text-neutral-600 hover:bg-neutral-50"
                                  }`}
                                >
                                  <span>{category.name}</span>
                                  {category.is_special && (
                                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                                      Featured
                                    </span>
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

      <SearchPopup open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeModal} />
    </>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <Nav />
    </Suspense>
  )
}