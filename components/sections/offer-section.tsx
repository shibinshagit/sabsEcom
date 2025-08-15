import React from "react"
import { Button } from "@/components/ui/button"

const OfferSection = () => {
  return (
   <div>
    <div className="px-4 lg:px-6 mt-4 lg:mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-xl lg:rounded-2xl p-4 lg:p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-white font-bold text-lg lg:text-2xl mb-1 lg:mb-2">
              BACK TO SCHOOL SALE
            </h2>
            <div className="flex items-baseline gap-1 mb-2 lg:mb-4">
              <span className="text-white text-xl lg:text-3xl font-bold">UP TO</span>
              <span className="text-white text-3xl lg:text-6xl font-black">60% OFF</span>
            </div>
            <Button className="bg-white text-orange-500 hover:bg-gray-100 rounded-full px-4 lg:px-8 py-2 lg:py-3 text-sm lg:text-base font-bold">
              SHOP NOW →
            </Button>
          </div>
          {/* Decorative icons */}
          <div className="absolute top-2 right-4 text-white/20 text-4xl lg:text-8xl">🎯</div>
          <div className="absolute bottom-2 right-8 text-white/20 text-2xl lg:text-5xl">✨</div>
        </div>
      </div>
    </div>


    </div>
  )
}

export default OfferSection
