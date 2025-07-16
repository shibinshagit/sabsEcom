"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import type { RootState } from "@/lib/store"
import Image from "next/image"
import Banner from "@/components/ui/banner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useShop } from "@/lib/contexts/shop-context"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Orders", href: "/orders" },
  { name: "Reviews", href: "/#testimonials", scroll: true },
  { name: "About", href: "/#about", scroll: true },
  { name: "Contact", href: "/#contact", scroll: true },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { settings } = useSettings()
  const { user, logout, isAuthenticated } = useAuth()
  const { shop } = useShop()

  // Shop theming
  const shopTheme = shop === "A"
    ? {
        bg: isScrolled
          ? "bg-gradient-to-r from-yellow-200/90 via-orange-200/90 to-amber-300/90 shadow-gold"
          : "bg-gradient-to-r from-yellow-100/90 via-orange-100/90 to-amber-200/90",
        accent: "text-yellow-600",
        after: "Beauty",
        afterClass: "bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 bg-clip-text text-transparent animate-shop-swap",
      }
    : {
        bg: isScrolled
          ? "bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-700/95 shadow-platinum"
          : "bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-700/90",
        accent: "text-gray-300",
        after: "Accessories",
        afterClass: "bg-gradient-to-r from-gray-200 via-gray-400 to-gray-100 bg-clip-text text-transparent animate-shop-swap",
      }

  // Get current page name for banner targeting
  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home"

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

    // Update on mount and when banners might change
    updateBannerHeight()

    // Create observer to watch for banner changes
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

  const handleNavClick = (item: (typeof navigation)[0], e: React.MouseEvent) => {
    if (item.scroll && pathname === "/") {
      e.preventDefault()
      const targetId = item.href.split("#")[1]
      const element = document.getElementById(targetId)
      if (element) {
        const navbarHeight = 80 // Approximate navbar height
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

  return (
    <>
      {/* Banner Section */}
      <div data-banner-container>
        <Banner page={currentPage} />
      </div>

      <nav
        className={`fixed w-full z-40 transition-all duration-500 backdrop-blur-xl border-b border-white/20 ${shopTheme.bg}`}
        style={{ top: "var(--banner-height, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              {settings.restaurant_logo ? (
                <div className="relative w-8 h-8">
                  <Image
                    src={settings.restaurant_logo || "/placeholder.svg"}
                    alt={settings.restaurant_name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className={`w-8 h-8 ${shop === "A" ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gradient-to-r from-gray-300 to-gray-500"} rounded-full flex items-center justify-center`}>
                  <span className="text-black font-bold text-sm">{settings.restaurant_name.charAt(0)}</span>
                </div>
              )}
              <span className="font-playfair text-xl font-bold text-white transition-colors duration-500">
                {settings.restaurant_name}
              </span>
              {/* Animated shop type */}
              <span className={`ml-2 text-lg font-extrabold tracking-tight transition-all duration-500 ${shopTheme.afterClass}`}
                key={shopTheme.after}
              >
                <span className="inline-block animate-shop-fadein">{shopTheme.after}</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                    pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                      ? "text-amber-400"
                      : "text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/order" className="relative">
                <Button variant="ghost" size="sm" className="text-white hover:text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:text-amber-400">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/reservations">My Reservations</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-white hover:text-amber-400">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button - hidden when using bottom tabs */}
            <div className="lg:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="text-white">
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/95 backdrop-blur-md rounded-lg mt-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`block px-3 py-2 text-base font-medium transition-colors hover:text-amber-400 ${
                      pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                        ? "text-amber-400"
                        : "text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center space-x-4 px-3 py-2">
                  <Link href="/order" className="relative">
                    <Button variant="ghost" size="sm" className="text-white hover:text-amber-400">
                      <ShoppingBag className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-white hover:text-amber-400"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm" className="text-white hover:text-amber-400">
                        <User className="w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
