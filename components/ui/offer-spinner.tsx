
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Gift, X, Loader2 } from "lucide-react"
import LoginModal from "@/components/auth/login-modal"

interface OfferDiscount {
  value: string
  type: string // 'percentage' or 'cash'
}

interface DbOffer {
  id: number
  title: string
  start_date: string
  end_date: string
  offers: OfferDiscount[]
  offer_type?: string // 'percentage', 'cash', or 'mixed'
}

interface WheelOffer {
  id: number
  title: string
  discount: string
  type: string
  color: string
}

interface SpinWheelProps {
  onClose: () => void
}

const SpinWheel = ({ onClose }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<WheelOffer | null>(null)
  const [offerCode, setOfferCode] = useState<string>("")
  const [wheelOffers, setWheelOffers] = useState<WheelOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [currentDbOffer, setCurrentDbOffer] = useState<DbOffer | null>(null)
  const [canStop, setCanStop] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to format offer display text
  const formatOfferTitle = (value: string, type: string): string => {
    if (value === "0") return "Again"

    if (type === "cash") {
      return `${value} AED`
    } else {
      return `${value}%`
    }
  }

  // Helper function to format offer for result display
  const formatOfferResult = (value: string, type: string): string => {
    if (value === "0") return "Try Again"

    if (type === "cash") {
      return `${value} AED OFF`
    } else {
      return `${value}% OFF`
    }
  }

  // Fetch active offers from database
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/offers/active")
        if (!response.ok) {
          throw new Error("Failed to fetch offers")
        }

        const dbOffers: DbOffer[] = await response.json()

        // Get the first active offer (most recent)
        const activeOffer = dbOffers[0]
        if (activeOffer) {
          let offerDiscounts: OfferDiscount[]

          // Handle both old format (percentage only) and new format (with type)
          if (typeof activeOffer.offers === "string") {
            const parsedOffers = JSON.parse(activeOffer.offers)
            // Convert old format to new format if needed
            offerDiscounts = parsedOffers.map((offer: any) => ({
              value: offer.percentage || offer.value,
              type: offer.type || "percentage",
            }))
          } else {
            // Handle direct array format
            offerDiscounts = activeOffer.offers.map((offer: any) => ({
              value: offer.percentage || offer.value,
              type: offer.type || "percentage",
            }))
          }

          // Convert to wheel format with dynamic colors
          const colors = ["#FF6B35", "#FFE4B5", "#F5E6D3", "#FFD700", "#FF4500", "#98FB98"]
          const wheelOffers: WheelOffer[] = offerDiscounts.map((discount, index) => ({
            id: index + 1,
            title: formatOfferTitle(discount.value, discount.type),
            discount: discount.value,
            type: discount.type,
            color: colors[index % colors.length],
          }))

          setWheelOffers(wheelOffers)
          setCurrentDbOffer(activeOffer)
        } else {
          setError("No active offers available at the moment")
        }
      } catch (err) {
        console.error("Error fetching offers:", err)
        setError("Failed to load offers. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const generateOfferCode = (offer: WheelOffer): string => {
    const prefix = offer.type === "cash" ? "CASH" : "SPIN"
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${offer.discount}${randomSuffix}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Offer code copied to clipboard!")
    } catch (err) {
      alert("Failed to copy code")
    }
  }

  const spinWheel = () => {
    if (isSpinning || wheelOffers.length === 0) return

    setIsSpinning(true)
    setResult(null)
    setOfferCode("")
    setCanStop(false)

    const minRotation = 1440
    const maxRotation = 2880
    const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation
    const segmentAngle = 360 / wheelOffers.length
    const normalizedRotation = rotation % 360
    const winningSegment = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % wheelOffers.length
    const winningOffer = wheelOffers[winningSegment]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`
    }

    setTimeout(() => {
      setCanStop(true)
    }, 1000)

    spinTimeoutRef.current = setTimeout(() => {
      setResult(winningOffer)
      if (winningOffer.discount !== "0") {
        const code = generateOfferCode(winningOffer)
        setOfferCode(code)
      }
      setIsSpinning(false)
      setCanStop(false)
    }, 4000)
  }

  const stopWheel = () => {
    if (!canStop || !isSpinning) return

    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current)
    }

    const winningOffer = wheelOffers[Math.floor(Math.random() * wheelOffers.length)]

    setResult(winningOffer)
    if (winningOffer.discount !== "0") {
      const code = generateOfferCode(winningOffer)
      setOfferCode(code)
    }
    setIsSpinning(false)
    setCanStop(false)
  }

  const handleRedeem = () => {
    if (offerCode && result && currentDbOffer) {
      const offerData = {
        code: offerCode,
        discount: result.discount,
        type: result.type,
        title: result.title,
        offerTitle: currentDbOffer.title,
        offerId: currentDbOffer.id,
        timestamp: Date.now(),
        expiresAt: currentDbOffer.end_date,
      }
      // Save to localStorage for use in order page
      localStorage.setItem("pendingOffer", JSON.stringify(offerData))
      
      // Show success message
      alert(`Coupon code ${offerCode} saved! You can use it during checkout.`)
    }

    setIsLoginModalOpen(true)
  }

  const generateWheelBackground = () => {
    if (wheelOffers.length === 0) return ""

    const segmentSize = 360 / wheelOffers.length
    const gradientStops = wheelOffers
      .map((offer, index) => {
        const startAngle = index * segmentSize
        const endAngle = (index + 1) * segmentSize
        return `${offer.color} ${startAngle}deg ${endAngle}deg`
      })
      .join(", ")

    return `conic-gradient(from 0deg, ${gradientStops})`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading offers...</p>
        </div>
      </div>
    )
  }

  if (error || wheelOffers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Offers</h2>
          <p className="text-gray-600 mb-6">{error || "Check back later for amazing deals!"}</p>
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">New user gift</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentDbOffer?.title || "Spin to Win"}</h2>
          <p className="text-sm text-gray-600">
            {currentDbOffer?.offer_type === "mixed"
              ? "Mixed Discounts"
              : currentDbOffer?.offer_type === "cash"
                ? "Cash Discounts (AED)"
                : "Percentage Discounts"}
          </p>
        </div>

        <div className="relative mb-6 flex justify-center">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-orange-400 drop-shadow-lg"></div>
            <div className="w-5 h-5 bg-orange-400 rounded-full -mt-2 mx-auto border-2 border-white shadow-lg"></div>
          </div>

          <div className="relative w-56 h-56 rounded-full border-4 border-orange-400 shadow-2xl overflow-hidden bg-white">
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full transition-transform ease-out duration-4000"
              style={{
                background: generateWheelBackground(),
                transitionDuration: isSpinning ? "4000ms" : "0ms",
              }}
            >
              {wheelOffers.map((offer, index) => {
                const segmentAngle = 360 / wheelOffers.length
                const angle = segmentAngle * index + segmentAngle / 2
                const isLightColor = offer.color === "#F5E6D3" || offer.color === "#FFE4B5" || offer.color === "#98FB98"

                return (
                  <div
                    key={offer.id}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    <div
                      className={`absolute font-bold text-sm transform -translate-y-20 ${
                        isLightColor ? "text-gray-800" : "text-white"
                      }`}
                      style={{
                        textShadow: isLightColor ? "none" : "1px 1px 2px rgba(0,0,0,0.7)",
                        transform: `translateY(-65px) rotate(${angle}deg)`,
                      }}
                    >
                      {offer.title}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-base shadow-lg border-4 border-white disabled:opacity-70"
            >
              {isSpinning ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Spin"}
            </Button>
          </div>
        </div>

        {isSpinning && (
          <Button
            onClick={stopWheel}
            disabled={!canStop}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </Button>
        )}

        {result && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-orange-600">Congratulations!</h3>
            </div>
            <div className="mb-3">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                You won {formatOfferResult(result.discount, result.type)}!
              </div>
              
            </div>

            {result.discount !== "0" && offerCode && (
              <div className="bg-white p-3 rounded-lg mb-4 border border-orange-200">
                <p className="text-xs text-gray-500 mb-1">
                  Your {result.type === "cash" ? "cash discount" : "discount"} code:
                </p>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                  <code
                    className={`flex-1 font-mono font-bold text-sm ${
                      result.type === "cash" ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {offerCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(offerCode)}
                    className={`h-6 w-6 p-0 ${
                      result.type === "cash"
                        ? "border-green-300 text-green-600 hover:bg-green-50"
                        : "border-orange-300 text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {currentDbOffer && (
                  <p className="text-red-500 text-xs mt-2">
                    Expires: {new Date(currentDbOffer.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleRedeem}
              className={`w-full font-semibold py-3 rounded-full ${
                result.type === "cash" ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"
              } text-white`}
            >
              <Gift className="w-4 h-4 mr-2" />
              Login to Claim Reward
            </Button>
          </div>
        )}

      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default SpinWheel