"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Heart } from "lucide-react"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import Image from "next/image"

export default function Footer() {
  const { settings } = useSettings()
  const { shop } = useShop()
  const [currentYear] = useState(new Date().getFullYear())

  const theme = {
    bg: "bg-background",
    text: "text-foreground",
    accent: "text-muted-foreground",
    hover: "hover:text-foreground",
    logo: "bg-foreground",
    border: "border-border",
    icon: Heart,
    socialHover: "hover:text-foreground",
    description:
      "Motoclub Kottakkal supplies genuine spare parts and reliable accessories for every ride.",
    shopName: "Motoclub Kottakkal",
    category: shop === "A" ? "Spare Parts" : "Accessories",
  }

  const IconComponent = theme.icon

  return (
    <footer id="contact" className={`${theme.bg} ${theme.text} relative overflow-hidden border-t ${theme.border}`}>
      {/* Floating background elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-float opacity-30 ${
              shop === "A"
                ? "bg-gradient-to-r from-pink-300/20 to-orange-300/20"
                : "bg-gradient-to-r from-blue-300/20 to-purple-300/20"
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Restaurant Info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              {settings.restaurant_logo ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={settings.restaurant_logo || "/placeholder.svg"}
                    alt="Motoclub Automotive"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`w-12 h-12 ${theme.logo} flex items-center justify-center shadow-sm transition-all duration-500`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className={`text-3xl font-bold ${theme.text}`}>{settings.restaurant_name}</h3>
                <p className={`${theme.accent} text-lg`}>{theme.category}</p>
              </div>
            </div>

            <p className={`${theme.text} leading-relaxed text-lg max-w-md`}>
              {theme.description}
            </p>

            <div className="flex space-x-6">
              <a href="#" className={`${theme.text} ${theme.socialHover} transition-all duration-300`}>
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className={`${theme.text} ${theme.socialHover} transition-all duration-300`}>
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className={`${theme.text} ${theme.socialHover} transition-all duration-300`}>
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className={`font-bold text-xl ${theme.accent} flex items-center`}>
              {/* {shop === "A" ? <Sparkles className="w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />} */}
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/shipping-policy" className={`${theme.text} ${theme.hover} transition-colors text-lg`}>
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-refund-policy" className={`${theme.text} ${theme.hover} transition-colors text-lg`}>
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className={`${theme.text} ${theme.hover} transition-colors text-lg`}>
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className={`${theme.text} ${theme.hover} transition-colors text-lg`}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className={`font-bold text-xl ${theme.accent} flex items-center`}>
              <IconComponent className="w-5 h-5 mr-2" />
              Contact Info
            </h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <MapPin className={`w-6 h-6 ${theme.accent} mt-1 flex-shrink-0`} />
                <div>
                  <p className={`${theme.text} text-lg`}>Moto club Kottakkal, </p>
                  <p className={`${theme.text} text-lg`}>Thoppil tower, Parakkori,  Puthoor, Kottakkal, Malappuram dist.Kerala.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className={`w-6 h-6 ${theme.accent} flex-shrink-0`} />
                <p className={`${theme.text} text-lg`}>+91 {settings.phone}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className={`w-6 h-6 ${theme.accent} flex-shrink-0`} />
                <p className={`${theme.text} text-lg`}>contact@motoclub.in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours - Full Width */}
        <div className={`mt-16 pt-12 border-t ${theme.border}`}>
          <div className="text-center">
            <h4 className={`font-bold text-2xl ${theme.accent} mb-8 flex items-center justify-center`}>
              Contact & Opening Hours
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className={`${theme.text} text-center`}>
                <p className="font-semibold text-lg mb-2">Monday - Thursday</p>
                <p className="text-lg">10:00 AM - 6:00 PM</p>
              </div>
              <div className={`${theme.text} text-center`}>
                <p className="font-semibold text-lg mb-2">Friday - Saturday</p>
                <p className="text-lg">10:00 AM - 1:00 PM</p>
              </div>
              <div className={`${theme.text} text-center`}>
                <p className="font-semibold text-lg mb-2">Sunday</p>
                <p className="text-lg">10:00 AM - 12:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t ${theme.border} mt-16 pt-12`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`${theme.text} text-lg flex items-center`}>
              <IconComponent className="w-5 h-5 mr-2" />© {currentYear} {theme.shopName}. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-6 md:mt-0">
              <Link href="/privacy-policy" className={`${theme.text} ${theme.hover} text-lg transition-colors`}>
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className={`${theme.text} ${theme.hover} text-lg transition-colors`}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
