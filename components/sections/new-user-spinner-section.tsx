// "use client";

// import React, { useState } from "react";
// import { Gift } from "lucide-react";
// import { Button } from "@/components/ui/button";

// const NewUserSpinnerSection: React.FC = () => {
//   const [showSpinner, setShowSpinner] = useState(false);

//   // For demo purposes — replace this with your real logic
//   const shouldShowSpinButton = true;

//   return (
//     <div>
//       {shouldShowSpinButton && (
//         <div className="px-4 lg:px-6 mt-4 lg:mt-6">
//           <div className="max-w-7xl mx-auto">
//             <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-2xl p-6 lg:p-8 text-center relative overflow-hidden shadow-xl border-4 border-white">
//               <div className="relative z-10">
//                 <div className="flex items-center justify-center gap-2 mb-2">
//                   <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
//                   <h3 className="text-white font-bold text-xl lg:text-3xl">
//                     New User Gift!
//                   </h3>
//                   <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white animate-bounce" />
//                 </div>
//                 <p className="text-white text-lg lg:text-2xl font-bold mb-1">
//                   Spin to get $200
//                 </p>
//                 <p className="text-white/90 text-sm lg:text-base mb-6">
//                   Coupon bundle waiting for you!
//                 </p>
//                 <Button
//                   onClick={() => setShowSpinner(true)}
//                   className="bg-white text-orange-600 hover:bg-gray-100 px-8 lg:px-16 py-4 lg:py-6 rounded-full font-bold text-lg lg:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 border-orange-200"
//                 >
//                   🎯 SPIN NOW!
//                 </Button>
//                 <p className="text-white/80 text-xs lg:text-sm mt-3">
//                   Get up to 100% OFF on your first order!
//                 </p>
//               </div>
//               <div className="absolute top-4 right-6 text-white/20 text-4xl lg:text-8xl animate-pulse">
//                 🎁
//               </div>
//               <div className="absolute bottom-4 left-6 text-white/20 text-3xl lg:text-6xl animate-bounce">
//                 ✨
//               </div>
//               <div className="absolute top-1/2 left-4 text-white/15 text-2xl lg:text-4xl animate-spin">
//                 🎪
//               </div>
//               <div className="absolute top-1/4 right-1/4 text-white/15 text-xl lg:text-3xl animate-pulse">
//                 💰
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showSpinner && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
//           {/* Placeholder for spinner popup */}
//           <div className="bg-white p-6 rounded-xl">
//             <p>🎡 Spinning wheel modal here...</p>
//             <Button onClick={() => setShowSpinner(false)} className="mt-4">
//               Close
//             </Button>
//           </div>
//         </div>
//       )}
      
//     </div>
//   );
// };

// export default NewUserSpinnerSection;

"use client";

import React, { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const NewUserSpinnerSection: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false);

  // Replace with your real logic
  const shouldShowSpinButton = true;
  const isAuthenticated = false; // or useSession(), or pass as prop

  return (
    <div>
      {shouldShowSpinButton && (
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
              <div className="absolute top-4 right-6 text-white/20 text-4xl lg:text-8xl animate-pulse">
                🎁
              </div>
              <div className="absolute bottom-4 left-6 text-white/20 text-3xl lg:text-6xl animate-bounce">
                ✨
              </div>
              <div className="absolute top-1/2 left-4 text-white/15 text-2xl lg:text-4xl animate-spin">
                🎪
              </div>
              <div className="absolute top-1/4 right-1/4 text-white/15 text-xl lg:text-3xl animate-pulse">
                💰
              </div>
            </div>
          </div>
        </div>
      )}

      {showSpinner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl">
            <p>🎡 Spinning wheel modal here...</p>
            <Button onClick={() => setShowSpinner(false)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}

      {!shouldShowSpinButton && !isAuthenticated && (
        <div className="px-4 lg:px-6 mt-6">
          <div className="max-w-7xl mx-auto text-center">
            <Button
              onClick={() => setShowSpinner(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 lg:px-12 py-3 lg:py-4 rounded-full font-bold text-base lg:text-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
            >
              🎯 Spin for Discount!
            </Button>
            <p className="text-sm lg:text-base text-gray-600 mt-2">
              Get up to 100% OFF on your first order!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUserSpinnerSection;
