"use client"

import { useState, useEffect, useMemo, type CSSProperties } from "react"
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
  redisplay_after_minutes?: number
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

const DISMISS_STORAGE_KEY = "dismissedBannerTimes"

/** Map of bannerId -> dismissedAt epoch ms */
type DismissMap = Record<string, number>

function readDismissMap(): DismissMap {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as DismissMap
      }
    }

    // Migrate legacy permanent dismiss list → treat as just dismissed now
    const legacy = localStorage.getItem("dismissedBanners")
    if (legacy) {
      const ids = JSON.parse(legacy)
      if (Array.isArray(ids)) {
        const now = Date.now()
        const migrated: DismissMap = {}
        for (const id of ids) {
          migrated[String(id)] = now
        }
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(migrated))
        localStorage.removeItem("dismissedBanners")
        return migrated
      }
    }
  } catch {
    // ignore
  }
  return {}
}

function writeDismissMap(map: DismissMap) {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function redisplayMinutes(banner: BannerData) {
  const n = Number(banner.redisplay_after_minutes)
  if (!Number.isFinite(n)) return 5
  return Math.min(10, Math.max(1, Math.round(n)))
}

function isStillDismissed(banner: BannerData, dismissMap: DismissMap, now = Date.now()) {
  const dismissedAt = dismissMap[String(banner.id)]
  if (!dismissedAt) return false
  const waitMs = redisplayMinutes(banner) * 60 * 1000
  return now - dismissedAt < waitMs
}

export default function Banner({ page = "all" }: BannerProps) {
  const [banners, setBanners] = useState<BannerData[]>([])
  const [dismissMap, setDismissMap] = useState<DismissMap>({})
  const [autoHiddenBanners, setAutoHiddenBanners] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [countryReady, setCountryReady] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    fetchBanners()
    setDismissMap(readDismissMap())

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

  // Tick so dismissed banners can reappear after their frequency without a refresh
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch(`/api/banners?page=${page}&placement=popup`)
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

  const activeBanner = useMemo(
    () =>
      banners.find(
        (banner) =>
          !isStillDismissed(banner, dismissMap, now) && !autoHiddenBanners.includes(banner.id),
      ),
    [banners, dismissMap, autoHiddenBanners, now],
  )

  // Schedule exact re-show when the soonest dismiss expires
  useEffect(() => {
    const waits = banners
      .map((banner) => {
        const dismissedAt = dismissMap[String(banner.id)]
        if (!dismissedAt) return null
        const unlockAt = dismissedAt + redisplayMinutes(banner) * 60 * 1000
        return unlockAt - Date.now()
      })
      .filter((ms): ms is number => typeof ms === "number" && ms > 0)

    if (!waits.length) return
    const next = Math.min(...waits)
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(next + 50, 60_000))
    return () => window.clearTimeout(timer)
  }, [banners, dismissMap, now])

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

  useEffect(() => {
    if (!visible || !activeBanner) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [visible, activeBanner?.id])

  useEffect(() => {
    document.documentElement.style.setProperty("--banner-height", "0px")
  }, [])

  const closePopup = (persistDismiss: boolean) => {
    if (!activeBanner) return
    setVisible(false)
    setTimeout(() => {
      if (persistDismiss && activeBanner.is_dismissible) {
        const next = { ...dismissMap, [String(activeBanner.id)]: Date.now() }
        setDismissMap(next)
        writeDismissMap(next)
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
