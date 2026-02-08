"use client"

import type React from "react"
import { useState } from "react"
import { Gift, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpinnerWheel from "@/components/ui/offer-spinner"
import { useShop } from "@/lib/contexts/shop-context"

const NewUserSpinnerSection: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false)
  const { shop } = useShop()

  const shouldShowSpinButton = true
  const isAuthenticated = false

  const getShopContent = () => {
    return {
      title: "Exclusive Offers for New Users Claim Now!",
      subtitle: shop === "A" ? "Spin to get Parts Discounts" : "Spin to get Accessories Discounts",
      description: shop === "A" ? "Spare parts coupon bundle waiting!" : "Accessories coupon bundle waiting!",
      discount: shop === "A" ? "Get up to 100% OFF on spare parts!" : "Get up to 100% OFF on accessories!",
      icon: <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-background animate-bounce" />,
      gradient: "bg-foreground",
      textColor: "text-foreground",
      hoverColor: "hover:bg-muted border-border"
    }
  }

  const shopContent = getShopContent()

  return (
    <div>
      {shouldShowSpinButton && !showSpinner && (
        <div className="px-4 lg:px-6 mt-4 lg:mt-6">
          <div className="max-w-7xl mx-auto">
            <div
              className={`p-6 lg:p-8 text-center relative overflow-hidden shadow-sm border border-border transition-all duration-500 ${shopContent.gradient}`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-background animate-bounce" />
                  <h3 className="text-background font-bold text-xl lg:text-3xl">
                    {shopContent.title}
                  </h3>
                  {shopContent.icon}
                </div>
                <p className="text-background text-lg lg:text-2xl font-bold mb-1">
                  {shopContent.subtitle}
                </p>
                <p className="text-background/80 text-sm lg:text-base mb-6">
                  {shopContent.description}
                </p>
                <Button
                  onClick={() => setShowSpinner(true)}
                  className={`bg-background px-8 lg:px-16 py-4 lg:py-6 font-bold text-lg lg:text-2xl shadow-sm transition-all duration-300 ${shopContent.textColor} ${shopContent.hoverColor}`}
                >
                  🎁 SPIN NOW!
                </Button>
                <p className="text-background/70 text-xs lg:text-sm mt-3">
                  {shopContent.discount}
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
