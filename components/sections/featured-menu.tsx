
"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { fetchProducts } from "@/lib/store/slices/productSlice"
import { addToCart } from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Star, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function FeaturedMenu() {
  const dispatch = useDispatch<AppDispatch>()
  const { featuredItems, loading } = useSelector((state: RootState) => state.products)
  const { formatPrice } = useSettings()
  const { shop } = useShop()

  const theme = {
    bg: "bg-background",
    cardBg: "bg-card border border-border",
    accent: "bg-foreground text-background border-foreground",
    badge: "bg-muted text-foreground",
    badgeNew: "bg-foreground text-background",
    price: "text-foreground",
    shadow: "shadow-sm hover:shadow-md",
    btn: "bg-foreground text-background hover:bg-foreground/90 border-foreground",
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    divider: "bg-foreground",
    star: "fill-foreground text-foreground",
    icon: Sparkles,
    floatingParticles: "from-black/10 to-black/20",
  }

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ menuItem: product, quantity: 1 }))
  }

  const IconComponent = theme.icon

  if (loading) {
    return (
      <section className={`py-24 ${theme.bg} relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${theme.title}`}>Featured Products</h2>
            <div className={`w-32 h-1 mx-auto ${theme.divider}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={`${theme.cardBg} h-80 mb-4`}></div>
                <div className={`h-6 ${theme.cardBg} mb-3`}></div>
                <div className={`h-4 ${theme.cardBg} w-3/4`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
      <section className={`py-24 ${theme.bg} relative overflow-hidden`}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 bg-gradient-to-r ${theme.floatingParticles} animate-float opacity-40`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20 animate-fade-in">
          <div className="flex justify-center mb-6">
            <IconComponent className="w-12 h-12 text-foreground animate-pulse" />
          </div>
          <h2 className={`text-5xl md:text-7xl font-bold mb-6 ${theme.title} leading-tight`}>Featured Products</h2>
          <p className={`text-xl md:text-2xl mb-8 ${theme.subtitle} font-light`}>
            Reliable spare parts and rider accessories curated for every bike.
          </p>
          <div className={`w-32 h-1 mx-auto ${theme.divider}`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredItems.slice(0, 6).map((item, index) => (
            <Card
              key={item.id}
              className={`group transition-all duration-500 animate-slide-up bg-card border border-border/70 ring-1 ring-border/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="relative overflow-hidden">
                <Image
                  src={item.image_url || `/placeholder.svg?height=320&width=400&query=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  width={400}
                  height={320}
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {item.is_new && (
                    <Badge className={`animate-pulse ${theme.badgeNew} font-semibold`}>NEW</Badge>
                  )}
                  {item.is_featured && <Badge className={`${theme.badge} font-semibold`}>Featured</Badge>}
                </div>

                {/* Rating */}
                <div className="absolute top-4 right-4">
                  <div
                    className="bg-background/90 px-3 py-2 text-sm flex items-center border border-border"
                  >
                    <Star className={`w-4 h-4 ${theme.star} mr-1`} />
                    <span className="text-foreground">4.9</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              <CardContent className="p-8">
                <h3 className={`text-2xl font-bold mb-3 ${theme.title} transition-colors duration-300`}>
                  {item.name}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-3xl font-bold ${theme.price}`}>{formatPrice(item.price)}</span>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    size="lg"
                    className={`${theme.btn} px-6 py-3 font-semibold transition-all duration-300`}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                {item.warranty_months && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <IconComponent className="w-4 h-4 mr-2" />
                    Warranty: {item.warranty_months} months
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/products">
            <Button size="lg" className={`${theme.btn} font-semibold px-12 py-4 text-lg`}>
              <IconComponent className="w-5 h-5 mr-2" />
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
