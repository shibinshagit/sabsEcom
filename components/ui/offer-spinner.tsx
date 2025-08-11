"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Gift, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface OfferDiscount {
  percentage: string
}

interface DbOffer {
  id: number
  title: string
  start_date: string
  end_date: string
  offers: OfferDiscount[]
}

interface WheelOffer {
  id: number
  title: string
  discount: string
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
  const wheelRef = useRef<HTMLDivElement>(null)
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

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
          // Parse offers if they're stored as string
          let offerDiscounts: OfferDiscount[]
          if (typeof activeOffer.offers === "string") {
            offerDiscounts = JSON.parse(activeOffer.offers)
          } else {
            offerDiscounts = activeOffer.offers
          }

          // Convert to wheel format with specific colors matching the design
          const wheelOffers: WheelOffer[] = [
            {
              id: 1,
              title: `$${offerDiscounts[0]?.percentage || "200"}`,
              discount: offerDiscounts[0]?.percentage || "200",
              color: "#FF6B35",
            },
            { id: 2, title: "1 more chance", discount: "0", color: "#F5E6D3" },
            {
              id: 3,
              title: `$${offerDiscounts[1]?.percentage || "20"}`,
              discount: offerDiscounts[1]?.percentage || "20",
              color: "#FFE4B5",
            },
            { id: 4, title: `0.5$`, discount: "0.5", color: "#F5E6D3" },
          ]

          setWheelOffers(wheelOffers)
          setCurrentDbOffer(activeOffer)
        } else {
          setError("No active offers available at the moment")
        }
      } catch (err) {
        console.error("Error fetching offers:", err)
        // Set default offers if API fails
        const defaultOffers: WheelOffer[] = [
          { id: 1, title: "$200", discount: "200", color: "#FF6B35" },
          { id: 2, title: "1 more chance", discount: "0", color: "#F5E6D3" },
          { id: 3, title: "$20", discount: "20", color: "#FFE4B5" },
          { id: 4, title: "0.5$", discount: "0.5", color: "#F5E6D3" },
        ]
        setWheelOffers(defaultOffers)
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const generateOfferCode = (offer: WheelOffer): string => {
    const prefix = "SPIN"
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

    // Allow stopping after 1 second
    setTimeout(() => {
      setCanStop(true)
    }, 1000)

    spinTimeoutRef.current = setTimeout(() => {
      setResult(winningOffer)
      const code = generateOfferCode(winningOffer)
      setOfferCode(code)
      setIsSpinning(false)
      setCanStop(false)
    }, 4000)
  }

  const stopWheel = () => {
    if (!canStop || !isSpinning) return

    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current)
    }

    // Pick a random winning offer
    const winningOffer = wheelOffers[Math.floor(Math.random() * wheelOffers.length)]

    setResult(winningOffer)
    const code = generateOfferCode(winningOffer)
    setOfferCode(code)
    setIsSpinning(false)
    setCanStop(false)
  }

  const handleRedeem = () => {
    if (offerCode && result && currentDbOffer) {
      const offerData = {
        code: offerCode,
        discount: result.discount,
        title: result.title,
        offerTitle: currentDbOffer.title,
        offerId: currentDbOffer.id,
        timestamp: Date.now(),
        expiresAt: currentDbOffer.end_date,
      }
      localStorage.setItem("pendingOffer", JSON.stringify(offerData))
    }

    router.push("/auth/login")
  }

  // Generate wheel background
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">New user gift</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Spin to get $200</h2>
          <p className="text-sm text-gray-600">Coupon bundle</p>
        </div>

        {/* Wheel Container */}
        <div className="relative mb-6 flex justify-center">
          {/* Pointer */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-orange-400 drop-shadow-lg"></div>
            <div className="w-4 h-4 bg-orange-400 rounded-full -mt-1 mx-auto border-2 border-white shadow-lg"></div>
          </div>

          {/* Main wheel */}
          <div className="relative w-64 h-64 rounded-full border-4 border-orange-400 shadow-2xl overflow-hidden bg-white">
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full transition-transform ease-out"
              style={{
                background: generateWheelBackground(),
                transitionDuration: isSpinning ? "4000ms" : "0ms",
              }}
            >
              {/* Wheel segments with text */}
              {wheelOffers.map((offer, index) => {
                const segmentAngle = 360 / wheelOffers.length
                const angle = segmentAngle * index + segmentAngle / 2
                const isLightColor = offer.color === "#F5E6D3" || offer.color === "#FFE4B5"

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
                      className={`absolute font-bold text-sm transform -translate-y-16 ${
                        isLightColor ? "text-gray-800" : "text-white"
                      }`}
                      style={{
                        textShadow: isLightColor ? "none" : "1px 1px 2px rgba(0,0,0,0.5)",
                        transform: "translateY(-70px) rotate(0deg)",
                      }}
                    >
                      {offer.title}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Center spin button */}
            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-lg border-4 border-white disabled:opacity-70"
            >
              {isSpinning ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Spin"}
            </Button>
          </div>
        </div>

        {/* Stop Button */}
        {isSpinning && (
          <Button
            onClick={stopWheel}
            disabled={!canStop}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </Button>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-orange-600">Congratulations!</h3>
            </div>
            <div className="mb-3">
              <div className="text-2xl font-bold text-gray-900 mb-1">You won {result.title}!</div>
              <p className="text-gray-600 text-sm">Your discount is ready to use</p>
            </div>

            <div className="bg-white p-3 rounded-lg mb-4 border border-orange-200">
              <p className="text-xs text-gray-500 mb-1">Your coupon code:</p>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                <code className="flex-1 text-orange-600 font-mono font-bold text-sm">{offerCode}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(offerCode)}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 h-6 w-6 p-0"
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

            <Button
              onClick={handleRedeem}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full"
            >
              <Gift className="w-4 h-4 mr-2" />
              Login to Claim Reward
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          The wheel is for illustrative purpose only, everyone will get the best result.{" "}
          <span className="text-orange-600 underline cursor-pointer">See Official Rules</span>
        </p>
      </div>
    </div>
  )
}

export default SpinWheel
