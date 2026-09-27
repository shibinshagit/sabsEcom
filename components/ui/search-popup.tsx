"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useShop } from "@/lib/contexts/shop-context"
import { useCurrency } from "@/lib/contexts/currency-context"

type SearchProduct = {
  id: number
  name: string
  image_urls?: string[]
  variants?: Array<{
    price_aed?: number
    price_inr?: number
    discount_aed?: number
    discount_inr?: number
    available_aed?: boolean
    available_inr?: boolean
  }>
  price_aed?: number
  price_inr?: number
  discount_aed?: number
  discount_inr?: number
  is_featured?: boolean
  is_new?: boolean
  display_price?: {
    price: string
    original_price?: string
    symbol: string
  }
  has_discount?: boolean
}

interface SearchPopupProps {
  open: boolean
  onClose: () => void
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value <= 0) return ""
  return value.toFixed(2)
}

/** discount_* fields store the sale price when discounted (same as product list). */
function getPrices(product: SearchProduct, currency: "AED" | "INR") {
  const v = product.variants?.[0]
  if (currency === "AED") {
    const original = Number(v?.price_aed ?? product.price_aed ?? 0)
    const sale = Number(v?.discount_aed ?? product.discount_aed ?? 0)
    const hasSale = sale > 0 && sale < original
    return {
      price: formatMoney(hasSale ? sale : original),
      original: hasSale ? formatMoney(original) : "",
      symbol: "AED ",
    }
  }
  const original = Number(v?.price_inr ?? product.price_inr ?? 0)
  const sale = Number(v?.discount_inr ?? product.discount_inr ?? 0)
  const hasSale = sale > 0 && sale < original
  return {
    price: formatMoney(hasSale ? sale : original),
    original: hasSale ? formatMoney(original) : "",
    symbol: "₹",
  }
}

export default function SearchPopup({ open, onClose }: SearchPopupProps) {
  const [query, setQuery] = useState("")
  const [trending, setTrending] = useState<SearchProduct[]>([])
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [searching, setSearching] = useState(false)
  const [trendingLoaded, setTrendingLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const { shop } = useShop()
  const { selectedCurrency } = useCurrency()

  const loadTrending = useCallback(async () => {
    setLoadingTrending(true)
    try {
      const res = await fetch(`/api/products?shop=${shop}`)
      if (!res.ok) {
        setTrending([])
        return
      }
      const data = await res.json()
      const list: SearchProduct[] = Array.isArray(data)
        ? data
        : data.items || data.products || []
      // Featured products (same pool as homepage "Trending now")
      setTrending(list.filter((p) => Boolean(p.is_featured)).slice(0, 8))
    } catch {
      setTrending([])
    } finally {
      setLoadingTrending(false)
      setTrendingLoaded(true)
    }
  }, [shop])

  useEffect(() => {
    setTrendingLoaded(false)
    setTrending([])
  }, [shop])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setResults([])
    document.body.style.overflow = "hidden"
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    if (!trendingLoaded) {
      loadTrending()
    }
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ""
    }
  }, [open, loadTrending, trendingLoaded])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const performSearch = async (value: string) => {
    if (value.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    try {
      const url = new URL("/api/products/search", window.location.origin)
      url.searchParams.set("q", value.trim())
      url.searchParams.set("shop", shop)
      url.searchParams.set("currency", selectedCurrency)
      url.searchParams.set("limit", "12")
      const res = await fetch(url.toString())
      if (!res.ok) {
        setResults([])
        return
      }
      const data = await res.json()
      setResults(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => performSearch(value), 200)
  }

  const goToProduct = (id: number) => {
    onClose()
    router.push(`/product/${id}`)
  }

  const submitSearch = () => {
    const q = query.trim()
    if (!q) return
    onClose()
    router.push(`/products?search=${encodeURIComponent(q)}`)
  }

  if (!open) return null

  const showSearchResults = query.trim().length >= 2
  const productsToShow = showSearchResults ? results : trending

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 sm:px-6 pt-16 sm:pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close search"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative z-10 w-full max-w-3xl max-h-[min(80vh,calc(100dvh-5rem))] overflow-hidden rounded-2xl border border-white/25 shadow-2xl flex flex-col"
        style={{ backgroundColor: "#a32121" }}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-white/30">
          <Search className="w-5 h-5 text-white/80 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch()
            }}
            placeholder="Search"
            className="flex-1 bg-transparent text-white placeholder:text-white/60 text-base sm:text-lg outline-none min-w-0"
          />
          {(searching || loadingTrending) && (
            <Loader2 className="w-5 h-5 text-white/70 animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm sm:text-base">
              {showSearchResults ? "Search results" : "Trending now"}
            </h3>
            {showSearchResults && query.trim() && (
              <button
                type="button"
                onClick={submitSearch}
                className="text-xs text-white/70 hover:text-white underline underline-offset-2"
              >
                View all
              </button>
            )}
          </div>

          {!showSearchResults && loadingTrending && (
            <p className="text-white/60 text-sm py-8 text-center">Loading products…</p>
          )}

          {!showSearchResults && !loadingTrending && trendingLoaded && trending.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-white font-medium mb-1">No trending products right now</p>
              <p className="text-white/60 text-sm mb-4">
                Type above to search our full catalogue.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex rounded-md bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2"
              >
                Browse all products
              </Link>
            </div>
          )}

          {showSearchResults && !searching && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-white font-medium mb-1">No products found</p>
              <p className="text-white/60 text-sm">
                Try a different name, brand, or category.
              </p>
            </div>
          )}

          {productsToShow.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {productsToShow.map((product) => {
                const img =
                  product.image_urls?.[0] ||
                  `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(product.name)}`
                const prices = getPrices(product, selectedCurrency)

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    className="text-left group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-white mb-2">
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 45vw, 180px"
                        unoptimized
                      />
                    </div>
                    <p className="text-white text-xs sm:text-sm font-semibold uppercase leading-snug line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    {prices.price && (
                      <div className="flex flex-col gap-0.5">
                        {prices.original && (
                          <span className="text-[11px] text-white/50 line-through">
                            {prices.symbol}
                            {prices.original}
                          </span>
                        )}
                        <span className="text-sm text-white font-semibold">
                          {prices.symbol}
                          {prices.price}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
