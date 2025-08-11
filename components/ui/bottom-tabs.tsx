"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, User, Sparkles, Watch, QrCode, Home, ShoppingCart } from "lucide-react"
import { useSelector } from "react-redux"
import { useAuth } from "@/lib/contexts/auth-context"
import type { RootState } from "@/lib/store"

export default function BottomTabs() {
  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated } = useAuth()
  const [shopType, setShopType] = useState<"cosmetics" | "accessories">("cosmetics")

  const navItems = [
    { href: "/products", icon: Home, label: "Home", isActive: pathname === "/" },
  
    { href: "/orders", icon: ShoppingBag, label: "Orders", isActive: pathname === "/orders", badge: cartCount || null },
      { type: "toggle" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", isActive: pathname === "/cart" },
    { href: "/profile", icon: User, label: "Profile", isActive: pathname === "/profile" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:block lg:hidden">
      <div className="relative rounded-t-2xl bg-white/60 backdrop-blur-xl border-t border-white/30 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-[#f6d365]/20 to-[#fda085]/20 pointer-events-none" />

        <div className="relative flex items-center justify-between px-5 py-3">
          {navItems.map((item, index) => {
            // Toggle switch
            if (item.type === "toggle") {
              return (
                <div key="toggle" className="flex flex-col items-center">
                  <div className="relative flex bg-white/40 rounded-full p-1 backdrop-blur-md border border-white/50 shadow-sm">
                    <button
                      onClick={() => setShopType("cosmetics")}
                      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                        shopType === "cosmetics"
                          ? "bg-gradient-to-r from-[#f6d365] to-[#fda085] text-white shadow"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Sparkles size={16} />
                    </button>
                    <button
                      onClick={() => setShopType("accessories")}
                      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                        shopType === "accessories"
                          ? "bg-gradient-to-r from-[#f6d365] to-[#fda085] text-white shadow"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Watch size={16} />
                    </button>
                  </div>
                  <span className="mt-1 text-xs font-medium text-gray-600">
                    {shopType === "cosmetics" ? "Beauty" : "Style"}
                  </span>
                </div>
              )
            }

            // Regular nav
            const Icon = item.icon!
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center transition-all duration-300 ${
                  item.isActive ? "text-[#f6d365]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="relative mb-0.5">
                  <Icon size={20} />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border border-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </div>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}
