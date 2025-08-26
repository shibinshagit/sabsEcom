"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import {
  removeFromCart,
  updateQuantity,
  setOrderType,
  setCustomerInfo,
  submitOrder,
  clearCart,
  recalculateTotal, // Add this import
} from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCurrency } from "@/lib/contexts/currency-context" // Add this import
import Navbar from "@/components/ui/navbar"
import LoginModal from "@/components/auth/login-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface CouponData {
  code: string
  discount: string
  type: string 
  title: string
  offerTitle: string
  offerId: number
  timestamp: number
  expiresAt: string
}

export default function OrderPage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { cart, total, orderType, customerInfo, loading } = useSelector((state: RootState) => state.order)
  const { formatPrice } = useSettings()
  const { isAuthenticated, user } = useAuth()
  const { selectedCurrency, formatPrice: formatCurrencyPrice } = useCurrency() // Add this line
  
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isCouponFieldOpen, setIsCouponFieldOpen] = useState(false)
  
  // New coupon functionality states
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Helper function to get currency-specific price for an item
  const getCurrencySpecificPrice = (item: any) => {
    if (selectedCurrency === 'AED' && item.price_aed) {
      return item.price_aed
    } else if (selectedCurrency === 'INR' && item.price_inr) {
      return item.price_inr
    }
    return item.price // fallback
  }

  // Helper function to calculate cart total with selected currency
  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = getCurrencySpecificPrice(item.menuItem)
      return sum + price * item.quantity
    }, 0)
  }

  // Recalculate total when currency changes
  useEffect(() => {
    if (cart.length > 0) {
      dispatch(recalculateTotal(selectedCurrency))
    }
  }, [selectedCurrency, dispatch])

  // Load saved coupon data on component mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const couponData: CouponData = JSON.parse(savedCoupon)
        // Check if coupon is still valid
        if (new Date(couponData.expiresAt) > new Date()) {
          setAppliedCoupon(couponData)
          setCouponCode(couponData.code)
          calculateDiscount(couponData, calculateCartTotal())
        } else {
          // Remove expired coupon
          localStorage.removeItem("appliedCoupon")
        }
      } catch (error) {
        console.error("Error loading saved coupon:", error)
        localStorage.removeItem("appliedCoupon")
      }
    }
  }, [])

  // Recalculate discount when total changes
  useEffect(() => {
    if (appliedCoupon) {
      calculateDiscount(appliedCoupon, calculateCartTotal())
    }
  }, [total, appliedCoupon, selectedCurrency])

  const calculateDiscount = (coupon: CouponData, subtotal: number) => {
    let discount = 0
    if (coupon.type === "cash") {
      discount = Math.min(parseFloat(coupon.discount), subtotal) // Don't exceed subtotal
    } else if (coupon.type === "percentage") {
      discount = (subtotal * parseFloat(coupon.discount)) / 100
    }
    setDiscountAmount(discount)
  }

  const validateCouponCode = (code: string): CouponData | null => {
    // Check localStorage for saved offers from spin wheel
    const pendingOffer = localStorage.getItem("pendingOffer")
    const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")
    
    if (pendingOffer) {
      try {
        const offerData: CouponData = JSON.parse(pendingOffer)
        
        // Check if code matches
        if (offerData.code !== code) {
          return null
        }
        
        // Check if already used
        if (usedCoupons.includes(code)) {
          return null
        }
        
        // Check expiration
        if (new Date(offerData.expiresAt) <= new Date()) {
          return null
        }
        
        return offerData
      } catch (error) {
        console.error("Error validating coupon:", error)
      }
    }
    
    return null
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setIsApplyingCoupon(true)
    setCouponError("")

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const validCoupon = validateCouponCode(couponCode.trim())
      
      if (!validCoupon) {
        setCouponError("Invalid or expired coupon code")
        setIsApplyingCoupon(false)
        return
      }

      // Apply the coupon
      setAppliedCoupon(validCoupon)
      calculateDiscount(validCoupon, calculateCartTotal())
      
      // Save to localStorage for persistence
      localStorage.setItem("appliedCoupon", JSON.stringify(validCoupon))
      
      // Success message
      setCouponError("")
      
    } catch (error) {
      console.error("Error applying coupon:", error)
      setCouponError("Failed to apply coupon. Please try again.")
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponCode("")
    setCouponError("")
    localStorage.removeItem("appliedCoupon")
  }

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(id))
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity }))
    }
  }

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (cart.length === 0) return

    const cartTotal = calculateCartTotal()
    const finalTotal = cartTotal + deliveryFee - discountAmount

    const orderData = {
      customerName: user?.name || customerInfo.name,
      customerEmail: user?.email || customerInfo.email,
      customerPhone: customerInfo.phone,
      orderType,
      tableNumber: customerInfo.tableNumber,
      deliveryAddress: customerInfo.deliveryAddress,
      totalAmount: finalTotal,
      originalAmount: cartTotal + deliveryFee,
      discountAmount: discountAmount,
      couponCode: appliedCoupon?.code,
      specialInstructions,
      userId: user?.id,
      currency: selectedCurrency, // Add currency to order data
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: getCurrencySpecificPrice(item.menuItem), // Use currency-specific price
        specialRequests: item.specialRequests,
      })),
    }

    try {
      const result = await dispatch(submitOrder(orderData)).unwrap()
      
      // Mark coupon as used
      if (appliedCoupon) {
        const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")
        usedCoupons.push(appliedCoupon.code)
        localStorage.setItem("usedCoupons", JSON.stringify(usedCoupons))
        localStorage.removeItem("pendingOffer")
        localStorage.removeItem("appliedCoupon")
      }
      
      alert(`Order placed successfully! Order ID: ${result.orderId}`)
      router.push("/dashboard/orders")
    } catch (error) {
      console.error("Failed to submit order:", error)
      alert("Failed to place order. Please try again.")
    }
  }

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return

    const customerName = user?.name || customerInfo.name || "Customer"
    const customerPhone = customerInfo.phone || "Not provided"
    const customerEmail = user?.email || customerInfo.email || "Not provided"
    const cartTotal = calculateCartTotal()

    let message = `🍽️ *New Order Request*\n\n`
    message += `👤 *Customer Details:*\n`
    message += `Name: ${customerName}\n`
    message += `Phone: ${customerPhone}\n`
    message += `Email: ${customerEmail}\n\n`

    message += `📋 *Order Type:* ${orderType.charAt(0).toUpperCase() + orderType.slice(1)}\n`
    message += `💰 *Currency:* ${selectedCurrency}\n`

    if (orderType === "dine-in" && customerInfo.tableNumber) {
      message += `🪑 *Table Number:* ${customerInfo.tableNumber}\n`
    }

    if (orderType === "delivery" && customerInfo.deliveryAddress) {
      message += `📍 *Delivery Address:* ${customerInfo.deliveryAddress}\n`
    }

    message += `\n🛒 *Order Items:*\n`
    cart.forEach((item, index) => {
      const itemPrice = getCurrencySpecificPrice(item.menuItem)
      message += `${index + 1}. ${item.menuItem.name} x${item.quantity} - ${formatCurrencyPrice(item.menuItem.price_aed, item.menuItem.price_inr, item.menuItem.default_currency)}\n`
    })

    const finalTotal = cartTotal + deliveryFee - discountAmount

    message += `\n💰 *Order Summary:*\n`
    message += `Subtotal: ${formatCurrencyPrice(cartTotal, cartTotal, selectedCurrency)}\n`
    if (deliveryFee > 0) {
      message += `Delivery Fee: ${formatCurrencyPrice(deliveryFee, deliveryFee, selectedCurrency)}\n`
    }
    if (discountAmount > 0) {
      message += `Discount (${appliedCoupon?.code}): -${formatCurrencyPrice(discountAmount, discountAmount, selectedCurrency)}\n`
    }
    message += `*Total: ${formatCurrencyPrice(finalTotal, finalTotal, selectedCurrency)}*\n`

    if (specialInstructions) {
      message += `\n📝 *Special Instructions:*\n${specialInstructions}\n`
    }

    message += `\nPlease confirm this order and let me know the estimated preparation time. Thank you! 🙏`

    const phoneNumber = "+1234567890" // Replace with actual restaurant WhatsApp number
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    window.open(whatsappUrl, "_blank")
  }

  const deliveryFee = orderType === "delivery" ? 3.99 : 0
  const cartTotal = calculateCartTotal()
  const subtotalWithDelivery = cartTotal + deliveryFee
  const finalTotal = subtotalWithDelivery - discountAmount

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Add some items from our products to get started!</p>
            <Button onClick={() => router.push("/menu")} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 text-sm sm:text-base">
              BUY NOW!
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Order</h1>
          <div className="text-sm text-gray-500">
            Currency: <span className="font-semibold text-gray-700">{selectedCurrency}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Cart Items and Customer Info */}
          <div className="flex-1 space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => {
                  const itemPrice = getCurrencySpecificPrice(item.menuItem)
                  return (
                    <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                      <Image
                        src={
                          item.menuItem.image_url ||
                          `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.menuItem.name) || "/placeholder.svg"}`
                        }
                        alt={item.menuItem.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover w-20 h-20 sm:w-24 sm:h-24"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg">{item.menuItem.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {formatCurrencyPrice(item.menuItem.price_aed, item.menuItem.price_inr, item.menuItem.default_currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.menuItem.id, item.quantity - 1)}
                          className="p-2"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.menuItem.id, item.quantity + 1)}
                          className="p-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-4">
                        <p className="font-semibold text-sm sm:text-base">
                          {formatCurrencyPrice(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch(removeFromCart(item.menuItem.id))}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Keep all other sections (Order Type, Customer Information) unchanged */}
            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={orderType} onValueChange={(value) => dispatch(setOrderType(value as any))} className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="dine-in" id="dine-in" />
                    <Label htmlFor="dine-in" className="text-sm sm:text-base">Dine In</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="takeaway" id="takeaway" />
                    <Label htmlFor="takeaway" className="text-sm sm:text-base">Takeaway</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="text-sm sm:text-base">Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer Information - Keep unchanged */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      Logged in as: <strong>{user?.name || user?.email}</strong>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base">Full Name *</Label>
                    <Input
                      id="name"
                      value={user?.name || customerInfo.name}
                      onChange={(e) => dispatch(setCustomerInfo({ name: e.target.value }))}
                      disabled={!!user?.name}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => dispatch(setCustomerInfo({ phone: e.target.value }))}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || customerInfo.email}
                    onChange={(e) => dispatch(setCustomerInfo({ email: e.target.value }))}
                    disabled={!!user?.email}
                    className="text-sm sm:text-base"
                  />
                </div>

                {orderType === "dine-in" && (
                  <div>
                    <Label htmlFor="table" className="text-sm sm:text-base">Table Number</Label>
                    <Input
                      id="table"
                      type="number"
                      value={customerInfo.tableNumber || ""}
                      onChange={(e) =>
                        dispatch(setCustomerInfo({ tableNumber: Number.parseInt(e.target.value) || undefined }))
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>
                )}

                {orderType === "delivery" && (
                  <div>
                    <Label htmlFor="address" className="text-sm sm:text-base">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      value={customerInfo.deliveryAddress || ""}
                      onChange={(e) => dispatch(setCustomerInfo({ deliveryAddress: e.target.value }))}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="instructions" className="text-sm sm:text-base">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or dietary requirements..."
                    className="text-sm sm:text-base"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Updated with currency formatting */}
          <div className="w-full lg:w-80 xl:w-96">
            <Card className="sticky top-4 sm:top-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Order Summary ({selectedCurrency})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => {
                    const itemPrice = getCurrencySpecificPrice(item.menuItem)
                    return (
                      <div key={item.menuItem.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <span>{formatCurrencyPrice(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency)}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrencyPrice(cartTotal, cartTotal, selectedCurrency)}</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>{formatCurrencyPrice(deliveryFee, deliveryFee, selectedCurrency)}</span>
                    </div>
                  )}
                  
                  {/* Show discount if applied */}
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Discount ({appliedCoupon.code})
                        <span className="text-xs text-gray-500 block">
                          {appliedCoupon.type === 'cash' ? `${appliedCoupon.discount} ${selectedCurrency} off` : `${appliedCoupon.discount}% off`}
                        </span>
                      </span>
                      <span>-{formatCurrencyPrice(discountAmount, discountAmount, selectedCurrency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                    <span>Total</span>
                    <div className="text-right">
                      {appliedCoupon && discountAmount > 0 && (
                        <div className="text-xs sm:text-sm text-gray-500 line-through">
                          {formatCurrencyPrice(subtotalWithDelivery, subtotalWithDelivery, selectedCurrency)}
                        </div>
                      )}
                      <div>{formatCurrencyPrice(finalTotal, finalTotal, selectedCurrency)}</div>
                    </div>
                  </div>

                  {/* Coupon Section - Keep unchanged */}
                  <div className="mt-4">
                    {!appliedCoupon ? (
                      <>
                        <Button
                          onClick={() => setIsCouponFieldOpen(!isCouponFieldOpen)}
                          variant="outline"
                          className="w-full text-amber-600 border-amber-500 hover:bg-amber-50 text-sm sm:text-base"
                        >
                          {isCouponFieldOpen ? "Only For New Users" : "Redeem Offer"}
                        </Button>
                        {isCouponFieldOpen && (
                          <div className="mt-2 space-y-2">
                            <Label htmlFor="coupon" className="text-sm sm:text-base">Enter New User Offer Coupon Here</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="coupon"
                                value={couponCode}
                                onChange={(e) => {
                                  setCouponCode(e.target.value)
                                  setCouponError("")
                                }}
                                placeholder="Enter coupon code"
                                className={`text-sm sm:text-base ${couponError ? "border-red-500" : ""}`}
                              />
                              <Button
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || isApplyingCoupon}
                                className="bg-amber-500 hover:bg-amber-600 text-black text-sm sm:text-base px-3 sm:px-4"
                              >
                                {isApplyingCoupon ? "Applying..." : "Apply"}
                              </Button>
                            </div>
                            {couponError && (
                              <div className="flex items-center gap-1 text-red-500 text-xs sm:text-sm">
                                <XCircle className="w-4 h-4" />
                                <span>{couponError}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="font-medium text-green-800 text-sm sm:text-base">Coupon Applied!</div>
                              <div className="text-xs sm:text-sm text-green-600">
                                {appliedCoupon.code} - {appliedCoupon.title}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={handleRemoveCoupon}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={loading || (!isAuthenticated && !customerInfo.name) || !customerInfo.phone}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black text-sm sm:text-base py-2 sm:py-3"
                >
                  {loading ? "Processing..." : isAuthenticated ? "Place Order" : "Login to Place Order"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleWhatsAppOrder}
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent text-sm sm:text-base py-2 sm:py-3"
                  disabled={!customerInfo.name || !customerInfo.phone}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Order via WhatsApp
                </Button>

                <Button variant="outline" onClick={() => dispatch(clearCart())} className="w-full text-sm sm:text-base py-2 sm:py-3">
                  Clear Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login"
        description="Please login to continue with us."
      />
    </div>
  )
}
