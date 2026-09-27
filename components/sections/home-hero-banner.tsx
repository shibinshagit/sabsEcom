"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface HeroBanner {
  id: number
  title: string
  message: string
  background_color: string
  text_color: string
  button_text: string
  button_link: string
  button_color: string
  background_image_url: string
  priority: number
}

export default function HomeHeroBanner() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/banners?page=home&placement=home_hero")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) {
          setBanners(data)
        }
      } catch (err) {
        console.error("Failed to load home hero banners:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const goTo = useCallback(
    (i: number) => {
      if (!banners.length) return
      setIndex(((i % banners.length) + banners.length) % banners.length)
    },
    [banners.length],
  )

  useEffect(() => {
    if (banners.length < 2) return
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => window.clearInterval(id)
  }, [banners.length])

  if (loading || banners.length === 0) return null

  const active = banners[index] || banners[0]

  return (
    <section className="w-full" aria-label="Featured promotion">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-2 sm:pt-5 sm:pb-4">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9]">
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  i === index ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
                }`}
                aria-hidden={i !== index}
              >
                {/* Full-bleed background */}
                {banner.background_image_url ? (
                  <Image
                    src={banner.background_image_url}
                    alt=""
                    fill
                    priority={i === 0}
                    unoptimized
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: banner.background_color || "#111827" }}
                  />
                )}

                {/* Soft veil so copy stays readable over any photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

                {/* Content on top of image */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-10 pb-8 sm:pb-10 pt-6 text-center">
                  <div className="max-w-xl w-full">
                    {banner.title && (
                      <p
                        className="text-[10px] sm:text-xs font-semibold tracking-[0.18em] uppercase mb-1.5 sm:mb-2 drop-shadow-sm"
                        style={{ color: banner.button_color || "#f5d76e" }}
                      >
                        {banner.title}
                      </p>
                    )}
                    {banner.message && (
                      <h2
                        className="text-lg sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight drop-shadow-md"
                        style={{ color: banner.text_color || "#ffffff" }}
                      >
                        {banner.message}
                      </h2>
                    )}

                    {banner.button_text && banner.button_link && (
                      <div className="mt-3 sm:mt-6">
                        <Link
                          href={banner.button_link}
                          className="inline-flex items-center justify-center gap-2 rounded-md px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 shadow-lg"
                          style={{
                            backgroundColor: banner.button_color || "#111827",
                            color: contrastText(banner.button_color || "#111827"),
                          }}
                        >
                          <span>{banner.button_text}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Dots over the image */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 z-[2] flex items-center justify-center gap-2">
                {banners.map((banner, i) => (
                  <button
                    key={banner.id}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                    style={
                      i === index && active.button_color
                        ? { backgroundColor: active.button_color }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function contrastText(hex: string): string {
  const cleaned = hex.replace("#", "")
  if (cleaned.length !== 6) return "#ffffff"
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#ffffff"
}
