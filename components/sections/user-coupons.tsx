"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Copy, Tag, Calendar, Percent, IndianRupee, MinusCircle, AlertCircle, Gift, Zap, Sparkles } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string;
  discount_type: "flat" | "percentage";
  discount_value: string;
  minimum_purchase_aed?: string;
  minimum_purchase_inr?: string;
  maximum_discount?: string | null;
  is_active: boolean;
  is_redeemed: boolean;
  redeemed_at?: string | null;
  user_type_restriction: string;
  valid_from: string;
  valid_to: string;
}

export default function UserCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/user/coupons", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load coupons");
        }

        const data = await res.json();
        
        // Filter only non-redeemed coupons
        const activeCoupons = data.filter((coupon: Coupon) => !coupon.is_redeemed);
        setCoupons(activeCoupons);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Using simple alert instead of toast for compatibility
    alert(`Copied: ${code}`);
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (coupon: Coupon) => {
    if (!mounted) return "from-muted to-muted";
    
    const expired = new Date(coupon.valid_to) < new Date();
    const isActive = coupon.is_active && !expired;

    if (!isActive || expired) return "from-muted to-muted";
    
    return "from-foreground to-foreground";
  };

  const getDiscountIcon = (discountType: string) => {
    return discountType === "percentage" ? 
      <Percent className="w-5 h-5" /> : 
      <IndianRupee className="w-5 h-5" />;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    } else {
      return (
        <>
          <IndianRupee className="inline w-4 h-4 mr-1" />
          {coupon.discount_value} OFF
        </>
      );
    }
  };

  const getMinimumPurchase = (coupon: Coupon) => {
    if (coupon.minimum_purchase_inr) {
      return `₹${coupon.minimum_purchase_inr}`;
    } else if (coupon.minimum_purchase_aed) {
      return `${coupon.minimum_purchase_aed} AED`;
    }
    return null;
  };

  const calculateTimeLeft = (validTo: string) => {
    if (!mounted) return "Loading...";
    
    const now = new Date();
    const expiry = new Date(validTo);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    
    return `${hours}h ${minutes}m left`;
  };

  const getUrgencyLevel = (validTo: string) => {
    if (!mounted) return "normal";
    
    const now = new Date();
    const expiry = new Date(validTo);
    const diff = expiry.getTime() - now.getTime();
    const hoursLeft = diff / (1000 * 60 * 60);
    
    if (hoursLeft < 0) return "expired";
    if (hoursLeft < 24) return "urgent";
    if (hoursLeft < 72) return "warning";
    return "normal";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin">
            <Loader2 className="w-12 h-12 text-foreground mx-auto mb-4" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your exclusive offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center max-w-md p-6 border border-border bg-background">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const activeCoupons = mounted ? coupons.filter(c => c.is_active && new Date(c.valid_to) >= new Date()) : [];
  const expiredCoupons = mounted ? coupons.filter(c => new Date(c.valid_to) < new Date()) : [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-foreground" />
          <h1 className="text-3xl font-bold text-foreground">Exclusive Offers & Coupons</h1>
          <Sparkles className="w-8 h-8 text-foreground" />
        </div>
        <p className="text-muted-foreground">
          You have <span className="font-bold text-foreground">{activeCoupons.length} active offers</span> waiting for you!
        </p>
      </div>

      {/* Active Coupons Section */}
      {activeCoupons.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Active Offers</h2>
            <span className="px-3 py-1 bg-muted text-foreground text-sm font-semibold">
              {activeCoupons.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCoupons.map((coupon, index) => {
              const timeLeft = calculateTimeLeft(coupon.valid_to);
              const urgencyLevel = getUrgencyLevel(coupon.valid_to);
              const minPurchase = getMinimumPurchase(coupon);

              return (
                <div
                  key={coupon.id}
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`
                  }}
                  className="relative group"
                >
                  {/* Scissor Cut Lines */}
                  <div className="absolute top-1/2 -left-2 w-4 h-10 bg-background border border-dashed border-border -translate-y-1/2 z-10"></div>
                  <div className="absolute top-1/2 -right-2 w-4 h-10 bg-background border border-dashed border-border -translate-y-1/2 z-10"></div>

                  {/* Urgency Badge */}
                  {urgencyLevel === "urgent" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-foreground text-background text-sm font-bold z-20 animate-pulse">
                      ⚡ Expires Soon!
                    </div>
                  )}

                  <div className={`
                    relative overflow-hidden border border-border 
                    shadow-sm hover:shadow-md transition-all duration-300
                    h-full bg-background
                    hover:-translate-y-1
                  `}>
                    {/* Gradient Header */}
                    <div className={`p-5 bg-gradient-to-r ${getStatusColor(coupon)} text-background relative overflow-hidden`}>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10">
                              {getDiscountIcon(coupon.discount_type)}
                            </div>
                            <div>
                              <span className="text-sm font-medium bg-white/20 px-3 py-1">
                                {coupon.discount_type === "percentage" ? "PERCENTAGE" : "FLAT DISCOUNT"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 text-xs font-bold ${
                              urgencyLevel === "urgent" ? "bg-white/20" :
                              urgencyLevel === "warning" ? "bg-white/20" : "bg-white/10"
                            }`}>
                              {timeLeft}
                            </div>
                          </div>
                        </div>

                        <h2 className="text-2xl font-bold mb-2">{coupon.title}</h2>
                        <p className="text-white/90 text-sm">{coupon.description}</p>
                      </div>
                    </div>

                    {/* Coupon Body */}
                    <div className="p-6">
                      {/* Coupon Code Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between bg-muted p-4 border border-border">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-foreground flex items-center justify-center shadow-sm">
                              <Tag className="w-5 h-5 text-background" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">COUPON CODE</p>
                              <p className="text-2xl font-mono font-bold tracking-wider text-foreground">
                                {coupon.code}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-3 bg-foreground text-background hover:bg-foreground/90 transition-all group"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Discount Value */}
                      <div className="mb-6 text-center">
                        <div className="inline-block px-6 py-4 bg-muted border border-border">
                          <div className="text-4xl font-bold text-foreground mb-2">
                            {getDiscountDisplay(coupon)}
                          </div>
                          {coupon.maximum_discount && (
                            <p className="text-sm text-muted-foreground">
                              Max discount: ₹{coupon.maximum_discount}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="space-y-3 border-t border-border pt-4">
                        {minPurchase && (
                          <div className="flex items-center text-sm">
                            <MinusCircle className="w-4 h-4 mr-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Min. purchase: <span className="font-semibold text-foreground">{minPurchase}</span>
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-3 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div className="text-muted-foreground">
                              Valid from: <span className="font-semibold text-foreground">{formatDate(coupon.valid_from)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Valid till: <span className="font-semibold text-foreground">{formatDate(coupon.valid_to)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-8">
                        <button
                          onClick={() => {
                            copyToClipboard(coupon.code);
                            alert(`🎉 Coupon ${coupon.code} copied! Apply it at checkout.`);
                          }}
                          className="w-full py-4 bg-foreground text-background font-bold text-lg hover:bg-foreground/90 transition-all shadow-sm"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Copy className="w-5 h-5" />
                            Copy & Use Now
                          </span>
                        </button>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          Copy code and apply at checkout
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired Coupons Section */}
      {expiredCoupons.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <XCircle className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-xl font-bold text-muted-foreground">Expired Offers</h2>
            <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold">
              {expiredCoupons.length} Expired
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-4 bg-muted border border-border opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-muted-foreground line-through">{coupon.title}</h3>
                    <p className="text-sm text-muted-foreground">{coupon.code}</p>
                  </div>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Expired on {formatDate(coupon.valid_to)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeCoupons.length === 0 && expiredCoupons.length === 0 && mounted && (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center max-w-md p-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted flex items-center justify-center">
              <Gift className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No Active Coupons</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any active coupons right now. Check back soon for exciting offers!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = "/shop"}
                className="px-6 py-3 bg-foreground text-background font-semibold transition-all"
              >
                Browse Products
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-border text-foreground font-semibold hover:bg-muted transition-all"
              >
                Refresh Offers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {coupons.length > 0 && mounted && (
        <div className="mt-12 p-6 bg-background border border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-foreground mb-2">{activeCoupons.length}</div>
              <p className="text-muted-foreground font-medium">Active Coupons</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-foreground mb-2">
                {coupons.filter(c => c.is_active && !c.is_redeemed).length}
              </div>
              <p className="text-muted-foreground font-medium">Available</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-muted-foreground mb-2">{expiredCoupons.length}</div>
              <p className="text-muted-foreground font-medium">Expired</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-foreground mb-2">
                {activeCoupons.filter(c => getUrgencyLevel(c.valid_to) === "urgent").length}
              </div>
              <p className="text-muted-foreground font-medium">Expiring Soon</p>
            </div>
          </div>
        </div>
      )}



      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
