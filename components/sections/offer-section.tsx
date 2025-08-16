
"use client"

import { Button } from "@/components/ui/button"
import { useShop } from "@/lib/contexts/shop-context"

const OfferSection = () => {
  const { shop } = useShop()

  return (
    <div>
      <div className="px-4 lg:px-6 mt-4 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          <div
            className={`rounded-xl lg:rounded-2xl p-4 lg:p-8 relative overflow-hidden transition-all duration-500 ${
              shop === "A"
                ? "bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500"
                : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"
            }`}
          >
            <div className="relative z-10">
              <h2 className="text-white font-bold text-lg lg:text-2xl mb-1 lg:mb-2">
                {shop === "A" ? "BEAUTY BONANZA SALE" : "TECH MEGA SALE"}
              </h2>
              <div className="flex items-baseline gap-1 mb-2 lg:mb-4">
                <span className="text-white text-xl lg:text-3xl font-bold">UP TO</span>
                <span className="text-white text-3xl lg:text-6xl font-black">
                  {shop === "A" ? "70% OFF" : "80% OFF"}
                </span>
              </div>
              <Button
                className={`bg-white rounded-full px-4 lg:px-8 py-2 lg:py-3 text-sm lg:text-base font-bold transition-colors duration-300 ${
                  shop === "A" ? "text-orange-500 hover:bg-gray-100" : "text-purple-600 hover:bg-gray-100"
                }`}
              >
                {shop === "A" ? "SHOP BEAUTY →" : "SHOP TECH →"}
              </Button>
            </div>
            <div className="absolute top-2 right-4 text-white/20 text-4xl lg:text-8xl">
              {shop === "A" ? "💄" : "📱"}
            </div>
            <div className="absolute bottom-2 right-8 text-white/20 text-2xl lg:text-5xl">
              {shop === "A" ? "✨" : "⚡"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfferSection
