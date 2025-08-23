"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag, User, LogOut, Search, Bell, Heart, Sparkles, Watch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSelector } from "react-redux"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import type { RootState } from "@/lib/store"
import Image from "next/image"
import Banner from "@/components/ui/banner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useShop } from "@/lib/contexts/shop-context"
import LoginModal from "@/components/auth/login-modal"
import { useUser } from "@clerk/nextjs"


// Base navigation without categories
const baseNavigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Orders", href: "/orders" }
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


  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { settings } = useSettings()
  const { user, logout, isAuthenticated } = useAuth()
  const { shop, setShop } = useShop()
  const { user: clerkUser } = useUser()

const wishlistItems = useSelector((state: RootState) => state.wishlist.items)
const wishlistCount = wishlistItems.length


  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home"

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        // Replace this with your actual API endpoint
        const response = await fetch('/api/categories')
        const data = await response.json()

        // Filter categories by shop if needed
        const filteredCategories = shop
          ? data.filter((cat: Category) => !cat.shop || cat.shop === shop)
          : data

        setCategories(filteredCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Fallback categories if API fails
        setCategories([
          { id: 1, name: "Beauty Products", slug: "beauty" },
          { id: 2, name: "Style Accessories", slug: "style" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [shop]) // Re-fetch when shop changes

  // Build navigation with dynamic categories
  const navigation = [
    ...baseNavigation.slice(0, 2), // Home and Products (show all products)
    ...categories.map(category => ({
      name: category.name,
      href: `/products?category=${category.slug || category.id}`,
      categoryId: category.id,
      isCategory: true
    })),
    ...baseNavigation.slice(2) // Orders and other items
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

    // Handle Home click - redirect to home page
    if (item.name === "Home") {
      // Let the default Link behavior handle the navigation
      return
    }

    // Handle Products click - show all products (no category filter)
    if (item.name === "Products") {
      // Navigate to /products without any category parameter
      window.location.href = "/products"
      return
    }

    // Handle category clicks - show specific category
    if ((item as any).isCategory) {
      // Let the default Link behavior handle the navigation with category parameter
      return
    }

    // Handle scroll-based navigation (if you have any)
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

  // Helper function to check if current path matches category
  const isActiveCategoryLink = (item: any) => {
    // For Home and Products links - active when on /products without category param or on home page
    if (item.name === "Home") {
      return pathname === "/"
    }
    if (item.name === "Products") {
      // Active when on /products page without category parameter
      if (pathname === "/products") {
        const urlParams = new URLSearchParams(window.location.search)
        return !urlParams.get('category') // No category param means show all products
      }
      return false
    }

    // For category links - active when category param matches
    if (item.isCategory) {
      if (pathname === "/products") {
        const urlParams = new URLSearchParams(window.location.search)
        const categoryParam = urlParams.get('category')
        return categoryParam === (item.href.split('category=')[1] || '')
      }
      return false
    }

    // For other links
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
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    placeholder={shop === "A" ? "Search for beauty products..." : "Search for style accessories..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-16 h-12 rounded-full bg-white border-0 text-base shadow-lg"
                  />
                  <ShoppingBag className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6 cursor-pointer hover:text-gray-700" />
                </div>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Bell className="w-6 h-6" />
                </Button>

                {/* <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Heart className="w-6 h-6" />
                </Button> */}
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
                    <ShoppingBag className="w-6 h-6" />
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
                          // Show Clerk user avatar if available
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
                              <span className="font-medium text-gray-700">My Dashboard</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/dashboard/orders" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-700">My Orders</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <Link href="/dashboard/reservations" className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Bell className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-700">My Reservations</span>
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
                  // Show login dropdown for non-authenticated users
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
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-2">
                  <Bell className="w-5 h-5" />
                </Button>
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
                {/* ... rest of tablet user dropdown logic same as before ... */}
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder={shop === "A" ? "Search beauty products" : "Search style accessories"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-12 h-10 rounded-full bg-white border-0 text-sm shadow-lg"
              />
              <ShoppingBag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
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
                <Link href="/order" className="relative">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {/* ... rest of mobile user dropdown logic same as before ... */}
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={shop === "A" ? "Search beauty" : "Search style"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-10 h-9 rounded-full bg-white border-0 text-sm"
              />
              <ShoppingBag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Beauty</span>
                    <span className="text-gray-400">|</span>
                    <Watch className="w-4 h-4" />
                    <span>Style</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  )
}