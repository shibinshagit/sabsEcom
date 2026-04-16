"use client"

import { Truck, ShieldCheck, Sparkles, Headset, BadgeCheck, Gem } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"
import { motion } from "framer-motion"

const Services = () => {
  const { shop } = useShop()

  const services =
    shop === "A"
      ? [
          {
            icon: Truck,
            title: "Free shipping",
            subtitle: "Quick beauty delivery across your city",
            iconColor: "text-rose-500",
            chip: "Fast Delivery",
          },
          {
            icon: BadgeCheck,
            title: "Authentic Products",
            subtitle: "Genuine branded items from trusted sources",
            iconColor: "text-purple-500",
            chip: "Verified",
          },
          {
            icon: Gem,
            title: "Premium Quality",
            subtitle: "High-standard curation for reliable results",
            iconColor: "text-amber-500",
            chip: "Top Rated",
          },
          {
            icon: Headset,
            title: "Friendly Support",
            subtitle: "Need help choosing? We are here for you",
            iconColor: "text-cyan-500",
            chip: "Always On",
          },
        ]
      : [
          {
            icon: Truck,
            title: "Fast delivery",
            subtitle: "Tech and style essentials at your doorstep",
            iconColor: "text-blue-500",
            chip: "Same Day",
          },
          {
            icon: ShieldCheck,
            title: "Safe & trusted",
            subtitle: "Checked products with reliable warranty support",
            iconColor: "text-emerald-500",
            chip: "Secure",
          },
          {
            icon: Sparkles,
            title: "Latest Models",
            subtitle: "New arrivals and trending picks every week",
            iconColor: "text-violet-500",
            chip: "Fresh Stock",
          },
          {
            icon: Headset,
            title: "Fast support",
            subtitle: "Quick order and product help when needed",
            iconColor: "text-cyan-500",
            chip: "24/7",
          },
        ]

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:mt-8 pb-8 sm:pb-12 lg:pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-7 shadow-sm">
          <div className="mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {shop === "A" ? "Why customers love Sabs" : "Why customers trust Sabs"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Fast delivery, trusted quality, and friendly support for every order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {services.map((service, index) => {
              const IconComponent = service.icon
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="h-full rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${service.iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {service.chip}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm sm:text-base font-semibold text-gray-900 min-h-[20px]">{service.title}</h4>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed min-h-[40px]">{service.subtitle}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services