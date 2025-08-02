
// import { useState, useRef } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Copy, Crown, Gift } from 'lucide-react';
// import { toast } from 'sonner';

// interface Offer {
//   id: number;
//   title: string;
//   discount: string;
//   color: 'gold' | 'purple';
// }

// const offers: Offer[] = [
//   { id: 1, title: '10% OFF', discount: '10', color: 'gold' },
//   { id: 2, title: '25% OFF', discount: '25', color: 'purple' },
//   { id: 3, title: '50% OFF', discount: '50', color: 'gold' },
//   { id: 4, title: '15% OFF', discount: '15', color: 'purple' },
//   { id: 5, title: '100% OFF', discount: '100', color: 'gold' },
//   { id: 6, title: '35% OFF', discount: '35', color: 'purple' },
//   { id: 7, title: '20% OFF', discount: '20', color: 'gold' },
//   { id: 8, title: '75% OFF', discount: '75', color: 'purple' },
// ];

// const SpinWheel = () => {
//   const [isSpinning, setIsSpinning] = useState(false);
//   const [result, setResult] = useState<Offer | null>(null);
//   const [offerCode, setOfferCode] = useState<string>('');
//   const wheelRef = useRef<HTMLDivElement>(null);

//   const generateOfferCode = (offer: Offer): string => {
//     const prefix = 'SPIN';
//     const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
//     return `${prefix}${offer.discount}${randomSuffix}`;
//   };

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       toast.success('Offer code copied to clipboard!');
//     } catch (err) {
//       toast.error('Failed to copy code');
//     }
//   };

//   const spinWheel = () => {
//     if (isSpinning) return;

//     setIsSpinning(true);
//     setResult(null);
//     setOfferCode('');

//     // Random rotation between 1440deg (4 full spins) and 2160deg (6 full spins)
//     const minRotation = 1440;
//     const maxRotation = 2160;
//     const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation;
    
//     // Calculate which segment we land on
//     const segmentAngle = 360 / offers.length;
//     const normalizedRotation = rotation % 360;
//     const winningSegment = Math.floor((360 - normalizedRotation) / segmentAngle) % offers.length;
//     const winningOffer = offers[winningSegment];

//     if (wheelRef.current) {
//       wheelRef.current.style.transform = `rotate(${rotation}deg)`;
//     }

//     // Show result after spin animation completes
//     setTimeout(() => {
//       setResult(winningOffer);
//       const code = generateOfferCode(winningOffer);
//       setOfferCode(code);
//       setIsSpinning(false);
//       toast.success(`Congratulations! You won ${winningOffer.title}!`);
//     }, 3000);
//   };

//   return (
//     <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
//       <div className="text-center mb-8">
//         <div className="flex items-center justify-center gap-2 mb-4">
//           <Crown className="w-8 h-8 text-gold" />
//           <h1 className="text-4xl md:text-6xl font-bold bg-gradient-gold bg-clip-text text-transparent">
//             FORTUNE WHEEL
//           </h1>
//           <Crown className="w-8 h-8 text-gold" />
//         </div>
//         <p className="text-muted-foreground text-lg">
//           Spin the wheel to win amazing offers!
//         </p>
//       </div>

//       {/* Wheel Container */}
//       <div className="relative mb-8">
//         {/* Decorative outer ring */}
//         <div className="absolute inset-0 w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-gold shadow-glow animate-pulse-glow -z-10"></div>
        
//         {/* Main wheel */}
//         <div 
//           ref={wheelRef}
//           className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border-8 border-gold shadow-gold transition-transform duration-[3000ms] ease-out overflow-hidden"
//           style={{ background: 'conic-gradient(from 0deg, #f59e0b 0deg 45deg, #d946ef 45deg 90deg, #f59e0b 90deg 135deg, #d946ef 135deg 180deg, #f59e0b 180deg 225deg, #d946ef 225deg 270deg, #f59e0b 270deg 315deg, #d946ef 315deg 360deg)' }}
//         >
//           {/* Wheel segments with offers */}
//           {offers.map((offer, index) => {
//             const angle = (360 / offers.length) * index;
//             const isGold = index % 2 === 0;
            
//             return (
//               <div
//                 key={offer.id}
//                 className="absolute w-full h-full flex items-center justify-center text-center"
//                 style={{
//                   transform: `rotate(${angle}deg)`,
//                   transformOrigin: 'center',
//                 }}
//               >
//                 <div 
//                   className="absolute text-primary-foreground font-bold text-sm md:text-base transform -translate-y-16 md:-translate-y-20"
//                   style={{ transform: `translateY(-4rem) rotate(${22.5}deg)` }}
//                 >
//                   {offer.discount}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Center spin button */}
//         <Button
//           onClick={spinWheel}
//           disabled={isSpinning}
//           className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-purple hover:bg-gradient-gold text-accent-foreground font-bold text-lg shadow-purple hover:shadow-gold transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isSpinning ? (
//             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-foreground"></div>
//           ) : (
//             'SPIN'
//           )}
//         </Button>

//         {/* Pointer */}
//         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gold z-10"></div>
//       </div>

//       {/* Result Display */}
//       {result && (
//         <Card className="p-6 bg-card border-gold shadow-gold animate-bounce-in max-w-md w-full text-center">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <Gift className="w-6 h-6 text-gold" />
//             <h2 className="text-2xl font-bold text-gold">Congratulations!</h2>
//             <Gift className="w-6 h-6 text-gold" />
//           </div>
          
//           <div className="mb-4">
//             <div className="text-4xl font-bold text-purple mb-2">
//               {result.title}
//             </div>
//             <p className="text-muted-foreground">
//               You've won an amazing discount!
//             </p>
//           </div>

//           <div className="bg-muted p-4 rounded-lg mb-4">
//             <p className="text-sm text-muted-foreground mb-2">Your offer code:</p>
//             <div className="flex items-center gap-2 bg-background p-2 rounded border">
//               <code className="flex-1 text-gold font-mono font-bold">
//                 {offerCode}
//               </code>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => copyToClipboard(offerCode)}
//                 className="border-gold text-gold hover:bg-gold hover:text-primary-foreground"
//               >
//                 <Copy className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>

//           <Button
//             onClick={() => {
//               setResult(null);
//               setOfferCode('');
//               if (wheelRef.current) {
//                 wheelRef.current.style.transform = 'rotate(0deg)';
//               }
//             }}
//             className="w-full bg-gradient-gold hover:bg-gradient-purple text-primary-foreground font-semibold"
//           >
//             Spin Again
//           </Button>
//         </Card>
//       )}

//       {/* Offers List */}
//       <div className="mt-8 max-w-4xl w-full">
//         <h3 className="text-2xl font-bold text-center mb-6 text-gold">
//           Available Offers
//         </h3>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {offers.map((offer) => (
//             <Card 
//               key={offer.id} 
//               className={`p-4 text-center border-2 transition-all duration-300 hover:scale-105 ${
//                 offer.color === 'gold' 
//                   ? 'border-gold bg-gradient-gold text-primary-foreground' 
//                   : 'border-purple bg-gradient-purple text-accent-foreground'
//               }`}
//             >
//               <div className="font-bold text-lg">
//                 {offer.title}
//               </div>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SpinWheel;

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Sparkles, Gift, Star } from "lucide-react"
import { toast } from "sonner"

interface Offer {
  id: number
  title: string
  discount: string
  color: "gold" | "purple"
}

const offers: Offer[] = [
  { id: 1, title: "10% OFF", discount: "10", color: "gold" },
  { id: 2, title: "25% OFF", discount: "25", color: "purple" },
  { id: 3, title: "50% OFF", discount: "50", color: "gold" },
  { id: 4, title: "15% OFF", discount: "15", color: "purple" },
  { id: 5, title: "100% OFF", discount: "100", color: "gold" },
  { id: 6, title: "35% OFF", discount: "35", color: "purple" },
  { id: 7, title: "20% OFF", discount: "20", color: "gold" },
  { id: 8, title: "75% OFF", discount: "75", color: "purple" },
]

const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<Offer | null>(null)
  const [offerCode, setOfferCode] = useState<string>("")
  const wheelRef = useRef<HTMLDivElement>(null)

  const generateOfferCode = (offer: Offer): string => {
    const prefix = "SPIN"
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${offer.discount}${randomSuffix}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Offer code copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy code")
    }
  }

  const spinWheel = () => {
    if (isSpinning) return
    setIsSpinning(true)
    setResult(null)
    setOfferCode("")

    const minRotation = 1440
    const maxRotation = 2160
    const rotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation

    const segmentAngle = 360 / offers.length
    const normalizedRotation = rotation % 360
    const winningSegment = Math.floor((360 - normalizedRotation) / segmentAngle) % offers.length
    const winningOffer = offers[winningSegment]

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`
    }

    setTimeout(() => {
      setResult(winningOffer)
      const code = generateOfferCode(winningOffer)
      setOfferCode(code)
      setIsSpinning(false)
      toast.success(`🎉 You won ${winningOffer.title}!`)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
            LUCKY SPIN
          </h1>
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-gray-300 text-sm">Spin to win amazing discounts!</p>
      </div>

      {/* Compact Wheel Container */}
      <div className="relative mb-6">
        {/* Glowing outer ring */}
        <div className="absolute inset-0 w-48 h-48 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-sm opacity-75 animate-pulse"></div>

        {/* Main wheel */}
        <div
          ref={wheelRef}
          className="relative w-44 h-44 rounded-full border-4 border-yellow-400 shadow-2xl transition-transform duration-[3000ms] ease-out overflow-hidden"
          style={{
            background: `conic-gradient(
              from 0deg,
              #fbbf24 0deg 45deg,
              #a855f7 45deg 90deg,
              #fbbf24 90deg 135deg,
              #a855f7 135deg 180deg,
              #fbbf24 180deg 225deg,
              #a855f7 225deg 270deg,
              #fbbf24 270deg 315deg,
              #a855f7 315deg 360deg
            )`,
          }}
        >
          {/* Wheel segments with offers */}
          {offers.map((offer, index) => {
            const angle = (360 / offers.length) * index

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
                  style={{ transform: `translateY(-3rem) rotate(${22.5}deg)` }}
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
          disabled={isSpinning}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-yellow-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white"
        >
          {isSpinning ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "SPIN"}
        </Button>

        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-yellow-400 z-10 drop-shadow-lg"></div>
      </div>

      {/* Compact Result Display */}
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
          </div>

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
        </Card>
      )}

      {/* Compact Offers Grid */}
      <div className="mt-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-center mb-3 text-yellow-400">Available Prizes</h3>
        <div className="grid grid-cols-4 gap-2">
          {offers.map((offer) => (
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
      </div>
    </div>
  )
}

export default SpinWheel
