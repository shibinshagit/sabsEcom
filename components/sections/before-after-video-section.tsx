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

function isMeaningful(text?: string) {
  const t = (text || "").trim()
  if (!t) return false
  if (t.length <= 2 && !/[a-zA-Z0-9]{3,}/.test(t)) return false
  return t.length > 1
}

export default function BeforeAfterVideoSection() {
  const { shop } = useShop()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<BeforeAfterVideo[]>([])
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null)
  const [orientations, setOrientations] = useState<Record<number, "portrait" | "landscape">>({})
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
      current.controls = true
      await current.play()
      setActiveVideoId(id)
    } catch (error) {
      console.error("Failed to play video:", error)
    }
  }

  const isBeauty = shop === "A"

  if (loading) {
    return (
      <section className={`px-4 sm:px-6 lg:px-8 py-12 sm:py-16 ${isBeauty ? "bg-[#f3ebe3]" : "bg-slate-950"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="mx-auto h-8 w-56 rounded bg-neutral-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-neutral-200/80" />
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
      className={`relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12 sm:py-16 ${
        isBeauty ? "bg-[#f3ebe3]" : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      }`}
    >
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 sm:mb-10 text-center">
          <p
            className={`text-[11px] font-semibold tracking-[0.28em] uppercase mb-3 ${
              isBeauty ? "text-[#8a7258]" : "text-cyan-400/90"
            }`}
          >
            Real transformations
          </p>
          <h2
            className={`font-playfair text-3xl sm:text-4xl tracking-tight ${
              isBeauty ? "text-[#2c241c]" : "text-white"
            }`}
          >
            Before &amp; After
          </h2>
          <div className={`mx-auto mt-4 h-px w-12 ${isBeauty ? "bg-[#8a7258]/50" : "bg-cyan-400/40"}`} />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {sortedItems.map((item) => {
            const resultVideoUrl = item.result_video_url || item.video_url
            const isImageItem = item.media_type === "image"
            const showTitle = isMeaningful(item.title)
            const showDescription = isMeaningful(item.description)
            const isPlaying = activeVideoId === item.id
            const isPortrait = (orientations[item.id] || "portrait") === "portrait"

            return (
              <article
                key={item.id}
                className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl ${
                  isBeauty
                    ? "bg-white shadow-[0_10px_30px_-18px_rgba(44,36,28,0.45)] ring-1 ring-[#e7ddd2]"
                    : "bg-slate-900/80 ring-1 ring-white/10 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)]"
                }`}
              >
                <div className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden ${isBeauty ? "bg-[#1c1612]" : "bg-neutral-950"}`}>
                  {isImageItem ? (
                    <div className="absolute inset-0 grid grid-cols-2">
                      <figure className="relative min-w-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.before_image_url}
                          alt={`${item.title || "Result"} before`}
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          Before
                        </span>
                      </figure>
                      <figure className={`relative min-w-0 overflow-hidden border-l-2 ${isBeauty ? "border-white" : "border-slate-950"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.after_image_url}
                          alt={`${item.title || "Result"} after`}
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          After
                        </span>
                      </figure>
                    </div>
                  ) : (
                    <>
                      <video
                        src={resultVideoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden
                        tabIndex={-1}
                        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75"
                        onLoadedData={(e) => {
                          const preview = e.currentTarget
                          if (preview.currentTime < 0.05) preview.currentTime = 0.05
                        }}
                      />
                      <div className="absolute inset-0 z-[1] flex items-center justify-center">
                      <video
                        ref={(el) => {
                          videoRefs.current[item.id] = el
                        }}
                        src={resultVideoUrl}
                        className={isPortrait ? "h-full w-auto max-w-full" : "h-auto max-h-full w-full"}
                        controls={isPlaying}
                        preload="metadata"
                        playsInline
                        poster={item.thumbnail_url || undefined}
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget
                          if (!video.videoWidth || !video.videoHeight) return
                          const next = video.videoHeight >= video.videoWidth ? "portrait" : "landscape"
                          setOrientations((prev) => (prev[item.id] === next ? prev : { ...prev, [item.id]: next }))
                        }}
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
                          if (activeVideoId === item.id) setActiveVideoId(null)
                        }}
                        onEnded={() => {
                          if (activeVideoId === item.id) setActiveVideoId(null)
                        }}
                      >
                        Your browser does not support this video.
                      </video>
                      </div>

                      {!isPlaying && (
                        <button
                          type="button"
                          onClick={() => playVideo(item.id)}
                          className="absolute inset-0 z-10 flex items-center justify-center bg-black/15 transition hover:bg-black/25"
                          aria-label="Play video"
                        >
                          <span
                            className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl ring-1 ring-white/30 sm:h-16 sm:w-16 ${
                              isBeauty ? "bg-[#8a7258] text-white" : "bg-white text-slate-900"
                            }`}
                          >
                            <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
                          </span>
                        </button>
                      )}

                      <span
                        className={`pointer-events-none absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          isBeauty ? "bg-[#8a7258] text-white" : "bg-cyan-500 text-white"
                        }`}
                      >
                        Video
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`flex flex-1 flex-col gap-1.5 px-4 py-3.5 sm:px-5 sm:py-4 ${
                    isBeauty ? "border-t border-[#f0e7de]" : "border-t border-white/10"
                  }`}
                >
                  <h3
                    className={`line-clamp-2 text-sm font-semibold leading-snug tracking-wide sm:text-[15px] ${
                      isBeauty ? "text-[#2c241c]" : "text-slate-100"
                    }`}
                  >
                    {showTitle ? item.title : "Result"}
                  </h3>
                  <p
                    className={`line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed sm:text-sm ${
                      isBeauty ? "text-[#6b5c4e]" : "text-slate-400"
                    }`}
                  >
                    {showDescription ? item.description : "\u00a0"}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
