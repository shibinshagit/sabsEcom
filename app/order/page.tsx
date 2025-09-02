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
  recalculateTotal,
  removeInvalidCurrencyItems,
} from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import Navbar from "@/components/ui/navbar"
import LoginModal from "@/components/auth/login-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { fetchCartFromAPI, saveCartToAPI } from '@/lib/store/slices/orderSlice'

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const { selectedCurrency, formatPrice: formatCurrencyPrice } = useCurrency()
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isCouponFieldOpen, setIsCouponFieldOpen] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState("upi")

  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Razorpay states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const hasSelectedCurrencyPrice = (item: any) => {
    if (selectedCurrency === 'AED' && item.price_aed && item.price_aed > 0) {
      return true
    } else if (selectedCurrency === 'INR' && item.price_inr && item.price_inr > 0) {
      return true
    }
    return false
  }

  const getCurrencySpecificPrice = (item: any) => {
    if (selectedCurrency === 'AED' && item.price_aed && item.price_aed > 0) {
      return item.price_aed
    } else if (selectedCurrency === 'INR' && item.price_inr && item.price_inr > 0) {
      return item.price_inr
    }
    return null
  }

  const validCartItems = cart.filter(item => hasSelectedCurrencyPrice(item.menuItem))
  const invalidCartItems = cart.filter(item => !hasSelectedCurrencyPrice(item.menuItem))

  const calculateCartTotal = () => {
    return validCartItems.reduce((sum, item) => {
      const price = getCurrencySpecificPrice(item.menuItem)
      return sum + (price || 0) * item.quantity
    }, 0)
  }

  useEffect(() => {
    if (cart.length > 0) {
      dispatch(recalculateTotal(selectedCurrency))
    }
  }, [selectedCurrency, dispatch])

  useEffect(() => {
    if (invalidCartItems.length > 0) {
      console.warn(`${invalidCartItems.length} items don't have ${selectedCurrency} pricing`)
    }
  }, [selectedCurrency, invalidCartItems.length])

  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const couponData: CouponData = JSON.parse(savedCoupon)
        if (new Date(couponData.expiresAt) > new Date()) {
          setAppliedCoupon(couponData)
          setCouponCode(couponData.code)
          calculateDiscount(couponData, calculateCartTotal())
        } else {
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
      discount = Math.min(parseFloat(coupon.discount), subtotal)
    } else if (coupon.type === "percentage") {
      discount = (subtotal * parseFloat(coupon.discount)) / 100
    }
    setDiscountAmount(discount)
  }

  const validateCouponCode = (code: string): CouponData | null => {
    const pendingOffer = localStorage.getItem("pendingOffer")
    const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")

    if (pendingOffer) {
      try {
        const offerData: CouponData = JSON.parse(pendingOffer)
        if (offerData.code !== code) {
          return null
        }
        if (usedCoupons.includes(code)) {
          return null
        }
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      const validCoupon = validateCouponCode(couponCode.trim())

      if (!validCoupon) {
        setCouponError("Invalid or expired coupon code")
        setIsApplyingCoupon(false)
        return
      }

      setAppliedCoupon(validCoupon)
      calculateDiscount(validCoupon, calculateCartTotal())
      localStorage.setItem("appliedCoupon", JSON.stringify(validCoupon))
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

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart({
        id,
        userId: user?.id
      }))
    } else {
      dispatch(updateQuantity({
        id,
        quantity: newQuantity,
        userId: user?.id
      }))
    }

    // Save to database after change
    if (isAuthenticated && user?.id) {
      setTimeout(() => {
        dispatch(saveCartToAPI({
          userId: user.id.toString(),
          cart: validCartItems,
          selectedCurrency
        }))
      }, 500)
    }
  }

  const handleRemoveInvalidItems = async () => {
    dispatch(removeInvalidCurrencyItems({
      selectedCurrency,
      userId: user?.id
    }))

    // Save to database after removal
    if (isAuthenticated && user?.id) {
      setTimeout(() => {
        dispatch(saveCartToAPI({
          userId: user.id.toString(),
          cart: validCartItems.filter(item => hasSelectedCurrencyPrice(item.menuItem)),
          selectedCurrency
        }))
      }, 500)
    }
  }

  const clearCartAfterOrder = async () => {
    try {
      dispatch(clearCart({ userId: user?.id }))

      if (isAuthenticated && user?.id) {
        await dispatch(saveCartToAPI({
          userId: user.id.toString(),
          cart: [],
          selectedCurrency
        })).unwrap()
      }

      // Clear coupon data
      if (appliedCoupon) {
        const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")
        usedCoupons.push(appliedCoupon.code)
        localStorage.setItem("usedCoupons", JSON.stringify(usedCoupons))
        localStorage.removeItem("pendingOffer")
        localStorage.removeItem("appliedCoupon")
      }

      console.log("Cart cleared successfully")
    } catch (error) {
      console.error("Error clearing cart:", error)
    }
  }
  const submitOrderAfterPayment = async (paymentId?: string) => {
    const cartTotal = calculateCartTotal()
    const finalTotal = cartTotal + deliveryFee - discountAmount

    const orderData = {
      customerName: user?.name || customerInfo.name,
      customerEmail: user?.email || customerInfo.email,
      customerPhone: customerInfo.phone,
      orderType,
      paymentMethod,
      paymentId: paymentId,
      tableNumber: customerInfo.tableNumber,
      deliveryAddress: customerInfo.deliveryAddress,
      totalAmount: finalTotal,
      originalAmount: cartTotal + deliveryFee,
      discountAmount: discountAmount,
      couponCode: appliedCoupon?.code,
      specialInstructions,
      userId: user?.id,
      currency: selectedCurrency,
      items: validCartItems.map((item) => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: getCurrencySpecificPrice(item.menuItem)?.toString() || "0",
        specialRequests: item.specialRequests,
      })),
    }

    try {
      console.log("Submitting order:", orderData)
      const result = await dispatch(submitOrder(orderData)).unwrap()

      console.log("Order submitted successfully:", result)

      await clearCartAfterOrder()

      alert(`Order placed successfully! Order ID: ${result.orderId}`)

      router.push("/orders")
    } catch (error) {
      console.error("Failed to submit order:", error)

      let errorMessage = "Failed to place order. Please try again."
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message
      }

      alert(errorMessage)
      throw error
    }
  }

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (validCartItems.length === 0) {
      alert(`No items available for ${selectedCurrency} currency. Please add items or switch currency.`)
      return
    }

    const cartTotal = calculateCartTotal()
    const finalTotal = cartTotal + deliveryFee - discountAmount

    if (paymentMethod === "upi") {
      try {
        setIsProcessingPayment(true)

        // Create Razorpay order
        const razorpayResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            currency: selectedCurrency,
            receipt: `order_${Date.now()}`
          }),
        })

        if (!razorpayResponse.ok) {
          throw new Error('Failed to create payment order')
        }

        const razorpayOrderResult = await razorpayResponse.json()

        // Configure Razorpay options
        const options = {
          key: razorpayOrderResult.key,
          amount: razorpayOrderResult.amount,
          currency: razorpayOrderResult.currency,
          name: "SABS online store",
          description: "Order Payment",
          order_id: razorpayOrderResult.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verificationResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })

              if (!verificationResponse.ok) {
                throw new Error('Payment verification failed')
              }

              const verificationResult = await verificationResponse.json()

              if (verificationResult.success) {
                // Payment successful, now submit the order
                await submitOrderAfterPayment(verificationResult.paymentId)
              }
            } catch (error) {
              console.error("Payment verification failed:", error)
              alert("Payment verification failed. Please try again.")
            } finally {
              setIsProcessingPayment(false)
            }
          },
          prefill: {
            name: user?.name || customerInfo.name,
            email: user?.email || customerInfo.email,
            contact: customerInfo.phone,
          },
          theme: {
            color: "#F59E0B",
          },
          modal: {
            ondismiss: () => {
              console.log("Payment cancelled by user")
              setIsProcessingPayment(false)
            }
          }
        }

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options)
        razorpay.open()

      } catch (error) {
        console.error("Failed to create payment order:", error)
        alert("Failed to initiate payment. Please try again.")
        setIsProcessingPayment(false)
      }
    } else {
      // Cash on delivery - use existing flow
      await submitOrderAfterPayment()
    }
  }

  const handleWhatsAppOrder = () => {
    if (validCartItems.length === 0) {
      alert(`No items available for ${selectedCurrency} currency. Please add items or switch currency.`)
      return
    }

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
    message += `💳 *Payment Method:* ${paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}\n`
    message += `💰 *Currency:* ${selectedCurrency}\n`

    if (orderType === "delivery" && customerInfo.deliveryAddress) {
      message += `📍 *Delivery Address:* ${customerInfo.deliveryAddress}\n`
    }

    message += `\n🛒 *Order Items:*\n`
    validCartItems.forEach((item, index) => {
      const itemPrice = getCurrencySpecificPrice(item.menuItem)
      message += `${index + 1}. ${item.menuItem.name} x${item.quantity} - ${formatCurrencyPrice(itemPrice, itemPrice, selectedCurrency)}\n`
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

    const phoneNumber = "+1234567890"
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
            <Button onClick={() => router.push("/products")} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 text-sm sm:text-base">
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

        {invalidCartItems.length > 0 && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 mb-2">
                      Currency Availability Notice
                    </h3>
                    <p className="text-sm text-orange-700 mb-3">
                      {invalidCartItems.length} item(s) in your cart don't have {selectedCurrency} pricing and cannot be purchased in this currency.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {invalidCartItems.map((item) => (
                        <span key={item.menuItem.id} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          {item.menuItem.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleRemoveInvalidItems}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        Remove These Items
                      </Button>
                      <Button
                        onClick={() => router.push("/products")}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        Browse More Products
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 space-y-6">
            {validCartItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Available Items ({selectedCurrency})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validCartItems.map((item) => {
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
                            {formatCurrencyPrice(itemPrice, itemPrice, selectedCurrency)}
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
                            onClick={() => dispatch(removeFromCart({
                              id: item.menuItem.id,
                              userId: user?.id
                            }))}
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
            )}

            {invalidCartItems.length > 0 && (
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-gray-500">
                    Unavailable in {selectedCurrency}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invalidCartItems.map((item) => (
                    <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-gray-50">
                      <Image
                        src={
                          item.menuItem.image_url ||
                          `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.menuItem.name) || "/placeholder.svg"}`
                        }
                        alt={item.menuItem.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover w-20 h-20 sm:w-24 sm:h-24 grayscale"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-600">{item.menuItem.name}</h3>
                        <p className="text-gray-500 text-sm">
                          Not available in {selectedCurrency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">Qty: {item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch(removeFromCart({
                            id: item.menuItem.id,
                            userId: user?.id
                          }))}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payment Method Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="text-sm sm:text-base cursor-pointer">UPI Payment</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="text-sm sm:text-base cursor-pointer">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

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
                      onChange={(e) => dispatch(setCustomerInfo({
                        info: { name: e.target.value },
                        userId: user?.id
                      }))}
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
                      onChange={(e) => dispatch(setCustomerInfo({
                        info: { phone: e.target.value },
                        userId: user?.id
                      }))}
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
                    onChange={(e) => dispatch(setCustomerInfo({
                      info: { email: e.target.value },
                      userId: user?.id
                    }))}
                    disabled={!!user?.email}
                    className="text-sm sm:text-base"
                  />
                </div>

                {orderType === "delivery" && (
                  <div>
                    <Label htmlFor="address" className="text-sm sm:text-base">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      value={customerInfo.deliveryAddress || ""}
                      onChange={(e) => dispatch(setCustomerInfo({
                        info: { deliveryAddress: e.target.value },
                        userId: user?.id
                      }))}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="instructions" className="text-sm sm:text-base">Your Address</Label>
                  <Textarea
                    id="instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Full Address"
                    className="text-sm sm:text-base"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-80 xl:w-96">
            <Card className="sticky top-4 sm:top-6">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Order Summary ({selectedCurrency})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validCartItems.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {validCartItems.map((item) => {
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

                      {paymentMethod === "cod" ? (
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={loading || isProcessingPayment || (!isAuthenticated && !customerInfo.name) || !customerInfo.phone || validCartItems.length === 0}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black text-sm sm:text-base py-2 sm:py-3"
                        >
                          {loading ? "Processing..." : isAuthenticated ? "Place Order" : "Login to Place Order"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={loading || isProcessingPayment || (!isAuthenticated && !customerInfo.name) || !customerInfo.phone || validCartItems.length === 0}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black text-sm sm:text-base py-2 sm:py-3"
                        >
                          {isProcessingPayment ? "Processing Payment..." :
                            loading ? "Processing..." :
                              isAuthenticated ? `Pay ${formatCurrencyPrice(finalTotal, finalTotal, selectedCurrency)}` : "Login to Pay"}
                        </Button>
                      )}

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
                        disabled={!customerInfo.name || !customerInfo.phone || validCartItems.length === 0}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Order via WhatsApp
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => dispatch(clearCart({ userId: user?.id }))}
                        className="w-full text-sm sm:text-base py-2 sm:py-3"
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No items available in {selectedCurrency}</p>
                    <Button
                      onClick={() => router.push("/products")}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      Browse Products
                    </Button>
                  </div>
                )}
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
