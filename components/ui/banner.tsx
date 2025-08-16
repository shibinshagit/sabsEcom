"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Link from "next/link"

interface BannerData {
  id: number
  title: string
  message: string
  banner_type: string
  background_color: string
  text_color: string
  button_text: string
  button_link: string
  button_color: string
  background_image_url: string
  auto_disappear_seconds: number
  display_pages: string[]
  is_active: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  is_dismissible: boolean
}

interface BannerProps {
  page?: string
}

export default function Banner({ page = "all" }: BannerProps) {
  const [banners, setBanners] = useState<BannerData[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<number[]>([])
  const [autoHiddenBanners, setAutoHiddenBanners] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem("dismissedBanners")
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed))
    }
  }, [page])

  const fetchBanners = async () => {
    try {
      const response = await fetch(`/api/banners?page=${page}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data)
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error)
    } finally {
      setLoading(false)
    }
  }

  const dismissBanner = (bannerId: number) => {
    const newDismissed = [...dismissedBanners, bannerId]
    setDismissedBanners(newDismissed)
    localStorage.setItem("dismissedBanners", JSON.stringify(newDismissed))
  }

  const autoHideBanner = (bannerId: number) => {
    setAutoHiddenBanners((prev) => [...prev, bannerId])
  }

  // Set up auto-disappear timers for banners
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    banners.forEach((banner) => {
      if (
        banner.auto_disappear_seconds > 0 &&
        !dismissedBanners.includes(banner.id) &&
        !autoHiddenBanners.includes(banner.id)
      ) {
        const timer = setTimeout(() => {
          autoHideBanner(banner.id)
        }, banner.auto_disappear_seconds * 1000)

        timers.push(timer)
      }
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [banners, dismissedBanners, autoHiddenBanners])

  const activeBanners = banners.filter(
    (banner) => !dismissedBanners.includes(banner.id) && !autoHiddenBanners.includes(banner.id),
  )

  if (loading || activeBanners.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pointer-events-none">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl pointer-events-auto">
        <div className="space-y-4">
          {activeBanners.map((banner) => (
            <BannerItem key={banner.id} banner={banner} onDismiss={() => dismissBanner(banner.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface BannerItemProps {
  banner: BannerData
  onDismiss: () => void
}

function BannerItem({ banner, onDismiss }: BannerItemProps) {
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (banner.auto_disappear_seconds > 0) {
      setCountdown(banner.auto_disappear_seconds)

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [banner.auto_disappear_seconds])

  const bannerStyle = {
    backgroundColor: banner.background_color,
    color: banner.text_color,
    backgroundImage: banner.background_image_url
      ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${banner.background_image_url})`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }

  return (
    <div
      className="rounded-xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 min-w-0 w-full bg-opacity-95 backdrop-blur-md animate-slide-down border border-black/10"
      style={bannerStyle}
    >
      <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 min-w-0">
        <div className="text-center sm:text-left min-w-0 flex-1">
          <span className="font-bold text-lg block sm:inline truncate max-w-full">{banner.title}</span>
          <span className="block sm:inline sm:ml-3 text-base mt-1 sm:mt-0 break-words max-w-full">{banner.message}</span>
          {countdown !== null && countdown > 0 && (
            <span className="block sm:inline sm:ml-2 text-sm opacity-75 mt-1 sm:mt-0">
              (Auto-closes in {countdown}s)
            </span>
          )}
        </div>
        {banner.button_text && banner.button_link && (
          <Link href={banner.button_link} className="mt-2 sm:mt-0">
            <Button
              size="sm"
              style={{
                backgroundColor: banner.button_color,
                color: banner.background_color,
              }}
              className="hover:opacity-80 transition-opacity"
            >
              {banner.button_text}
            </Button>
          </Link>
        )}
      </div>
      {banner.is_dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-0 sm:ml-4 hover:bg-black/10 flex-shrink-0"
          style={{ color: banner.text_color }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
