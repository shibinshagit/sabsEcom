"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Menu, Calendar, ShoppingBag, User, Star, Info, Phone } from "lucide-react"
import { useSelector } from "react-redux"
import { useAuth } from "@/lib/contexts/auth-context"
import type { RootState } from "@/lib/store"

const mobileNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Products", href: "/products", icon: Menu },
  // { name: "Orders", href: "/orders", icon: ShoppingBag },
  // { name: "Reviews", href: "/#testimonials", icon: Star, scroll: true },
  // { name: "About", href: "/#about", icon: Info, scroll: true },
  { name: "Contact", href: "/#contact", icon: Phone, scroll: true },
]

export default function BottomTabs() {
  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated } = useAuth()

  const handleNavClick = (item: (typeof mobileNavigation)[0], e: React.MouseEvent) => {
    if (item.scroll && pathname === "/") {
      e.preventDefault()
      const targetId = item.href.split("#")[1]
      const element = document.getElementById(targetId)
      if (element) {
        const navbarHeight = 80
        const bannerHeight = Number.parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--banner-height") || "0",
        )
        const bottomTabsHeight = 64 // Height of bottom tabs (h-16 = 64px)
        const offset = navbarHeight + bannerHeight + bottomTabsHeight
        const elementPosition = element.offsetTop - offset

        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })
      }
    }
  }

  return (
    <>
      {/* Background blur overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent lg:hidden" />
      
      {/* Main bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/98 via-black/95 to-black/90 backdrop-blur-xl border-t border-gray-700/50 shadow-2xl lg:hidden">
        <div className="flex items-center justify-around h-16 px-4 py-2">
        {mobileNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${
                isActive 
                  ? "text-amber-400" 
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {item.name === "Orders" && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium transition-all duration-300 ${isActive ? 'text-amber-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-lg" />
              )}
            </Link>
          )
        })}
        </div>
      </div>
    </>
  )
} 