"use client"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Clock } from "lucide-react"
import Footer from "@/components/ui/footer"
import Link from "next/link"
import Image from "next/image"

export default function ContactPage() {
  const { settings } = useSettings()
  const { shop } = useShop()
  const theme = {
    accent: "bg-foreground text-background border-foreground",
    shadow: "shadow-sm",
    heading: "text-foreground",
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-2">
      <div className="max-w-5xl w-full mx-auto">
        <div className="border border-border bg-background shadow-sm p-0 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
            {/* Left: Brand & Social */}
            <div className="flex flex-col items-center justify-center p-10 gap-6 border-b md:border-b-0 md:border-r border-border">
              <div className="flex flex-col items-center gap-3">
                {settings.restaurant_logo ? (
                  <div className="relative w-20 h-20 mb-2">
                    <Image src={settings.restaurant_logo || "/logo.png"} alt={settings.restaurant_name} fill className="object-contain border border-border shadow-sm bg-white" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-2">
                    <span className="text-background font-bold text-3xl">{settings.restaurant_name.charAt(0)}</span>
                  </div>
                )}
                <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground text-center">{settings.restaurant_name}</h1>
                <p className="text-muted-foreground text-lg text-center max-w-xs animate-fade-in">Genuine spare parts and reliable accessories for every rider.</p>
              </div>
              {/* Dynamic Social Media Icons */}
              <div className="flex space-x-6 mt-4">
                {settings.social_facebook && (
                  <a 
                    href={settings.social_facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors text-3xl"
                  >
                    <Facebook />
                  </a>
                )}
                {settings.social_instagram && (
                  <a 
                    href={settings.social_instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors text-3xl"
                  >
                    <Instagram />
                  </a>
                )}
                {settings.social_twitter && (
                  <a 
                    href={settings.social_twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors text-3xl"
                  >
                    <Twitter />
                  </a>
                )}
              </div>
              {(settings.social_facebook || settings.social_instagram || settings.social_twitter) && (
                <div className="mt-2 text-sm text-muted-foreground">Follow us on social media for updates & offers!</div>
              )}
            </div>
            {/* Right: Info & Links */}
            <div className="flex flex-col justify-center p-10 gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-foreground">Contact Info</h4>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-foreground">Moto club Kottakkal, </p>
                      <p className="text-foreground">Thoppil tower, Parakkori,  Puthoor, Kottakkal, Malappuram dist.Kerala.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-foreground flex-shrink-0" />
                    <p className="text-foreground">+91 9995442239</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-foreground flex-shrink-0" />
                    <p className="text-foreground">contact@motoclub.in</p>
                  </div>
                </div>
                {/* Opening Hours */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-foreground">Opening Hours</h4>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-foreground flex-shrink-0" />
                    <div className="text-foreground">
                      <p className="font-medium">Monday - Thursday</p>
                      <p className="text-sm">5:00 PM - 10:00 PM</p>
                    </div>
                  </div>
                  <div className="ml-8 text-foreground">
                    <p className="font-medium">Friday - Saturday</p>
                    <p className="text-sm">5:00 PM - 11:00 PM</p>
                  </div>
                  <div className="ml-8 text-foreground">
                    <p className="font-medium">Sunday</p>
                    <p className="text-sm">4:00 PM - 9:00 PM</p>
                  </div>
                </div>
              </div>
              {/* Quick Links */}
              <div className="flex flex-wrap gap-4 mt-4">
                {/* <Link href="/" className="text-gray-700 hover:text-amber-500 font-medium transition-colors">Home</Link>
                <Link href="/menu" className="text-gray-700 hover:text-amber-500 font-medium transition-colors">Products</Link> */}
                {/* <Link href="/reservations" className="text-gray-700 hover:text-amber-500 font-medium transition-colors">Reservations</Link>
                <Link href="/orders" className="text-gray-700 hover:text-amber-500 font-medium transition-colors">Orders</Link>
                <Link href="/#about" className="text-gray-700 hover:text-amber-500 font-medium transition-colors">About</Link> */}
                <Link href="/privacy-policy" className="text-foreground hover:text-foreground/80 font-medium transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="text-foreground hover:text-foreground/80 font-medium transition-colors">Terms of Service</Link>
              </div>
              <div className="mt-8 text-center text-muted-foreground text-xs">© {new Date().getFullYear()} {settings.restaurant_name}. All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
