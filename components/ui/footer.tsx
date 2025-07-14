"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react"
import { useSettings } from "@/lib/contexts/settings-context"
import Image from "next/image"

export default function Footer() {
  const { settings } = useSettings()
  const [currentYear] = useState(new Date().getFullYear())

  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Restaurant Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {settings.restaurant_logo ? (
                <div className="relative w-10 h-10">
                  <Image
                    src={settings.restaurant_logo || "/placeholder.svg"}
                    alt={settings.restaurant_name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">{settings.restaurant_name.charAt(0)}</span>
                </div>
              )}
              <h3 className="font-playfair text-2xl font-bold">{settings.restaurant_name}</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
            Step into a world of elegance and self-care, where quality, experience, and empowerment come together to redefine your beauty journey.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-amber-400">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Products
                </Link>
              </li>
              {/* <li>
                <Link href="/reservations" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Reservations
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-gray-300 hover:text-amber-400 transition-colors">
                  About
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-amber-400">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">23/384/A62 Near KNH Hospital </p>
                  <p className="text-gray-300">Railway Station Road Uppala, Kasaragod, India</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-gray-300">+91 777 000 3639</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-gray-300">sabsonlinestore@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-amber-400">Opening Hours</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-gray-300">
                  <p className="font-medium">Monday - Thursday</p>
                  <p className="text-sm">5:00 PM - 10:00 PM</p>
                </div>
              </div>
              <div className="text-gray-300 ml-8">
                <p className="font-medium">Friday - Saturday</p>
                <p className="text-sm">5:00 PM - 11:00 PM</p>
              </div>
              <div className="text-gray-300 ml-8">
                <p className="font-medium">Sunday</p>
                <p className="text-sm">4:00 PM - 9:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} {settings.restaurant_name}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-amber-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-amber-400 text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
