"use client"

import { Truck, Shield, Zap, Heart, Sparkles } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"
import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"

const Services = () => {
  const { shop } = useShop()
  const [isMounted, setIsMounted] = useState(false)
  const scrollerRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const services = [
    {
      icon: Truck,
      title: "Fast delivery",
      subtitle: shop === "A" ? "Parts delivered" : "Accessories delivered",
      bgColor: "bg-background",
      borderColor: "border-border",
      iconColor: "text-foreground",
      titleColor: "text-foreground",
      subtitleColor: "text-muted-foreground",
      gradient: "from-black/5 to-black/10",
    },
    {
      icon: Shield,
      title: "Trusted quality",
      subtitle: "Verified products",
      bgColor: "bg-background",
      borderColor: "border-border",
      iconColor: "text-foreground",
      titleColor: "text-foreground",
      subtitleColor: "text-muted-foreground",
      gradient: "from-black/5 to-black/10",
    },
    {
      icon: Heart,
      title: "Authentic brands",
      subtitle: "Carefully selected",
      bgColor: "bg-background",
      borderColor: "border-border",
      iconColor: "text-foreground",
      titleColor: "text-foreground",
      subtitleColor: "text-muted-foreground",
      gradient: "from-black/5 to-black/10",
    },
    {
      icon: Sparkles,
      title: "Customer support",
      subtitle: "Quick response",
      bgColor: "bg-background",
      borderColor: "border-border",
      iconColor: "text-foreground",
      titleColor: "text-foreground",
      subtitleColor: "text-muted-foreground",
      gradient: "from-black/5 to-black/10",
    },
  ]

  // Duplicate services for seamless looping
  const loopedServices = [...services, ...services]

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
    hover: {
      scale: 1.05,
      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:mt-8 pb-8 sm:pb-12 lg:pb-12 overflow-hidden">
      <style jsx>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 15px 5px rgba(0, 0, 0, 0.1);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1);
          }
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
          display: flex;
          width: calc(100% * 2);
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s infinite;
        }
        @media (max-width: 640px) {
          .animate-scroll {
            animation-duration: 15s;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .animate-scroll {
            animation-duration: 18s;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden">
          <div ref={scrollerRef} className="animate-scroll">
            {loopedServices.map((service, index) => {
              const IconComponent = service.icon
              return (
                <motion.div
                  key={`${service.title}-${index}`}
                  className={`
                    ${service.bgColor} 
                    border ${service.borderColor} 
                    p-4 sm:p-5 lg:p-6 
                    flex items-center 
                    gap-3 sm:gap-4 
                    bg-gradient-to-br ${service.gradient}
                    cursor-pointer
                    relative
                    overflow-hidden
                    min-w-[250px] sm:min-w-[300px] lg:min-w-[280px]
                    mx-2
                  `}
                  variants={cardVariants}
                  initial="hidden"
                  animate={isMounted ? "visible" : "hidden"}
                  whileHover="hover"
                  custom={index % services.length}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <motion.div
                    className="flex-shrink-0"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${service.iconColor}`} />
                  </motion.div>
                  <div>
                    <p className={`${service.titleColor} font-semibold text-sm sm:text-base lg:text-lg`}>{service.title}</p>
                    <p className={`${service.subtitleColor} text-xs sm:text-sm lg:text-base`}>{service.subtitle}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services