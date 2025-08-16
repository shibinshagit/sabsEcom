
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag, User, LogOut, Sparkles, Zap } from "lucide-react"
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
  { name: "Logout", href: "/#logout", scroll: true },
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

  // Enhanced Shop theming
  const shopTheme =
    shop === "A"
      ? {
          // Cosmetics Theme - Pink & Elegant
          bg: isScrolled
            ? "bg-gradient-to-r from-pink-50/95 via-rose-50/95 to-pink-100/95 backdrop-blur-xl border-pink-200/50"
            : "bg-gradient-to-r from-pink-50/90 via-rose-50/90 to-pink-100/90 backdrop-blur-xl border-pink-200/30",
          text: "text-rose-800",
          accent: "text-pink-600",
          logo: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500",
          button:
            "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:from-pink-500 hover:to-rose-600 text-white shadow-pink-200",
          cart: "bg-pink-500 text-white",
          mobile: "bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-pink-100/98 backdrop-blur-xl border-pink-200/50",
          after: "Beauty",
          afterClass:
            "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent font-script",
          icon: Sparkles,
        }
      : {
          // Gadgets Theme - Dark & Tech
          bg: isScrolled
            ? "bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-800/95 backdrop-blur-xl border-cyan-500/20"
            : "bg-gradient-to-r from-slate-900/90 via-gray-900/90 to-slate-800/90 backdrop-blur-xl border-cyan-500/10",
          text: "text-cyan-100",
          accent: "text-cyan-400",
          logo: "bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-500",
          button:
            "bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/20",
          cart: "bg-cyan-500 text-slate-900",
          mobile:
            "bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-slate-800/98 backdrop-blur-xl border-cyan-500/20",
          after: "Tech",
          afterClass:
            "bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent font-mono font-bold",
          icon: Zap,
        }

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
    if (item.scroll && pathname === "/") {
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

  const IconComponent = shopTheme.icon

  return (
    <>
      <div data-banner-container>
        <Banner page={currentPage} />
      </div>
      <nav
        className={`fixed w-full z-40 transition-all duration-700 ${shopTheme.bg} border-b`}
        style={{ top: "var(--banner-height, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
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
                <div
                  className={`w-10 h-10 ${shopTheme.logo} rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex flex-col">
                <span
                  className={`font-bold text-xl ${shopTheme.text} transition-colors duration-500 ${shop === "A" ? "font-serif" : "font-mono"}`}
                >
                  {settings.restaurant_name}
                </span>
                <span className={`text-sm ${shopTheme.afterClass} transition-all duration-500`}>{shopTheme.after}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                      ? shopTheme.accent
                      : shopTheme.text
                  } hover:${shopTheme.accent} ${shop === "A" ? "font-medium" : "font-mono"}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/order" className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${shopTheme.text} hover:${shopTheme.accent} transition-all duration-300 group-hover:scale-110`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 ${shopTheme.cart} text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse`}
                    >
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${shopTheme.text} hover:${shopTheme.accent} transition-all duration-300 hover:scale-110`}
                    >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${shopTheme.text} hover:${shopTheme.accent} transition-all duration-300 hover:scale-110`}
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`${shopTheme.text} transition-all duration-300`}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="lg:hidden">
              <div className={`px-2 pt-2 pb-3 space-y-1 ${shopTheme.mobile} rounded-xl mt-2 border shadow-xl`}>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                      pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                        ? shopTheme.accent
                        : shopTheme.text
                    } hover:${shopTheme.accent} ${shop === "A" ? "font-medium" : "font-mono"}`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center space-x-4 px-3 py-2">
                  <Link href="/order" className="relative">
                    <Button variant="ghost" size="sm" className={`${shopTheme.text} hover:${shopTheme.accent}`}>
                      <ShoppingBag className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span
                          className={`absolute -top-2 -right-2 ${shopTheme.cart} text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}
                        >
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
                      className={`${shopTheme.text} hover:${shopTheme.accent}`}
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm" className={`${shopTheme.text} hover:${shopTheme.accent}`}>
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
