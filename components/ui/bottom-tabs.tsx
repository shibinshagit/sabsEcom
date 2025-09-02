"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, User, Sparkles, Watch, QrCode, Home, ShoppingCart, LogOut, Bell } from "lucide-react"
import { useSelector } from "react-redux"
import { useAuth } from "@/lib/contexts/auth-context"
import { useShop } from "@/lib/contexts/shop-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import LoginModal from "@/components/auth/login-modal"
import type { RootState } from "@/lib/store"

export default function BottomTabs() {
  const pathname = usePathname()
  const cartItems = useSelector((state: RootState) => state.order.cart)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated, user, logout } = useAuth()
  const { shop, setShop } = useShop()
  const { user: clerkUser } = useUser()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const shopType = shop === "A" ? "cosmetics" : "accessories"

  const navItems = [
    { href: "/products", icon: Home, label: "Home", isActive: pathname === "/" },
    { href: "/orders", icon: ShoppingBag, label: "Orders", isActive: pathname === "/orders", badge: cartCount || null },
    { type: "toggle" },
    { href: "/order", icon: ShoppingCart, label: "Cart", isActive: pathname === "/order" },
    { type: "profile" }, 
  ]

  const handleShopToggle = (type: "cosmetics" | "accessories") => {
    setShop(type === "cosmetics" ? "A" : "B")
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:block lg:hidden">
        <div className={`relative rounded-t-2xl backdrop-blur-xl border-t shadow-lg transition-all duration-300 ${
          shop === "A" 
            ? "bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-yellow-500/60 border-yellow-300/30" 
            : "bg-gradient-to-r from-purple-600/60 via-blue-600/60 to-indigo-700/60 border-purple-300/30"
        }`}>
          <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
            shop === "A"
              ? "bg-gradient-to-r from-[#f6d365]/20 to-[#fda085]/20"
              : "bg-gradient-to-r from-purple-500/20 to-indigo-500/20"
          }`} />

          <div className="relative flex items-center justify-between px-5 py-3">
            {navItems.map((item, index) => {
              // Toggle switch
              if (item.type === "toggle") {
                return (
                  <div key="toggle" className="flex flex-col items-center">
                    <div className={`relative flex rounded-full p-1 backdrop-blur-md border shadow-sm transition-all duration-300 ${
                      shop === "A" 
                        ? "bg-white/40 border-white/50" 
                        : "bg-white/30 border-purple-200/50"
                    }`}>
                      <button
                        onClick={() => handleShopToggle("cosmetics")}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                          shopType === "cosmetics"
                            ? "bg-gradient-to-r from-[#f6d365] to-[#fda085] text-white shadow"
                            : shop === "A"
                            ? "text-gray-600 hover:text-gray-800"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <Sparkles size={16} />
                      </button>
                      <button
                        onClick={() => handleShopToggle("accessories")}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                          shopType === "accessories"
                            ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow"
                            : shop === "A"
                            ? "text-gray-600 hover:text-gray-800"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <Watch size={16} />
                      </button>
                    </div>
                    <span className={`mt-1 text-xs font-medium transition-colors duration-300 ${
                      shop === "A" ? "text-orange-700" : "text-purple-200"
                    }`}>
                      {shopType === "cosmetics" ? "Beauty" : "Style"}
                    </span>
                  </div>
                )
              }

              // Profile dropdown
              if (item.type === "profile") {
                return (
                  <div key="profile" className="flex flex-col items-center">
                    {isAuthenticated ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`relative transition-all duration-300 ${
                            pathname === "/profile"
                              ? shop === "A" 
                                ? "text-orange-600" 
                                : "text-purple-200"
                              : shop === "A"
                              ? "text-gray-600 hover:text-gray-800"
                              : "text-gray-300 hover:text-white"
                          }`}>
                            <div className="relative mb-0.5">
                              {user?.isClerkUser && clerkUser?.imageUrl ? (
                                <Image
                                  src={clerkUser.imageUrl}
                                  alt="Profile"
                                  width={20}
                                  height={20}
                                  className="rounded-full"
                                />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <span className="text-xs">My</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-0 border-0 shadow-2xl mb-4">
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
                      <button
                        onClick={handleLoginClick}
                        className={`relative transition-all duration-300 ${
                          shop === "A"
                            ? "text-gray-600 hover:text-gray-800"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <div className="relative mb-0.5">
                          <User size={20} />
                        </div>
                        <span className="text-xs">Login</span>
                      </button>
                    )}
                  </div>
                )
              }

              // Regular nav items
              const Icon = item.icon!
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center transition-all duration-300 ${
                    item.isActive 
                      ? shop === "A" 
                        ? "text-orange-600" 
                        : "text-purple-200"
                      : shop === "A"
                      ? "text-gray-600 hover:text-gray-800"
                      : "text-gray-300 hover:text-white"
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

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  )
}
