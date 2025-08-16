
"use client";

import React, { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpinnerWheel from "@/components/ui/offer-spinner";

const NewUserSpinnerSection: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false);

  const shouldShowSpinButton = true;
  const isAuthenticated = false;

  return (
    <div>
      {shouldShowSpinButton && !showSpinner && (
        <div className="px-4 lg:px-6 mt-4 lg:mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-2xl p-6 lg:p-8 text-center relative overflow-hidden shadow-xl border-4 border-white">
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                  <h3 className="text-white font-bold text-xl lg:text-3xl">
                    New User Gift!
                  </h3>
                  <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
                </div>
                <p className="text-white text-lg lg:text-2xl font-bold mb-1">
                  Spin to get $200
                </p>
                <p className="text-white/90 text-sm lg:text-base mb-6">
                  Coupon bundle waiting for you!
                </p>
                <Button
                  onClick={() => setShowSpinner(true)}
                  className="bg-white text-orange-600 hover:bg-gray-100 px-8 lg:px-16 py-4 lg:py-6 rounded-full font-bold text-lg lg:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 border-orange-200"
                >
                  🎯 SPIN NOW!
                </Button>
                <p className="text-white/80 text-xs lg:text-sm mt-3">
                  Get up to 100% OFF on your first order!
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
  );
};

export default NewUserSpinnerSection;
