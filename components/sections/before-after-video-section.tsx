"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Play } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"

interface BeforeAfterVideo {
  id: number
  title: string
  description: string
  media_type?: "image" | "video"
  before_image_url?: string
  after_image_url?: string
  result_video_url?: string
  video_url: string
  thumbnail_url: string
  content_type: "before" | "after" | "result"
  shop: "A" | "B" | "Both"
  display_order: number
  is_active: boolean
}

export default function BeforeAfterVideoSection() {
  const { shop } = useShop()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BeforeAfterVideo[]>([])
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null)
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({})

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/before-after-videos?shop=${shop}`)
        if (!response.ok) {
          setItems([])
          return
        }
        const data: BeforeAfterVideo[] = await response.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to load before/after videos:", error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [shop])

  const sortedItems = useMemo(() => {
    return [...items]
      .filter((item) => {
        if (item.media_type === "image") {
          return !!item.before_image_url && !!item.after_image_url
        }
        return !!(item.result_video_url || item.video_url)
      })
      .sort((a, b) => a.display_order - b.display_order || b.id - a.id)
  }, [items])

  const playVideo = async (id: number) => {
    const current = videoRefs.current[id]
    if (!current) return

    Object.entries(videoRefs.current).forEach(([key, videoEl]) => {
      const videoId = Number(key)
      if (videoEl && videoId !== id && !videoEl.paused) {
        videoEl.pause()
      }
    })

    try {
      await current.play()
      setActiveVideoId(id)
    } catch (error) {
      console.error("Failed to play video:", error)
    }
  }

  const isBeauty = shop === "A"

  if (loading) {
    return (
      <section className="px-4 lg:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="mx-auto h-3 w-28 rounded bg-neutral-200" />
            <div className="mx-auto h-10 w-80 max-w-full rounded bg-neutral-200" />
            <div className="mx-auto h-4 w-96 max-w-full rounded bg-neutral-200" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-neutral-200/70" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (sortedItems.length === 0) {
    return null
  }

  return (
    <section
      className={`relative overflow-hidden px-4 lg:px-6 py-14 lg:py-16 ${
        isBeauty
          ? "bg-[#f3ebe3]"
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      }`}
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={
          isBeauty
            ? {
                backgroundImage:
                  "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(138,114,88,0.22), transparent 60%), radial-gradient(ellipse 40% 40% at 100% 100%, rgba(196,171,141,0.25), transparent 50%)",
              }
            : {
                backgroundImage:
                  "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(56,189,248,0.12), transparent 55%)",
              }
        }
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10 lg:mb-12 text-center">
          <p
            className={`text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase mb-4 ${
              isBeauty ? "text-[#8a7258]" : "text-cyan-400/90"
            }`}
          >
            Real transformations
          </p>

          <h2
            className={`font-playfair text-3xl sm:text-4xl lg:text-5xl tracking-tight ${
              isBeauty ? "text-[#2c241c]" : "text-white"
            }`}
          >
            Before &amp; After
          </h2>

          <div
            className={`mx-auto mt-5 h-px w-16 ba-rule ${
              isBeauty ? "bg-[#8a7258]/45" : "bg-cyan-400/40"
            }`}
          />
        </header>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {sortedItems.map((item, index) => {
            const resultVideoUrl = item.result_video_url || item.video_url
            const isImageItem = item.media_type === "image"

            return (
              <article
                key={item.id}
                className={`ba-card group overflow-hidden rounded-2xl ${
                  isBeauty
                    ? "bg-white/80 ring-1 ring-[#8a7258]/15 shadow-[0_12px_40px_-20px_rgba(44,36,28,0.35)]"
                    : "bg-slate-900/80 ring-1 ring-white/10 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)]"
                }`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                  <h3
                    className={`font-semibold text-base leading-snug ${
                      isBeauty ? "text-[#2c241c]" : "text-slate-100"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded ${
                      isBeauty
                        ? "bg-[#8a7258]/12 text-[#6b5a48]"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {isImageItem ? "Compare" : "Video"}
                  </span>
                </div>

                <div className="px-4 pb-4 space-y-3">
                  {isImageItem ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative overflow-hidden rounded-lg">
                        <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-wider bg-black/65 text-white px-2 py-0.5 rounded">
                          Before
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.before_image_url}
                          alt={`${item.title} before`}
                          className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="relative overflow-hidden rounded-lg">
                        <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-wider bg-black/65 text-white px-2 py-0.5 rounded">
                          After
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.after_image_url}
                          alt={`${item.title} after`}
                          className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={(el) => {
                          videoRefs.current[item.id] = el
                        }}
                        src={resultVideoUrl}
                        className="w-full aspect-video object-cover"
                        controls
                        preload="metadata"
                        playsInline
                        poster={item.thumbnail_url || undefined}
                        onPlay={() => {
                          setActiveVideoId(item.id)
                          Object.entries(videoRefs.current).forEach(([key, videoEl]) => {
                            const otherId = Number(key)
                            if (videoEl && otherId !== item.id && !videoEl.paused) {
                              videoEl.pause()
                            }
                          })
                        }}
                        onPause={() => {
                          if (activeVideoId === item.id) {
                            setActiveVideoId(null)
                          }
                        }}
                        onEnded={() => {
                          if (activeVideoId === item.id) {
                            setActiveVideoId(null)
                          }
                        }}
                      >
                        Your browser does not support this video.
                      </video>
                      {activeVideoId !== item.id && (
                        <button
                          type="button"
                          onClick={() => playVideo(item.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/45 transition"
                          aria-label="Play video"
                        >
                          <span
                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ${
                              isBeauty
                                ? "bg-[#8a7258] text-white"
                                : "bg-white text-slate-900"
                            }`}
                          >
                            <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p
                      className={`text-sm leading-relaxed ${
                        isBeauty ? "text-[#5c4f42]" : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .ba-rule {
          transform: scaleX(0);
          animation: baRule 0.6s ease 0.2s forwards;
        }
        .ba-card {
          opacity: 0;
          transform: translateY(14px);
          animation: baFadeUp 0.55s ease forwards;
        }
        @keyframes baFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes baRule {
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </section>
  )
}
