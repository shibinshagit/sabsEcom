"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import Image from "next/image"

const FOOTER_BG_DESKTOP = [
  "/images/footer/footer-1.png",
  "/images/footer/footer-2.png",
]

const FOOTER_BG_MOBILE = [
  "/images/footer/mobile-footer1.png",
  "/images/footer/mobile-footer2.png",
]

const ROTATE_MS = 7000

export default function Footer() {
  const { settings } = useSettings()
  const { shop } = useShop()
  const [currentYear] = useState(new Date().getFullYear())
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const len = Math.max(FOOTER_BG_DESKTOP.length, FOOTER_BG_MOBILE.length)
    if (len < 2) return
    const id = window.setInterval(() => {
      setBgIndex((i) => (i + 1) % len)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  const category = shop === "A" ? "Beauty & Cosmetics" : "Fashion & Accessories"

  return (
    <footer id="contact" className="relative overflow-hidden text-neutral-200">
      {/* Full-bleed rotating background — portrait on small screens, landscape on md+ */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Mobile / small screens */}
        <div className="absolute inset-0 md:hidden">
          {FOOTER_BG_MOBILE.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === bgIndex % FOOTER_BG_MOBILE.length ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Tablet / desktop */}
        <div className="absolute inset-0 hidden md:block">
          {FOOTER_BG_DESKTOP.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === bgIndex % FOOTER_BG_DESKTOP.length ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Readability overlay — stronger over text area */}
        <div className="absolute inset-0 bg-black/50 md:bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65 md:bg-gradient-to-r md:from-black/75 md:via-black/40 md:to-black/20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-4 sm:gap-5">
              {settings.restaurant_logo ? (
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl bg-black/90 p-2 ring-1 ring-white/20 shadow-lg">
                  <Image
                    src={settings.restaurant_logo || "/placeholder.svg"}
                    alt="SABS ONLINE"
                    fill
                    className="object-contain p-1.5"
                    sizes="128px"
                    priority
                  />
                </div>
              ) : null}
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
                  {settings.restaurant_name || "Sabs Online Store"}
                </h3>
                <p className="text-sm sm:text-base text-white/70 mt-1">{category}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/80 max-w-md">
              Sabs Online Store story began in 2015 in Dubai. We have created a niche for our
              customers with our high-quality products and our attention to detail in service.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#" aria-label="Facebook" className="text-white/70 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="text-white/70 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter" className="text-white/70 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shipping-policy" className="text-white/85 hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-refund-policy" className="text-white/85 hover:text-white transition-colors">
                  Return & Refund
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="text-white/85 hover:text-white transition-colors">
                  Cancellation
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-white/85 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-white/85">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/55" />
                <p className="leading-relaxed">
                  23/384/A62 Prince Tower, Near KNH Hospital,
                  <br />
                  Railway Station Road Uppala, Kasaragod, India
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0 text-white/55" />
                <a href={`tel:+91${settings.phone}`} className="hover:text-white transition-colors">
                  +91 {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0 text-white/55" />
                <a href="mailto:sabsonlinestore@gmail.com" className="hover:text-white transition-colors break-all">
                  sabsonlinestore@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Hours
            </h4>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <p className="text-white/55 text-xs mb-0.5">Mon – Thu</p>
                <p>10:00 AM – 6:00 PM</p>
              </li>
              <li>
                <p className="text-white/55 text-xs mb-0.5">Fri – Sat</p>
                <p>10:00 AM – 1:00 PM</p>
              </li>
              <li>
                <p className="text-white/55 text-xs mb-0.5">Sunday</p>
                <p>10:00 AM – 12:00 PM</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-white/55">
          <p>© {currentYear} SABS ONLINE. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white/80 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
