
// "use client"

// import { useState, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Copy, Sparkles, Gift, Star, X } from "lucide-react"
// import { useRouter } from "next/navigation"

// interface Offer {
//   id: number
//   title: string
//   discount: string
//   color: "gold" | "purple"
// }

// const offers: Offer[] = [
//   { id: 1, title: "10% OFF", discount: "10", color: "gold" },
//   { id: 2, title: "25% OFF", discount: "25", color: "purple" },
//   { id: 3, title: "50% OFF", discount: "50", color: "gold" },
//   { id: 4, title: "15% OFF", discount: "15", color: "purple" },
//   { id: 5, title: "100% OFF", discount: "100", color: "gold" },
//   { id: 6, title: "35% OFF", discount: "35", color: "purple" },
//   { id: 7, title: "20% OFF", discount: "20", color: "gold" },
//   { id: 8, title: "75% OFF", discount: "75", color: "purple" },
// ]

// interface SpinWheelProps {
//   onClose: () => void
// }

// const SpinWheel = ({ onClose }: SpinWheelProps) => {
//   const [isSpinning, setIsSpinning] = useState(false)
//   const [result, setResult] = useState<Offer | null>(null)
//   const [offerCode, setOfferCode] = useState<string>("")
//   const wheelRef = useRef<HTMLDivElement>(null)
//   const router = useRouter()

//   const generateOfferCode = (offer: Offer): string => {
//     const prefix = "SPIN"
//     const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
//     return `${prefix}${offer.discount}${randomSuffix}`
//   }

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text)
//       // You can add a toast notification here if you have a toast system
//       alert("Offer code copied to clipboard!")
//     } catch (err) {
//       alert("Failed to copy code")
//     }
//   }

//   const spinWheel = () => {
//     if (isSpinning) return
//     setIsSpinning(true)
//     setResult(null)
//     setOfferCode("")

//     const minRotation = 1440
//     const maxRotation = 2160
//     const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation

//     const segmentAngle = 360 / offers.length
//     const normalizedRotation = rotation % 360
//     const winningSegment = Math.floor((360 - normalizedRotation) / segmentAngle) % offers.length
//     const winningOffer = offers[winningSegment]

//     if (wheelRef.current) {
//       wheelRef.current.style.transform = `rotate(${rotation}deg)`
//     }

//     setTimeout(() => {
//       setResult(winningOffer)
//       const code = generateOfferCode(winningOffer)
//       setOfferCode(code)
//       setIsSpinning(false)
//     }, 3000)
//   }

//   const handleRedeem = () => {
//     // Store the offer code in localStorage for later use
//     if (offerCode) {
//       const offerData = {
//         code: offerCode,
//         discount: result?.discount,
//         title: result?.title,
//         timestamp: Date.now()
//       }
//       localStorage.setItem("pendingOffer", JSON.stringify(offerData))
//     }
    
//     // Redirect to login page
//     router.push("/auth/login")
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
//       {/* Close Button */}
//       <button
//         onClick={onClose}
//         className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
//       >
//         <X className="w-5 h-5" />
//       </button>

//       {/* Animated background particles */}
//       <div className="absolute inset-0 overflow-hidden">
//         {[...Array(20)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute animate-float"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 3}s`,
//               animationDuration: `${3 + Math.random() * 2}s`,
//             }}
//           >
//             <Star className="w-2 h-2 text-yellow-400 opacity-60" />
//           </div>
//         ))}
//       </div>

//       <div className="relative z-10 text-center mb-6">
//         <div className="flex items-center justify-center gap-2 mb-2">
//           <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
//           <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
//             LUCKY SPIN
//           </h1>
//           <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
//         </div>
//         <p className="text-gray-300 text-sm">Spin to win amazing discounts!</p>
//         <p className="text-yellow-400 text-xs mt-2 font-semibold">Login to claim your prize!</p>
//       </div>

//       {/* Compact Wheel Container */}
//       <div className="relative mb-6">
//         {/* Glowing outer ring */}
//         <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-sm opacity-75 animate-pulse"></div>

//         {/* Main wheel */}
//         <div
//           ref={wheelRef}
//           className="relative w-44 h-44 rounded-full border-4 border-yellow-400 shadow-2xl transition-transform duration-[3000ms] ease-out overflow-hidden"
//           style={{
//             background: `conic-gradient(
//               from 0deg,
//               #fbbf24 0deg 45deg,
//               #a855f7 45deg 90deg,
//               #fbbf24 90deg 135deg,
//               #a855f7 135deg 180deg,
//               #fbbf24 180deg 225deg,
//               #a855f7 225deg 270deg,
//               #fbbf24 270deg 315deg,
//               #a855f7 315deg 360deg
//             )`,
//           }}
//         >
//           {/* Wheel segments with offers */}
//           {offers.map((offer, index) => {
//             const angle = (360 / offers.length) * index

//             return (
//               <div
//                 key={offer.id}
//                 className="absolute w-full h-full flex items-center justify-center"
//                 style={{
//                   transform: `rotate(${angle}deg)`,
//                   transformOrigin: "center",
//                 }}
//               >
//                 <div
//                   className="absolute text-white font-bold text-xs transform -translate-y-12"
//                   style={{ transform: `translateY(-3rem) rotate(${22.5}deg)` }}
//                 >
//                   {offer.discount}%
//                 </div>
//               </div>
//             )
//           })}
//         </div>

//         {/* Center spin button */}
//         <Button
//           onClick={spinWheel}
//           disabled={isSpinning}
//           className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-yellow-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
//         >
//           {isSpinning ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "SPIN"}
//         </Button>

//         {/* Pointer */}
//         <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-400 z-10 drop-shadow-lg"></div>
//       </div>

//       {/* Compact Result Display */}
//       {result && (
//         <Card className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-400 shadow-2xl animate-bounce-in max-w-sm w-full text-center backdrop-blur-sm">
//           <div className="flex items-center justify-center gap-2 mb-3">
//             <Gift className="w-5 h-5 text-yellow-400" />
//             <h2 className="text-lg font-bold text-yellow-400">You Won!</h2>
//           </div>

//           <div className="mb-3">
//             <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent mb-1">
//               {result.title}
//             </div>
//             <p className="text-gray-300 text-xs">Amazing discount unlocked!</p>
//           </div>

//           <div className="bg-gray-700 p-3 rounded-lg mb-3">
//             <p className="text-xs text-gray-400 mb-1">Your code:</p>
//             <div className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-yellow-400">
//               <code className="flex-1 text-yellow-400 font-mono font-bold text-sm">{offerCode}</code>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => copyToClipboard(offerCode)}
//                 className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900 h-6 w-6 p-0"
//               >
//                 <Copy className="w-3 h-3" />
//               </Button>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Button
//               onClick={handleRedeem}
//               className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold text-sm h-10"
//             >
//               <Gift className="w-4 h-4 mr-2" />
//               Redeem Now - Login Required
//             </Button>
            
//             <Button
//               onClick={() => {
//                 setResult(null)
//                 setOfferCode("")
//                 if (wheelRef.current) {
//                   wheelRef.current.style.transform = "rotate(0deg)"
//                 }
//               }}
//               className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-gray-900 hover:text-white font-semibold text-sm h-8"
//             >
//               Spin Again
//             </Button>
//           </div>
//         </Card>
//       )}

//       {/* Compact Offers Grid */}
//       <div className="mt-6 max-w-md w-full">
//         <h3 className="text-lg font-bold text-center mb-3 text-yellow-400">Available Prizes</h3>
//         <div className="grid grid-cols-4 gap-2">
//           {offers.map((offer) => (
//             <Card
//               key={offer.id}
//               className={`p-2 text-center border transition-all duration-300 hover:scale-105 ${
//                 offer.color === "gold"
//                   ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900"
//                   : "border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500 text-white"
//               }`}
//             >
//               <div className="font-bold text-xs">{offer.discount}%</div>
//             </Card>
//           ))}
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes float {
//           0%, 100% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-10px) rotate(180deg); }
//         }
//         .animate-float {
//           animation: float 3s ease-in-out infinite;
//         }
//         @keyframes bounce-in {
//           0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
//           50% { transform: scale(1.05); }
//           70% { transform: scale(0.9); }
//           100% { transform: scale(1) translateY(0px); opacity: 1; }
//         }
//         .animate-bounce-in {
//           animation: bounce-in 0.6s ease-out;
//         }
//       `}</style>
//     </div>
//   )
// }

// export default SpinWheel

// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Copy, Sparkles, Gift, Star, X, Loader2 } from "lucide-react"
// import { useRouter } from "next/navigation"

// interface OfferDiscount {
//   percentage: string
// }

// interface DbOffer {
//   id: number
//   title: string
//   start_date: string
//   end_date: string
//   offers: OfferDiscount[]
// }

// interface WheelOffer {
//   id: number
//   title: string
//   discount: string
//   color: "gold" | "purple"
// }

// interface SpinWheelProps {
//   onClose: () => void
// }

// const SpinWheel = ({ onClose }: SpinWheelProps) => {
//   const [isSpinning, setIsSpinning] = useState(false)
//   const [result, setResult] = useState<WheelOffer | null>(null)
//   const [offerCode, setOfferCode] = useState<string>("")
//   const [wheelOffers, setWheelOffers] = useState<WheelOffer[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string>("")
//   const [currentDbOffer, setCurrentDbOffer] = useState<DbOffer | null>(null)
//   const wheelRef = useRef<HTMLDivElement>(null)
//   const router = useRouter()

//   // Fetch active offers from database
//   useEffect(() => {
//     const fetchOffers = async () => {
//       try {
//         setLoading(true)
//         const response = await fetch("/api/offers/active")
//         if (!response.ok) {
//           throw new Error("Failed to fetch offers")
//         }
        
//         const dbOffers: DbOffer[] = await response.json()
        
//         // Get the first active offer (most recent)
//         const activeOffer = dbOffers[0]

//         if (activeOffer) {
//           // Parse offers if they're stored as string
//           let offerDiscounts: OfferDiscount[]
//           if (typeof activeOffer.offers === 'string') {
//             offerDiscounts = JSON.parse(activeOffer.offers)
//           } else {
//             offerDiscounts = activeOffer.offers
//           }

//           // Convert to wheel format with alternating colors
//           const wheelOffers: WheelOffer[] = offerDiscounts.map((discount, index) => ({
//             id: index + 1,
//             title: `${discount.percentage}% OFF`,
//             discount: discount.percentage,
//             color: index % 2 === 0 ? "gold" : "purple"
//           }))

//           setWheelOffers(wheelOffers)
//           setCurrentDbOffer(activeOffer)
//         } else {
//           setError("No active offers available at the moment")
//         }
//       } catch (err) {
//         console.error("Error fetching offers:", err)
//         setError("Failed to load offers")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchOffers()
//   }, [])

//   const generateOfferCode = (offer: WheelOffer): string => {
//     const prefix = "SPIN"
//     const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
//     return `${prefix}${offer.discount}${randomSuffix}`
//   }

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text)
//       alert("Offer code copied to clipboard!")
//     } catch (err) {
//       alert("Failed to copy code")
//     }
//   }

//   const spinWheel = () => {
//     if (isSpinning || wheelOffers.length === 0) return
//     setIsSpinning(true)
//     setResult(null)
//     setOfferCode("")

//     const minRotation = 1440
//     const maxRotation = 2160
//     const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation

//     const segmentAngle = 360 / wheelOffers.length
//     const normalizedRotation = rotation % 360
//     const winningSegment = Math.floor((360 - normalizedRotation) / segmentAngle) % wheelOffers.length
//     const winningOffer = wheelOffers[winningSegment]

//     if (wheelRef.current) {
//       wheelRef.current.style.transform = `rotate(${rotation}deg)`
//     }

//     setTimeout(() => {
//       setResult(winningOffer)
//       const code = generateOfferCode(winningOffer)
//       setOfferCode(code)
//       setIsSpinning(false)
//     }, 3000)
//   }

//   const handleRedeem = () => {
//     if (offerCode && result && currentDbOffer) {
//       const offerData = {
//         code: offerCode,
//         discount: result.discount,
//         title: result.title,
//         offerTitle: currentDbOffer.title,
//         offerId: currentDbOffer.id,
//         timestamp: Date.now(),
//         expiresAt: currentDbOffer.end_date
//       }
//       localStorage.setItem("pendingOffer", JSON.stringify(offerData))
//     }
    
//     router.push("/auth/login")
//   }

//   // Generate wheel background based on number of offers
//   const generateWheelBackground = () => {
//     if (wheelOffers.length === 0) return ""
    
//     const segmentSize = 360 / wheelOffers.length
//     const gradientStops = wheelOffers.map((offer, index) => {
//       const startAngle = index * segmentSize
//       const endAngle = (index + 1) * segmentSize
//       const color = offer.color === "gold" ? "#fbbf24" : "#a855f7"
//       return `${color} ${startAngle}deg ${endAngle}deg`
//     }).join(", ")
    
//     return `conic-gradient(from 0deg, ${gradientStops})`
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
//         >
//           <X className="w-5 h-5" />
//         </button>
        
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
//           <p className="text-white text-lg">Loading offers...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error || wheelOffers.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
//         >
//           <X className="w-5 h-5" />
//         </button>
        
//         <div className="text-center max-w-md">
//           <div className="mb-6">
//             <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <h2 className="text-2xl font-bold text-white mb-2">No Active Offers</h2>
//             <p className="text-gray-300">{error || "There are no active offers available at the moment. Check back later!"}</p>
//           </div>
//           <Button
//             onClick={onClose}
//             className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2 rounded-full"
//           >
//             Close
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
//       {/* Close Button */}
//       <button
//         onClick={onClose}
//         className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
//       >
//         <X className="w-5 h-5" />
//       </button>

//       {/* Animated background particles */}
//       <div className="absolute inset-0 overflow-hidden">
//         {[...Array(20)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute animate-float"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 3}s`,
//               animationDuration: `${3 + Math.random() * 2}s`,
//             }}
//           >
//             <Star className="w-2 h-2 text-yellow-400 opacity-60" />
//           </div>
//         ))}
//       </div>

//       <div className="relative z-10 text-center mb-6">
//         <div className="flex items-center justify-center gap-2 mb-2">
//           <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
//           <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
//             {currentDbOffer?.title || "LUCKY SPIN"}
//           </h1>
//           <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
//         </div>
//         <p className="text-gray-300 text-sm">Spin to win amazing discounts!</p>
//         <p className="text-yellow-400 text-xs mt-2 font-semibold">Login to claim your prize!</p>
//         {currentDbOffer && (
//           <p className="text-green-400 text-xs mt-1">
//             Valid until: {new Date(currentDbOffer.end_date).toLocaleDateString()}
//           </p>
//         )}
//       </div>

//       {/* Dynamic Wheel Container */}
//       <div className="relative mb-6">
//         {/* Glowing outer ring */}
//         <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-sm opacity-75 animate-pulse"></div>

//         {/* Main wheel */}
//         <div
//           ref={wheelRef}
//           className="relative w-44 h-44 rounded-full border-4 border-yellow-400 shadow-2xl transition-transform duration-[3000ms] ease-out overflow-hidden"
//           style={{
//             background: generateWheelBackground(),
//           }}
//         >
//           {/* Wheel segments with offers */}
//           {wheelOffers.map((offer, index) => {
//             const angle = (360 / wheelOffers.length) * index
//             const segmentAngle = 360 / wheelOffers.length

//             return (
//               <div
//                 key={offer.id}
//                 className="absolute w-full h-full flex items-center justify-center"
//                 style={{
//                   transform: `rotate(${angle}deg)`,
//                   transformOrigin: "center",
//                 }}
//               >
//                 <div
//                   className="absolute text-white font-bold text-xs transform -translate-y-12"
//                   style={{ 
//                     transform: `translateY(-3rem) rotate(${segmentAngle/2}deg)`,
//                     textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
//                   }}
//                 >
//                   {offer.discount}%
//                 </div>
//               </div>
//             )
//           })}
//         </div>

//         {/* Center spin button */}
//         <Button
//           onClick={spinWheel}
//           disabled={isSpinning || wheelOffers.length === 0}
//           className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-yellow-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
//         >
//           {isSpinning ? (
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//           ) : (
//             "SPIN"
//           )}
//         </Button>

//         {/* Pointer */}
//         <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-400 z-10 drop-shadow-lg"></div>
//       </div>

//       {/* Result Display */}
//       {result && (
//         <Card className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-400 shadow-2xl animate-bounce-in max-w-sm w-full text-center backdrop-blur-sm">
//           <div className="flex items-center justify-center gap-2 mb-3">
//             <Gift className="w-5 h-5 text-yellow-400" />
//             <h2 className="text-lg font-bold text-yellow-400">You Won!</h2>
//           </div>

//           <div className="mb-3">
//             <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent mb-1">
//               {result.title}
//             </div>
//             <p className="text-gray-300 text-xs">Amazing discount unlocked!</p>
//             {currentDbOffer && (
//               <p className="text-green-400 text-xs mt-1">
//                 From: {currentDbOffer.title}
//               </p>
//             )}
//           </div>

//           <div className="bg-gray-700 p-3 rounded-lg mb-3">
//             <p className="text-xs text-gray-400 mb-1">Your code:</p>
//             <div className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-yellow-400">
//               <code className="flex-1 text-yellow-400 font-mono font-bold text-sm">{offerCode}</code>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => copyToClipboard(offerCode)}
//                 className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900 h-6 w-6 p-0"
//               >
//                 <Copy className="w-3 h-3" />
//               </Button>
//             </div>
//             {currentDbOffer && (
//               <p className="text-red-400 text-xs mt-2">
//                 Expires: {new Date(currentDbOffer.end_date).toLocaleDateString()}
//               </p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Button
//               onClick={handleRedeem}
//               className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold text-sm h-10"
//             >
//               <Gift className="w-4 h-4 mr-2" />
//               Redeem Now - Login Required
//             </Button>
            
//             <Button
//               onClick={() => {
//                 setResult(null)
//                 setOfferCode("")
//                 if (wheelRef.current) {
//                   wheelRef.current.style.transform = "rotate(0deg)"
//                 }
//               }}
//               className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-gray-900 hover:text-white font-semibold text-sm h-8"
//             >
//               Spin Again
//             </Button>
//           </div>
//         </Card>
//       )}

//       {/* Available Prizes Grid */}
//       {wheelOffers.length > 0 && (
//         <div className="mt-6 max-w-md w-full">
//           <h3 className="text-lg font-bold text-center mb-3 text-yellow-400">Available Prizes</h3>
//           <div className={`grid gap-2 ${
//             wheelOffers.length <= 4 ? 'grid-cols-2' : 
//             wheelOffers.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
//           }`}>
//             {wheelOffers.map((offer) => (
//               <Card
//                 key={offer.id}
//                 className={`p-2 text-center border transition-all duration-300 hover:scale-105 ${
//                   offer.color === "gold"
//                     ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900"
//                     : "border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500 text-white"
//                 }`}
//               >
//                 <div className="font-bold text-xs">{offer.discount}%</div>
//               </Card>
//             ))}
//           </div>
//           {currentDbOffer && (
//             <div className="mt-4 p-3 bg-gray-800/60 backdrop-blur-sm rounded-lg text-center">
//               <p className="text-gray-300 text-xs">
//                 <span className="text-yellow-400 font-semibold">{currentDbOffer.title}</span>
//               </p>
//               <p className="text-gray-400 text-xs mt-1">
//                 Valid: {new Date(currentDbOffer.start_date).toLocaleDateString()} - {new Date(currentDbOffer.end_date).toLocaleDateString()}
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       <style jsx>{`
//         @keyframes float {
//           0%, 100% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-10px) rotate(180deg); }
//         }
//         .animate-float {
//           animation: float 3s ease-in-out infinite;
//         }
//         @keyframes bounce-in {
//           0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
//           50% { transform: scale(1.05); }
//           70% { transform: scale(0.9); }
//           100% { transform: scale(1) translateY(0px); opacity: 1; }
//         }
//         .animate-bounce-in {
//           animation: bounce-in 0.6s ease-out;
//         }
//       `}</style>
//     </div>
//   )
// }

// export default SpinWheel

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Sparkles, Gift, Star, X, Loader2 } from "lucide-react"
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
  color: "gold" | "purple"
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
  const wheelRef = useRef<HTMLDivElement>(null)
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
          if (typeof activeOffer.offers === 'string') {
            offerDiscounts = JSON.parse(activeOffer.offers)
          } else {
            offerDiscounts = activeOffer.offers
          }

          // Convert to wheel format with alternating colors
          const wheelOffers: WheelOffer[] = offerDiscounts.map((discount, index) => ({
            id: index + 1,
            title: `${discount.percentage}% OFF`,
            discount: discount.percentage,
            color: index % 2 === 0 ? "gold" : "purple"
          }))

          setWheelOffers(wheelOffers)
          setCurrentDbOffer(activeOffer)
        } else {
          setError("No active offers available at the moment")
        }
      } catch (err) {
        console.error("Error fetching offers:", err)
        setError("Failed to load offers")
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

    const minRotation = 1440
    const maxRotation = 2160
    const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation

    const segmentAngle = 360 / wheelOffers.length
    const normalizedRotation = rotation % 360
    const winningSegment = Math.floor((360 - normalizedRotation) / segmentAngle) % wheelOffers.length
    const winningOffer = wheelOffers[winningSegment]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`
    }

    setTimeout(() => {
      setResult(winningOffer)
      const code = generateOfferCode(winningOffer)
      setOfferCode(code)
      setIsSpinning(false)
    }, 3000)
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
        expiresAt: currentDbOffer.end_date
      }
      localStorage.setItem("pendingOffer", JSON.stringify(offerData))
    }
    
    router.push("/auth/login")
  }

  // Generate wheel background based on number of offers
  const generateWheelBackground = () => {
    if (wheelOffers.length === 0) return ""
    
    const segmentSize = 360 / wheelOffers.length
    const gradientStops = wheelOffers.map((offer, index) => {
      const startAngle = index * segmentSize
      const endAngle = (index + 1) * segmentSize
      const color = offer.color === "gold" ? "#fbbf24" : "#a855f7"
      return `${color} ${startAngle}deg ${endAngle}deg`
    }).join(", ")
    
    return `conic-gradient(from 0deg, ${gradientStops})`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading offers...</p>
        </div>
      </div>
    )
  }

  if (error || wheelOffers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Offers</h2>
            <p className="text-gray-300">{error || "There are no active offers available at the moment. Check back later!"}</p>
          </div>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2 rounded-full"
          >
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Star className="w-2 h-2 text-yellow-400 opacity-60" />
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            {currentDbOffer?.title || "LUCKY SPIN"}
          </h1>
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-gray-300 text-sm">Spin to win amazing discounts!</p>
        <p className="text-yellow-400 text-xs mt-2 font-semibold">Login to claim your prize!</p>
        {currentDbOffer && (
          <p className="text-green-400 text-xs mt-1">
            Valid until: {new Date(currentDbOffer.end_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Dynamic Wheel Container */}
      <div className="relative mb-6">
        {/* Glowing outer ring */}
        <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-sm opacity-75 animate-pulse"></div>

        {/* Main wheel */}
        <div
          ref={wheelRef}
          className="relative w-44 h-44 rounded-full border-4 border-yellow-400 shadow-2xl transition-transform ease-out overflow-hidden"
          style={{
            background: generateWheelBackground(),
            transitionDuration: '3000ms',
          }}
        >
          {/* Wheel segments with offers */}
          {wheelOffers.map((offer, index) => {
            const angle = (360 / wheelOffers.length) * index
            const segmentAngle = 360 / wheelOffers.length

            return (
              <div
                key={offer.id}
                className="absolute w-full h-full flex items-center justify-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "center",
                }}
              >
                <div
                  className="absolute text-white font-bold text-xs transform -translate-y-12"
                  style={{ 
                    transform: `translateY(-3rem) rotate(${segmentAngle/2}deg)`,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                  }}
                >
                  {offer.discount}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Center spin button */}
        <Button
          onClick={spinWheel}
          disabled={isSpinning || wheelOffers.length === 0}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-yellow-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
        >
          {isSpinning ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            "SPIN"
          )}
        </Button>

        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-400 z-10 drop-shadow-lg"></div>
      </div>

      {/* Result Display */}
      {result && (
        <Card className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-400 shadow-2xl animate-bounce-in max-w-sm w-full text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-yellow-400">You Won!</h2>
          </div>

          <div className="mb-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent mb-1">
              {result.title}
            </div>
            <p className="text-gray-300 text-xs">Amazing discount unlocked!</p>
            {currentDbOffer && (
              <p className="text-green-400 text-xs mt-1">
                From: {currentDbOffer.title}
              </p>
            )}
          </div>

          <div className="bg-gray-700 p-3 rounded-lg mb-3">
            <p className="text-xs text-gray-400 mb-1">Your code:</p>
            <div className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-yellow-400">
              <code className="flex-1 text-yellow-400 font-mono font-bold text-sm">{offerCode}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(offerCode)}
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900 h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            {currentDbOffer && (
              <p className="text-red-400 text-xs mt-2">
                Expires: {new Date(currentDbOffer.end_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleRedeem}
              className="w-full bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold text-sm h-10"
            >
              <Gift className="w-4 h-4 mr-2" />
              Redeem Now - Login Required
            </Button>
            
            <Button
              onClick={() => {
                setResult(null)
                setOfferCode("")
                if (wheelRef.current) {
                  wheelRef.current.style.transform = "rotate(0deg)"
                }
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-gray-900 hover:text-white font-semibold text-sm h-8"
            >
              Spin Again
            </Button>
          </div>
        </Card>
      )}

      {/* Available Prizes Grid */}
      {wheelOffers.length > 0 && (
        <div className="mt-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-center mb-3 text-yellow-400">Available Prizes</h3>
          <div className={`grid gap-2 ${
            wheelOffers.length <= 4 ? 'grid-cols-2' : 
            wheelOffers.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {wheelOffers.map((offer) => (
              <Card
                key={offer.id}
                className={`p-2 text-center border transition-all duration-300 hover:scale-105 ${
                  offer.color === "gold"
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900"
                    : "border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                }`}
              >
                <div className="font-bold text-xs">{offer.discount}%</div>
              </Card>
            ))}
          </div>
          {currentDbOffer && (
            <div className="mt-4 p-3 bg-gray-800/60 backdrop-blur-sm rounded-lg text-center">
              <p className="text-gray-300 text-xs">
                <span className="text-yellow-400 font-semibold">{currentDbOffer.title}</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Valid: {new Date(currentDbOffer.start_date).toLocaleDateString()} - {new Date(currentDbOffer.end_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1) translateY(0px); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default SpinWheel