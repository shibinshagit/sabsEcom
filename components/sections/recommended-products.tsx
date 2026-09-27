"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrency } from "@/lib/contexts/currency-context"
import { useShop } from "@/lib/contexts/shop-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Variant {
  id: number
  name: string
  price_aed: number
  price_inr: number
  discount_aed?: number
  discount_inr?: number
  available_aed: boolean
  available_inr: boolean
  stock_quantity: number
}

interface Product {
  id: number
  name: string
  description: string
  image_urls: string[]
  category_id: number
  category_name: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  brand?: string
  model?: string
  shop_category: string
  variants: Variant[]
}

interface RecommendedProductsProps {
  currentProductId: number
  categoryId: number
  shopCategory: string
}

function ProductCard({
  product,
  onClick,
  currencySymbol,
  price,
  originalPrice,
  hasDiscount,
}: {
  product: Product
  onClick: () => void
  currencySymbol: string
  price: number
  originalPrice: number
  hasDiscount: boolean
}) {
  const discountPercent =
    hasDiscount && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

  return (
    <Card
      className="group h-full cursor-pointer overflow-hidden rounded-2xl border-0 bg-[#faf7f3] ring-1 ring-[#8a7258]/15 shadow-[0_10px_30px_-18px_rgba(44,36,28,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(44,36,28,0.45)] hover:ring-[#8a7258]/30"
      onClick={onClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ebe4db]">
          <Image
            src={product.image_urls?.[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 40vw, 20vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/30 to-transparent" />

          {product.is_new && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-[#2c241c]/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              New
            </span>
          )}

          {discountPercent > 0 && (
            <span className="absolute bottom-2.5 right-2.5 rounded-md bg-[#8a7258] px-2 py-0.5 text-[10px] font-semibold text-white">
              −{discountPercent}%
            </span>
          )}
        </div>

        <div className="p-3.5 flex flex-1 flex-col">
          <h3 className="font-semibold text-sm text-[#2c241c] leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2 flex-wrap min-h-[28px]">
            {price > 0 ? (
              <>
                <span className="text-sm font-bold text-[#2c241c]">
                  {currencySymbol}
                  {Number(price).toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-[#8a7258]/70 line-through">
                    {currencySymbol}
                    {Number(originalPrice).toFixed(2)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-[#8a7258]">Price not available</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RecommendedProducts({
  currentProductId,
  categoryId,
  shopCategory,
}: RecommendedProductsProps) {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedCurrency, getCurrencySymbol } = useCurrency()
  const { shop } = useShop()
  const router = useRouter()

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/products/recommended?categoryId=${categoryId}&excludeId=${currentProductId}&shop=${shopCategory}&limit=8`,
        )
        if (response.ok) {
          const data = await response.json()
          setRecommendedProducts(data.products || [])
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedProducts()
  }, [currentProductId, categoryId, shopCategory, shop])

  const getProductPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return { price: 0, originalPrice: 0, hasDiscount: false }
    }

    const variant = product.variants[0]
    const isAED = selectedCurrency === "AED"
    const isAvailable = isAED ? variant.available_aed : variant.available_inr

    if (!isAvailable) {
      return { price: 0, originalPrice: 0, hasDiscount: false }
    }

    const price = isAED ? variant.price_aed : variant.price_inr
    const discount = isAED ? variant.discount_aed || 0 : variant.discount_inr || 0
    const finalPrice = discount > 0 ? discount : price
    const hasDiscount = discount > 0 && discount < price

    return {
      price: finalPrice,
      originalPrice: hasDiscount ? price : 0,
      hasDiscount,
    }
  }

  if (loading) {
    return (
      <div className="bg-[#f3ebe3] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-pulse space-y-3">
            <div className="mx-auto h-3 w-28 rounded bg-[#8a7258]/20" />
            <div className="mx-auto h-8 w-64 max-w-full rounded bg-[#8a7258]/15" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-[#ebe4db] aspect-[4/5] rounded-2xl mb-3" />
                <div className="h-4 bg-[#ebe4db] rounded mb-2" />
                <div className="h-4 bg-[#ebe4db] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (recommendedProducts.length === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden bg-[#f3ebe3] py-12 lg:py-14">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(138,114,88,0.18), transparent 60%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 lg:mb-10">
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase text-[#8a7258] mb-3">
            You may also like
          </p>
          <h2 className="font-playfair text-3xl sm:text-4xl text-[#2c241c] tracking-tight">
            Recommended for You
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-[#8a7258]/45" />
        </header>

        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {recommendedProducts.slice(0, 5).map((product) => {
            const { price, originalPrice, hasDiscount } = getProductPrice(product)
            return (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => router.push(`/product/${product.id}`)}
                currencySymbol={getCurrencySymbol(selectedCurrency)}
                price={price}
                originalPrice={originalPrice}
                hasDiscount={hasDiscount}
              />
            )
          })}
        </div>

        <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recommendedProducts.slice(0, 6).map((product) => {
            const { price, originalPrice, hasDiscount } = getProductPrice(product)
            return (
              <div key={product.id} className="flex-none w-[42%]">
                <ProductCard
                  product={product}
                  onClick={() => router.push(`/product/${product.id}`)}
                  currencySymbol={getCurrencySymbol(selectedCurrency)}
                  price={price}
                  originalPrice={originalPrice}
                  hasDiscount={hasDiscount}
                />
              </div>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => router.push(`/products?category=${categoryId}`)}
            variant="outline"
            className="rounded-xl px-6 py-2.5 text-sm text-[#6b5a48] border-[#8a7258]/35 hover:bg-[#8a7258]/10 hover:text-[#2c241c] hover:border-[#8a7258]/50"
          >
            View more similar products
          </Button>
        </div>
      </div>
    </section>
  )
}
