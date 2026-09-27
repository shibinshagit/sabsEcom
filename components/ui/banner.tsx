"use client"

import { useState, useEffect, type CSSProperties } from "react"
import { X, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  const [visible, setVisible] = useState(false)
  const [countryReady, setCountryReady] = useState(false)

  useEffect(() => {
    fetchBanners()
    const dismissed = localStorage.getItem("dismissedBanners")
    if (dismissed) {
      try {
        setDismissedBanners(JSON.parse(dismissed))
      } catch {
        setDismissedBanners([])
      }
    }

    // New visitors must finish country selection first
    const checkCountry = () => {
      setCountryReady(localStorage.getItem("country-selected") === "true")
    }
    checkCountry()
    window.addEventListener("country-selected", checkCountry)
    window.addEventListener("storage", checkCountry)
    return () => {
      window.removeEventListener("country-selected", checkCountry)
      window.removeEventListener("storage", checkCountry)
    }
  }, [page])

  const fetchBanners = async () => {
    try {
      const response = await fetch(`/api/banners?page=${page}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeBanner = banners.find(
    (banner) => !dismissedBanners.includes(banner.id) && !autoHiddenBanners.includes(banner.id),
  )

  // Show popup only after country dialog is done (returning users already have it set)
  useEffect(() => {
    if (!activeBanner || !countryReady) {
      setVisible(false)
      return
    }
    const showTimer = setTimeout(() => setVisible(true), 450)
    return () => clearTimeout(showTimer)
  }, [activeBanner?.id, countryReady])

  useEffect(() => {
    if (!visible || !activeBanner || activeBanner.auto_disappear_seconds <= 0) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setAutoHiddenBanners((prev) =>
          prev.includes(activeBanner.id) ? prev : [...prev, activeBanner.id],
        )
      }, 220)
    }, activeBanner.auto_disappear_seconds * 1000)
    return () => clearTimeout(timer)
  }, [visible, activeBanner?.id, activeBanner?.auto_disappear_seconds])

  // Lock body scroll while popup is open
  useEffect(() => {
    if (!visible || !activeBanner) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [visible, activeBanner?.id])

  // Popup must not reserve header space
  useEffect(() => {
    document.documentElement.style.setProperty("--banner-height", "0px")
  }, [])

  const closePopup = (persistDismiss: boolean) => {
    if (!activeBanner) return
    setVisible(false)
    setTimeout(() => {
      if (persistDismiss && activeBanner.is_dismissible) {
        const next = [...dismissedBanners, activeBanner.id]
        setDismissedBanners(next)
        localStorage.setItem("dismissedBanners", JSON.stringify(next))
      } else {
        setAutoHiddenBanners((prev) =>
          prev.includes(activeBanner.id) ? prev : [...prev, activeBanner.id],
        )
      }
    }, 220)
  }

  if (loading || !activeBanner || !countryReady) return null

  const hasImage = Boolean(activeBanner.background_image_url)
  const hasCta = Boolean(activeBanner.button_text && activeBanner.button_link)

  return (
    <div
      className={`promo-popup ${visible ? "promo-popup--open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={activeBanner.title || "Promotion"}
    >
      <button
        type="button"
        className="promo-popup__backdrop"
        aria-label="Close promotion"
        onClick={() => closePopup(true)}
      />

      <div
        className="promo-popup__card"
        style={
          {
            "--promo-bg": activeBanner.background_color || "#111827",
            "--promo-fg": activeBanner.text_color || "#ffffff",
          } as CSSProperties
        }
      >
        {activeBanner.is_dismissible !== false && (
          <button
            type="button"
            className="promo-popup__close"
            onClick={() => closePopup(true)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {hasImage ? (
          <div className="promo-popup__media">
            <Image
              src={activeBanner.background_image_url}
              alt={activeBanner.title || "Promotion"}
              fill
              priority
              unoptimized
              className="promo-popup__image"
              sizes="(max-width: 768px) 92vw, 560px"
            />
          </div>
        ) : (
          <div className="promo-popup__solid" />
        )}

        <div className="promo-popup__body">
          {activeBanner.title && (
            <span className="promo-popup__badge">{activeBanner.title}</span>
          )}
          {activeBanner.message && (
            <p className="promo-popup__message">{activeBanner.message}</p>
          )}

          <div className="promo-popup__actions">
            {hasCta && (
              <Link
                href={activeBanner.button_link}
                className="promo-popup__cta"
                style={{
                  backgroundColor: activeBanner.button_color || "#f5d76e",
                  color: contrastText(activeBanner.button_color || "#f5d76e"),
                }}
                onClick={() => closePopup(true)}
              >
                <span>{activeBanner.button_text}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              className="promo-popup__secondary"
              onClick={() => closePopup(true)}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function contrastText(hex: string): string {
  const cleaned = hex.replace("#", "")
  if (cleaned.length !== 6) return "#0f172a"
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#0f172a" : "#ffffff"
}
