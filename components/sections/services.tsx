import React from "react"
import { Truck, RotateCcw, Shield, Star } from "lucide-react"

const Services = () => {
  return (
    <div className="px-4 lg:px-6 mt-4 lg:mt-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Free shipping */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
            <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
            <div>
              <p className="text-green-700 font-medium text-xs lg:text-sm">Free shipping</p>
              <p className="text-green-600 text-xs">Unlimited orders</p>
            </div>
          </div>

          {/* Free returns */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
            <div>
              <p className="text-blue-700 font-medium text-xs lg:text-sm">Free returns</p>
              <p className="text-blue-600 text-xs">Up to 90 days*</p>
            </div>
          </div>

          {/* Secure payment */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
            <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
            <div>
              <p className="text-purple-700 font-medium text-xs lg:text-sm">Secure payment</p>
              <p className="text-purple-600 text-xs">100% protected</p>
            </div>
          </div>

          {/* Top quality */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 lg:p-4 flex items-center gap-2">
            <Star className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />
            <div>
              <p className="text-orange-700 font-medium text-xs lg:text-sm">Top quality</p>
              <p className="text-orange-600 text-xs">Premium products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services
