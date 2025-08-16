
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, User, LogOut, Search, Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelector } from "react-redux";
import { useSettings } from "@/lib/contexts/settings-context";
import { useAuth } from "@/lib/contexts/auth-context";
import type { RootState } from "@/lib/store";
import Image from "next/image";
import Banner from "@/components/ui/banner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShop } from "@/lib/contexts/shop-context";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Shop A", href: "/products" },
  { name: "Shop B", href: "/products" },
  { name: "Orders", href: "/orders" },
  { name: "Reviews", href: "/#testimonials", scroll: true },
  { name: "About", href: "/#about", scroll: true },
  { name: "Contact", href: "/#contact", scroll: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const cartItems = useSelector((state: RootState) => state.order.cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const { settings } = useSettings();
  const { user, logout, isAuthenticated } = useAuth();
  const { shop, setShop } = useShop();

  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateBannerHeight = () => {
      const bannerContainer = document.querySelector("[data-banner-container]");
      if (bannerContainer) {
        const height = (bannerContainer as HTMLElement).offsetHeight;
        document.documentElement.style.setProperty("--banner-height", `${height}px`);
      } else {
        document.documentElement.style.setProperty("--banner-height", "0px");
      }
    };
    updateBannerHeight();
    const observer = new MutationObserver(updateBannerHeight);
    const bannerContainer = document.querySelector("[data-banner-container]");
    if (bannerContainer) {
      observer.observe(bannerContainer, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleNavClick = async (item: (typeof navigation)[0], e: React.MouseEvent) => {
    if (item.name === "Logout") {
      e.preventDefault();
      await handleLogout();
      return;
    }
    if (item.scroll && pathname === "/") {
      e.preventDefault();
      const targetId = item.href.split("#")[1];
      const element = document.getElementById(targetId);
      if (element) {
        const navbarHeight = 80;
        const bannerHeight = Number.parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--banner-height") || "0",
        );
        const offset = navbarHeight + bannerHeight;
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        });
      }
      setIsOpen(false);
    }
  };

  const handleShopToggle = (selectedShop: "A" | "B") => {
    setShop(selectedShop);
  };

  return (
    <>
      <div data-banner-container>
        <Banner page={currentPage} />
      </div>
      <nav
        className={`bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 sticky top-0 z-40 shadow-lg transition-all duration-300 ${
          isScrolled ? "shadow-xl" : ""
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
                  <h1 className="text-2xl font-bold text-white">{settings.restaurant_name || "SABS ONLINE"}</h1>
                </Link>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    placeholder="Search for anything..."
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
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                  <Heart className="w-6 h-6" />
                </Button>

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
                        <User className="w-6 h-6" />
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
                    <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full p-3">
                      <User className="w-6 h-6" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Navigation with Shop Toggle */}
            <div className="flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`rounded-full px-6 py-2 font-semibold transition-all duration-200 ${
                    pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                      ? "bg-white text-orange-600 shadow-lg"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Shop Toggle */}
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
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 relative z-10 ${
                      shop === "A" ? "text-orange-600" : "text-white"
                    }`}
                  >
                    SHOP A
                  </button>
                  <button
                    onClick={() => handleShopToggle("B")}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 relative z-10 ${
                      shop === "B" ? "text-orange-600" : "text-white"
                    }`}
                  >
                    SHOP B
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
              <h1 className="text-xl font-bold text-white">{settings.restaurant_name || "SABS ONLINE"}</h1>
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
              <ShoppingBag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                      ? "bg-white text-orange-600"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
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
              <h1 className="text-lg font-bold text-white">{settings.restaurant_name || "SABS ONLINE"}</h1>
              <div className="flex items-center gap-2">
                <Link href="/order" className="relative">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
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
              <ShoppingBag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {navigation.slice(0, 6).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                      ? "bg-white text-orange-600"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Navigation Menu */}
            {isOpen && (
              <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                      pathname === item.href || (item.scroll && pathname === "/" && item.href.includes("#"))
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
                  <div className="relative bg-orange-100 rounded-full p-1">
                    <div
                      className="absolute top-1 bg-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg"
                      style={{
                        width: "calc(50% - 4px)",
                        height: "calc(100% - 8px)",
                        left: shop === "A" ? "4px" : "calc(50% + 0px)",
                      }}
                    />
                    <div className="relative flex">
                      <button
                        onClick={() => handleShopToggle("A")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10 ${
                          shop === "A" ? "text-white" : "text-orange-600"
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleShopToggle("B")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10 ${
                          shop === "B" ? "text-white" : "text-orange-600"
                        }`}
                      >
                        B
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}