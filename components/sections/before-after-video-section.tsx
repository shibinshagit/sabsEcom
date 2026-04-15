"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Play, Sparkles } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  if (loading) {
    return (
      <section className="px-4 lg:px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-72 bg-gray-300/30 rounded" />
            <div className="h-4 w-96 bg-gray-300/30 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-300/30 rounded-xl" />
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

  const theme =
    shop === "A"
      ? {
          sectionBg: "from-rose-50 via-orange-50 to-amber-50",
          accent: "from-orange-500 to-rose-500",
          text: "text-gray-600",
          cardBg: "bg-white/90 border-orange-100",
          chipBg: "bg-orange-100 text-orange-700",
        }
      : {
          sectionBg: "from-slate-900 via-indigo-950 to-slate-900",
          accent: "from-cyan-500 to-blue-500",
          text: "text-slate-300",
          cardBg: "bg-slate-800/95 border-slate-700",
          chipBg: "bg-slate-700 text-cyan-300",
        }

  return (
    <section className={`px-4 lg:px-6 py-12 bg-gradient-to-br ${theme.sectionBg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <Sparkles className={`w-5 h-5 ${shop === "A" ? "text-orange-500" : "text-cyan-400"}`} />
            <h2 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
              Before / After / Results
            </h2>
          </div>
          <p className={theme.text}>
            See real transformation videos from our latest product outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item) => {
            const resultVideoUrl = item.result_video_url || item.video_url
            const isImageItem = item.media_type === "image"

            return (
              <Card key={item.id} className={theme.cardBg}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className={shop === "A" ? "text-gray-900" : "text-slate-100"}>{item.title}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${theme.chipBg}`}>
                      {isImageItem ? "Before/After" : "Result Video"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isImageItem ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg overflow-hidden border border-white/20">
                        <div className="px-2 py-1 text-xs font-semibold bg-black/70 text-white">Before</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.before_image_url}
                          alt={`${item.title} before`}
                          className="w-full aspect-video object-cover"
                        />
                      </div>
                      <div className="rounded-lg overflow-hidden border border-white/20">
                        <div className="px-2 py-1 text-xs font-semibold bg-black/70 text-white">After</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.after_image_url}
                          alt={`${item.title} after`}
                          className="w-full aspect-video object-cover"
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
                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
                          aria-label="Play video"
                        >
                          <span className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl">
                            <Play className="w-7 h-7 ml-0.5" />
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                  {item.description && (
                    <p className={`text-sm ${theme.text}`}>{item.description}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
