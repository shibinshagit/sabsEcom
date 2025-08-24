
"use client"

import { Truck, RotateCcw, Shield, Zap, Cpu, Heart, Sparkles } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"

const Services = () => {
  const { shop } = useShop()

  const services =
    shop === "A"
      ? [
          {
            icon: Truck,
            title: "Free shipping",
            subtitle: "Beauty delivered",
            bgColor: "bg-pink-50",
            borderColor: "border-pink-200",
            iconColor: "text-pink-600",
            titleColor: "text-pink-700",
            subtitleColor: "text-pink-600",
          },
          {
            icon: RotateCcw,
            title: "Easy returns",
            subtitle: "30 days policy",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            iconColor: "text-purple-600",
            titleColor: "text-purple-700",
            subtitleColor: "text-purple-600",
          },
          {
            icon: Heart,
            title: "Beauty guarantee",
            subtitle: "100% authentic",
            bgColor: "bg-rose-50",
            borderColor: "border-rose-200",
            iconColor: "text-rose-600",
            titleColor: "text-rose-700",
            subtitleColor: "text-rose-600",
          },
          {
            icon: Sparkles,
            title: "Premium quality",
            subtitle: "Luxury brands",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            iconColor: "text-orange-600",
            titleColor: "text-orange-700",
            subtitleColor: "text-orange-600",
          },
        ]
      : [
          {
            icon: Truck,
            title: "Fast delivery",
            subtitle: "Tech in 24hrs",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            iconColor: "text-blue-600",
            titleColor: "text-blue-700",
            subtitleColor: "text-blue-600",
          },
          {
            icon: Shield,
            title: "Tech warranty",
            subtitle: "2 year coverage",
            bgColor: "bg-indigo-50",
            borderColor: "border-indigo-200",
            iconColor: "text-indigo-600",
            titleColor: "text-indigo-700",
            subtitleColor: "text-indigo-600",
          },
          {
            icon: Cpu,
            title: "Latest tech",
            subtitle: "Cutting edge",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            iconColor: "text-purple-600",
            titleColor: "text-purple-700",
            subtitleColor: "text-purple-600",
          },
          {
            icon: Zap,
            title: "Fast support",
            subtitle: "24/7 tech help",
            bgColor: "bg-cyan-50",
            borderColor: "border-cyan-200",
            iconColor: "text-cyan-600",
            titleColor: "text-cyan-700",
            subtitleColor: "text-cyan-600",
          },
        ]

  return (
    <div className="px-4 lg:px-6 mt-4 lg:mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {services.map((service, index) => {
            const IconComponent = service.icon
            return (
              <div
                key={index}
                className={`${service.bgColor} border ${service.borderColor} rounded-lg p-3 lg:p-4 flex items-center gap-2 transition-all duration-500 hover:scale-105`}
              >
                <IconComponent className={`w-4 h-4 lg:w-5 lg:h-5 ${service.iconColor}`} />
                <div>
                  <p className={`${service.titleColor} font-medium text-xs lg:text-sm`}>{service.title}</p>
                  <p className={`${service.subtitleColor} text-xs`}>{service.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Services
