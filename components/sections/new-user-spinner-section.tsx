
"use client"

import type React from "react"
import { useState } from "react"
import { Gift, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpinnerWheel from "@/components/ui/offer-spinner"
import { useShop } from "@/lib/contexts/shop-context"

const NewUserSpinnerSection: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false)
  const { shop } = useShop()

  const shouldShowSpinButton = true
  const isAuthenticated = false

  return (
    <div>
      {shouldShowSpinButton && !showSpinner && (
        <div className="px-4 lg:px-6 mt-4 lg:mt-6">
          <div className="max-w-7xl mx-auto">
            <div
              className={`rounded-2xl p-6 lg:p-8 text-center relative overflow-hidden shadow-xl border-4 border-white transition-all duration-500 ${
                shop === "A"
                  ? "bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500"
                  : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                  <h3 className="text-white font-bold text-xl lg:text-3xl">
                    {shop === "A" ? "Beauty Lover Gift!" : "Tech Enthusiast Gift!"}
                  </h3>
                  {shop === "A" ? (
                    <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                  ) : (
                    <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                  )}
                </div>
                <p className="text-white text-lg lg:text-2xl font-bold mb-1">
                  {shop === "A" ? "Spin to get $300" : "Spin to get $500"}
                </p>
                <p className="text-white/90 text-sm lg:text-base mb-6">
                  {shop === "A" ? "Beauty coupon bundle waiting!" : "Tech coupon bundle waiting!"}
                </p>
                <Button
                  onClick={() => setShowSpinner(true)}
                  className={`bg-white rounded-full px-8 lg:px-16 py-4 lg:py-6 font-bold text-lg lg:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 ${
                    shop === "A"
                      ? "text-orange-600 hover:bg-gray-100 border-orange-200"
                      : "text-purple-600 hover:bg-gray-100 border-purple-200"
                  }`}
                >
                  {shop === "A" ? "💄 SPIN NOW!" : "🔥 SPIN NOW!"}
                </Button>
                <p className="text-white/80 text-xs lg:text-sm mt-3">
                  {shop === "A" ? "Get up to 100% OFF on beauty products!" : "Get up to 100% OFF on tech gadgets!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSpinner && (
        <div className="px-4 lg:px-6 mt-6">
          <SpinnerWheel onClose={() => setShowSpinner(false)} />
        </div>
      )}
    </div>
  )
}

export default NewUserSpinnerSection
