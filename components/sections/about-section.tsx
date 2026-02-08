
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sparkles } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"

interface AboutContent {
  id: number
  title: string
  subtitle: string
  description: string
  image_url: string
  button_text: string
  button_link: string
  is_active: boolean
}

export default function AboutSection() {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const { shop } = useShop()

  useEffect(() => {
    fetchAboutContent()
  }, [])

  const fetchAboutContent = async () => {
    try {
      const response = await fetch("/api/about")
      if (response.ok) {
        const data = await response.json()
        setAboutContent(data[0] || null)
      }
    } catch (error) {
      console.error("Failed to fetch about content:", error)
    } finally {
      setLoading(false)
    }
  }

  const theme = {
    bg: "bg-background",
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    text: "text-muted-foreground",
    button: "bg-foreground text-background hover:bg-foreground/90",
    decorCircle1: "bg-muted",
    decorCircle2: "bg-muted",
    decorCircle3: "bg-muted",
    imageOverlay: "bg-black/10",
    icon: Sparkles,
    floatingElements: "from-black/10 to-black/20",
  }

  // Default content based on shop type
  const defaultContent =
    shop === "A"
      ? {
          title: "Built for Reliable Rides",
          subtitle: "Parts You Can Trust",
          description: `Motoclub Kottakkal supplies genuine spare parts that keep your bike running strong. We source trusted brands and reliable replacements so every repair lasts.\n\nFrom engine components to braking and suspension, our parts lineup is curated for performance, fit, and safety.`,
          image_url: "/placeholder.svg?height=600&width=500",
          button_text: "Browse Spare Parts",
          button_link: "/products",
        }
      : {
          title: "Accessories That Complete the Ride",
          subtitle: "Comfort, Style, Utility",
          description: `Explore accessories built for daily rides and long journeys. We stock practical add-ons and rider essentials that improve safety, comfort, and convenience.\n\nFrom lighting and luggage to helmets and care kits, find what fits your bike and lifestyle.`,
          image_url: "/placeholder.svg?height=600&width=500",
          button_text: "Browse Accessories",
          button_link: "/products",
        }

  const content = aboutContent || defaultContent
  const IconComponent = theme.icon

  if (loading) {
    return (
      <section id="about" className={`py-24 ${theme.bg} relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="h-12 bg-muted w-3/4"></div>
                <div className="h-8 bg-muted w-1/2"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-muted"></div>
                  <div className="h-6 bg-muted"></div>
                  <div className="h-6 bg-muted w-3/4"></div>
                </div>
                <div className="h-16 bg-muted w-1/3"></div>
              </div>
              <div className="h-[600px] bg-muted"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
      <section id="about" className={`py-24 ${theme.bg} relative overflow-hidden`}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-4 h-4 bg-gradient-to-r ${theme.floatingElements} animate-float opacity-30`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <IconComponent className="w-10 h-10 text-foreground animate-pulse" />
              <div className="w-16 h-1 bg-foreground"></div>
            </div>

            <div>
              <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${theme.title} leading-tight`}>{content.title}</h2>
              {content.subtitle && (
                <p className={`text-2xl md:text-3xl font-light mb-8 ${theme.subtitle}`}>{content.subtitle}</p>
              )}
            </div>

            <div className={`prose prose-xl ${theme.text} leading-relaxed`}>
              {content.description.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-6 text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {content.button_text && content.button_link && (
              <Button
                asChild
                size="lg"
                className={`${theme.button} font-semibold px-10 py-4 text-lg transition-all duration-300`}
              >
                <a href={content.button_link} className="flex items-center">
                  <IconComponent className="w-5 h-5 mr-2" />
                  {content.button_text}
                </a>
              </Button>
            )}
          </div>

          <div className="relative animate-scale-in">
            <div className="relative h-[600px] lg:h-[700px] overflow-hidden shadow-sm transform hover:scale-105 transition-all duration-500">
              <Image src={content.image_url || "/placeholder.svg"} alt={content.title} fill className="object-cover" />
              <div className={`absolute inset-0 ${theme.imageOverlay}`} />

              {/* Floating icons */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-500">
                <>
                  <Sparkles className="absolute top-20 left-20 w-8 h-8 text-white animate-pulse" />
                  <Sparkles className="absolute bottom-20 right-20 w-6 h-6 text-white animate-bounce" />
                </>
              </div>
            </div>

            {/* Decorative elements */}
            <div className={`absolute -bottom-8 -left-8 w-32 h-32 ${theme.decorCircle1} opacity-20 animate-pulse`}></div>
            <div className={`absolute -top-8 -right-8 w-24 h-24 ${theme.decorCircle2} opacity-30 animate-bounce`}></div>
            <div className={`absolute top-1/2 -left-4 w-16 h-16 ${theme.decorCircle3} opacity-25 animate-pulse`}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
