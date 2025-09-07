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
  saveCartToAPI
} from "@/lib/store/slices/orderSlice"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCurrency } from "@/lib/contexts/currency-context"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import { useLoginModal } from '@/lib/stores/useLoginModal'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'

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
  const { isAuthenticated, user } = useAuth()
  const { selectedCurrency, formatPriceWithSmallDecimals } = useCurrency()
   const { openModal } = useLoginModal()
  const [specialInstructions, setSpecialInstructions] = useState("")
  
  const [couponCode, setCouponCode] = useState("")
  const [isCouponFieldOpen, setIsCouponFieldOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
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
    return selectedCurrency === 'AED' ? item.available_aed : item.available_inr
  }

  const getCurrencySpecificPrice = (item: any) => {
    if (selectedCurrency === 'AED' && item.available_aed) {
      return item.discount_aed > 0 ? item.discount_aed : item.price_aed || 0
    } else if (selectedCurrency === 'INR' && item.available_inr) {
      return item.discount_inr > 0 ? item.discount_inr : item.price_inr || 0
    }
    return 0
  }

  const validCartItems = cart.filter(item => hasSelectedCurrencyPrice(item.menuItem))
  const invalidCartItems = cart.filter(item => !hasSelectedCurrencyPrice(item.menuItem))

  const calculateCartTotal = () => {
    return validCartItems.reduce((sum, item) => {
      const price = getCurrencySpecificPrice(item.menuItem)
      return sum + price * item.quantity
    }, 0)
  }

  useEffect(() => {
    if (cart.length > 0) {
      dispatch(recalculateTotal(selectedCurrency))
    }
  }, [selectedCurrency, cart, dispatch])

  useEffect(() => {
    if (invalidCartItems.length > 0) {
      toast.error(`${invalidCartItems.length} item(s) are not available in ${selectedCurrency}`, {
        position: 'top-center'
      })
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
          toast.error('Coupon has expired', { position: 'top-center' })
        }
      } catch (error) {
        console.error("Error loading saved coupon:", error)
        localStorage.removeItem("appliedCoupon")
        toast.error('Failed to load saved coupon', { position: 'top-center' })
      }
    }
  }, [])

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
      toast.error('Please enter a coupon code', { position: 'top-center' })
      return
    }
    setIsApplyingCoupon(true)
    setCouponError("")
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const validCoupon = validateCouponCode(couponCode.trim())
      if (!validCoupon) {
        setCouponError("Invalid or expired coupon code")
        toast.error('Invalid or expired coupon code', { position: 'top-center' })
        setIsApplyingCoupon(false)
        return
      }
      setAppliedCoupon(validCoupon)
      calculateDiscount(validCoupon, calculateCartTotal())
      localStorage.setItem("appliedCoupon", JSON.stringify(validCoupon))
      toast.success(`Coupon ${validCoupon.code} applied!`, { position: 'top-center' })
      setCouponError("")
    } catch (error) {
      console.error("Error applying coupon:", error)
      setCouponError("Failed to apply coupon. Please try again.")
      toast.error('Failed to apply coupon', { position: 'top-center' })
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
    toast.success('Coupon removed', { position: 'top-center' })
  }

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart({ id, userId: user?.id }))
      toast.success('Item removed from cart', { position: 'top-center' })
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity, userId: user?.id }))
      toast.success('Quantity updated', { position: 'top-center' })
    }
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
    dispatch(removeInvalidCurrencyItems({ selectedCurrency, userId: user?.id }))
    toast.success(`Removed ${invalidCartItems.length} unavailable item(s)`, { position: 'top-center' })
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
      if (appliedCoupon) {
        const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")
        usedCoupons.push(appliedCoupon.code)
        localStorage.setItem("usedCoupons", JSON.stringify(usedCoupons))
        localStorage.removeItem("pendingOffer")
        localStorage.removeItem("appliedCoupon")
      }
      toast.success('Cart cleared successfully', { position: 'top-center' })
    } catch (error) {
      console.error("Error clearing cart:", error)
      toast.error('Failed to clear cart', { position: 'top-center' })
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
        variantName: item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[1] : item.menuItem.name,
        quantity: item.quantity,
        unitPrice: getCurrencySpecificPrice(item.menuItem).toString(),
        specialRequests: item.specialRequests,
      })),
    }
    try {
      const result = await dispatch(submitOrder(orderData)).unwrap()
      await clearCartAfterOrder()
      toast.success(`Order placed successfully! Order ID: ${result.orderId}`, { position: 'top-center' })
      router.push("/orders")
    } catch (error) {
      console.error("Failed to submit order:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to place order. Please try again."
      toast.error(errorMessage, { position: 'top-center' })
      throw error
    }
  }

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      openModal()
      toast.error('Please login to place an order', { position: 'top-center' })
      return
    }
    if (validCartItems.length === 0) {
      toast.error(`No items available for ${selectedCurrency}. Please add items or switch currency.`, { position: 'top-center' })
      return
    }
    if (!customerInfo.name || !customerInfo.phone || (orderType === "delivery" && !customerInfo.deliveryAddress)) {
      toast.error('Please fill in all required customer information', { position: 'top-center' })
      return
    }
    if (paymentMethod === "upi") {
      try {
        setIsProcessingPayment(true)
        const razorpayResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: (calculateCartTotal() + deliveryFee - discountAmount) * 100, // Convert to paise for INR
            currency: selectedCurrency,
            receipt: `order_${Date.now()}`
          }),
        })
        if (!razorpayResponse.ok) {
          throw new Error('Failed to create payment order')
        }
        const razorpayOrderResult = await razorpayResponse.json()
        const options = {
          key: razorpayOrderResult.key,
          amount: razorpayOrderResult.amount,
          currency: razorpayOrderResult.currency,
          name: "SABS online store",
          description: "Order Payment",
          order_id: razorpayOrderResult.orderId,
          handler: async (response: any) => {
            try {
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
                await submitOrderAfterPayment(verificationResult.paymentId)
              }
            } catch (error) {
              console.error("Payment verification failed:", error)
              toast.error('Payment verification failed. Please try again.', { position: 'top-center' })
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
              toast.error('Payment cancelled', { position: 'top-center' })
            }
          }
        }
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } catch (error) {
        console.error("Failed to create payment order:", error)
        toast.error('Failed to initiate payment. Please try again.', { position: 'top-center' })
        setIsProcessingPayment(false)
      }
    } else {
      await submitOrderAfterPayment()
    }
  }

  const handleWhatsAppOrder = () => {
    if (validCartItems.length === 0) {
      toast.error(`No items available for ${selectedCurrency}. Please add items or switch currency.`, { position: 'top-center' })
      return
    }
    if (!customerInfo.name || !customerInfo.phone || (orderType === "delivery" && !customerInfo.deliveryAddress)) {
      toast.error('Please fill in all required customer information', { position: 'top-center' })
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
      const variantName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[1] : ''
      const itemName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[0] : item.menuItem.name
      message += `${index + 1}. ${itemName}${variantName ? ` (${variantName})` : ''} x${item.quantity} - ${formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')}\n`
    })
    const finalTotal = cartTotal + deliveryFee - discountAmount
    message += `\n💰 *Order Summary:*\n`
    message += `Subtotal: ${formatPriceWithSmallDecimals(cartTotal, cartTotal, selectedCurrency, true, '#000')}\n`
    if (deliveryFee > 0) {
      message += `Delivery Fee: ${formatPriceWithSmallDecimals(deliveryFee, deliveryFee, selectedCurrency, true, '#000')}\n`
    }
    if (discountAmount > 0) {
      message += `Discount (${appliedCoupon?.code}): -${formatPriceWithSmallDecimals(discountAmount, discountAmount, selectedCurrency, true, '#000')}\n`
    }
    message += `*Total: ${formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#000')}*\n`
    if (specialInstructions) {
      message += `\n📝 *Special Instructions:*\n${specialInstructions}\n`
    }
    message += `\nPlease confirm this order and let me know the estimated preparation time. Thank you! 🙏`
    const phoneNumber = "+1234567890"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    toast.success('Order sent via WhatsApp', { position: 'top-center' })
  }

  const deliveryFee = orderType === "delivery" ? 3.99 : 0
  const cartTotal = calculateCartTotal()
  const subtotalWithDelivery = cartTotal + deliveryFee
  const finalTotal = subtotalWithDelivery - discountAmount

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Add some items from our products to get started!</p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 text-sm sm:text-base rounded-xl shadow-lg transform hover:scale-105 transition-all"
              aria-label="Browse products"
            >
              Browse Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Your Order</h1>
          <div className="text-sm text-gray-600">
            Currency: <span className="font-semibold text-gray-900">{selectedCurrency}</span>
          </div>
        </div>

        {invalidCartItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 rounded-xl shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 text-base sm:text-lg mb-2">
                    Currency Availability Notice
                  </h3>
                  <p className="text-sm sm:text-base text-orange-700 mb-3">
                    {invalidCartItems.length} item(s) in your cart are not available in {selectedCurrency}.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {invalidCartItems.map((item) => (
                      <span key={item.menuItem.id} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs sm:text-sm">
                        {item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[0] : item.menuItem.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleRemoveInvalidItems}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 rounded-lg"
                      aria-label="Remove unavailable items"
                    >
                      Remove These Items
                    </Button>
                    <Button
                      onClick={() => router.push("/products")}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 rounded-lg"
                      aria-label="Browse more products"
                    >
                      Browse More Products
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 space-y-6">
            {validCartItems.length > 0 && (
              <Card className="border-0 shadow-lg rounded-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Available Items ({selectedCurrency})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validCartItems.map((item) => {
                    const itemPrice = getCurrencySpecificPrice(item.menuItem)
                    const variantName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[1] : ''
                    const itemName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[0] : item.menuItem.name
                    return (
                      <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-gray-50">
                        <Image
                          src={
                            item.menuItem.image_url ||
                            item.menuItem.image_urls?.[0] ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                          }
                          alt={itemName}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover w-20 h-20 sm:w-24 sm:h-24"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900">{itemName}</h3>
                          {variantName && (
                            <p className="text-sm text-gray-600">Variant: {variantName}</p>
                          )}
                          <p className="text-sm sm:text-base text-gray-600">
                            {formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.menuItem.id, item.quantity - 1)}
                            className="p-2 rounded-lg border-gray-300 hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.menuItem.id, item.quantity + 1)}
                            className="p-2 rounded-lg border-gray-300 hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-4">
                          <p className="font-semibold text-sm sm:text-base">
                            {formatPriceWithSmallDecimals(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency, true, '#000')}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.menuItem.id, 0)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                            aria-label="Remove item"
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
              <Card className="opacity-60 border-0 shadow-lg rounded-2xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-500">
                    Unavailable in {selectedCurrency}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invalidCartItems.map((item) => {
                    const itemName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[0] : item.menuItem.name
                    return (
                      <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-gray-50">
                        <Image
                          src={
                            item.menuItem.image_url ||
                            item.menuItem.image_urls?.[0] ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                          }
                          alt={itemName}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover w-20 h-20 sm:w-24 sm:h-24 grayscale"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-600">{itemName}</h3>
                          <p className="text-sm text-gray-500">
                            Not available in {selectedCurrency}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Qty: {item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.menuItem.id, 0)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                            aria-label="Remove item"
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

            <Card className="border-0 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={orderType}
                  onValueChange={(value: "dine-in" | "takeaway" | "delivery") => dispatch(setOrderType(value))}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="dine-in" id="dine-in" />
                    <Label htmlFor="dine-in" className="text-sm sm:text-base cursor-pointer">Dine-In</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="takeaway" id="takeaway" />
                    <Label htmlFor="takeaway" className="text-sm sm:text-base cursor-pointer">Takeaway</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="text-sm sm:text-base cursor-pointer">Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
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

            <Card className="border-0 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Customer Information</CardTitle>
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
                      onChange={(e) => dispatch(setCustomerInfo({ info: { name: e.target.value }, userId: user?.id }))}
                      disabled={!!user?.name}
                      required
                      className="text-sm sm:text-base rounded-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => dispatch(setCustomerInfo({ info: { phone: e.target.value }, userId: user?.id }))}
                      required
                      className="text-sm sm:text-base rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || customerInfo.email}
                    onChange={(e) => dispatch(setCustomerInfo({ info: { email: e.target.value }, userId: user?.id }))}
                    disabled={!!user?.email}
                    className="text-sm sm:text-base rounded-lg"
                  />
                </div>
                {orderType === "delivery" && (
                  <div>
                    <Label htmlFor="address" className="text-sm sm:text-base">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      value={customerInfo.deliveryAddress || ""}
                      onChange={(e) => dispatch(setCustomerInfo({ info: { deliveryAddress: e.target.value }, userId: user?.id }))}
                      required
                      className="text-sm sm:text-base rounded-lg"
                      placeholder="Enter full delivery address"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="instructions" className="text-sm sm:text-base">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or instructions"
                    className="text-sm sm:text-base rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-80 xl:w-96">
            <Card className="sticky top-4 sm:top-6 border-0 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Order Summary ({selectedCurrency})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validCartItems.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {validCartItems.map((item) => {
                        const itemPrice = getCurrencySpecificPrice(item.menuItem)
                        const variantName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[1] : ''
                        const itemName = item.menuItem.name.includes(' - ') ? item.menuItem.name.split(' - ')[0] : item.menuItem.name
                        return (
                          <div key={item.menuItem.id} className="flex justify-between text-sm sm:text-base">
                            <span className="truncate max-w-[60%]">
                              {item.quantity}x {itemName}{variantName ? ` (${variantName})` : ''}
                            </span>
                            <span>{formatPriceWithSmallDecimals(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency, true, '#000')}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Subtotal</span>
                        <span>{formatPriceWithSmallDecimals(cartTotal, cartTotal, selectedCurrency, true, '#000')}</span>
                      </div>
                      {orderType === "delivery" && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span>Delivery Fee</span>
                          <span>{formatPriceWithSmallDecimals(deliveryFee, deliveryFee, selectedCurrency, true, '#000')}</span>
                        </div>
                      )}
                      {appliedCoupon && discountAmount > 0 && (
                        <div className="flex justify-between text-sm sm:text-base text-green-600">
                          <span>
                            Discount ({appliedCoupon.code})
                            <span className="text-xs block">
                              {appliedCoupon.type === 'cash' ? `${appliedCoupon.discount} ${selectedCurrency} off` : `${appliedCoupon.discount}% off`}
                            </span>
                          </span>
                          <span>-{formatPriceWithSmallDecimals(discountAmount, discountAmount, selectedCurrency, true, '#000')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                        <span>Total</span>
                        <div className="text-right">
                          {appliedCoupon && discountAmount > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 line-through">
                              {formatPriceWithSmallDecimals(subtotalWithDelivery, subtotalWithDelivery, selectedCurrency, true, '#6B7280')}
                            </div>
                          )}
                          <div>{formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#000')}</div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {!appliedCoupon ? (
                          <>
                            <Button
                              onClick={() => setIsCouponFieldOpen(!isCouponFieldOpen)}
                              variant="outline"
                              className="w-full text-amber-600 border-amber-500 hover:bg-amber-50 rounded-lg text-sm sm:text-base"
                              aria-label={isCouponFieldOpen ? "Hide coupon field" : "Show coupon field"}
                            >
                              {isCouponFieldOpen ? "Hide Coupon Field" : "Redeem Offer"}
                            </Button>
                            {isCouponFieldOpen && (
                              <div className="space-y-2">
                                <Label htmlFor="coupon" className="text-sm sm:text-base">Enter Coupon Code</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="coupon"
                                    value={couponCode}
                                    onChange={(e) => {
                                      setCouponCode(e.target.value)
                                      setCouponError("")
                                    }}
                                    placeholder="Enter coupon code"
                                    className={`text-sm sm:text-base rounded-lg ${couponError ? "border-red-500" : ""}`}
                                  />
                                  <Button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponCode.trim() || isApplyingCoupon}
                                    className="bg-amber-500 hover:bg-amber-600 text-black text-sm sm:text-base px-3 sm:px-4 rounded-lg"
                                    aria-label="Apply coupon"
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
                                aria-label="Remove coupon"
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
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm sm:text-base py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                          aria-label="Place order"
                        >
                          {loading ? "Processing..." : isAuthenticated ? "Place Order" : "Login to Place Order"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={loading || isProcessingPayment || (!isAuthenticated && !customerInfo.name) || !customerInfo.phone || validCartItems.length === 0}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm sm:text-base py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                          aria-label="Pay now"
                        >
                          {isProcessingPayment ? "Processing Payment..." :
                            loading ? "Processing..." :
                              isAuthenticated ? `Pay ${formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#fff')}` : "Login to Pay"}
                        </Button>
                      )}

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleWhatsAppOrder}
                        variant="outline"
                        className="w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent text-sm sm:text-base py-3 rounded-lg"
                        disabled={!customerInfo.name || !customerInfo.phone || validCartItems.length === 0}
                        aria-label="Order via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Order via WhatsApp
                      </Button>

                      <Button
                        onClick={() => {
                          dispatch(clearCart({ userId: user?.id }))
                          toast.success('Cart cleared', { position: 'top-center' })
                        }}
                        variant="outline"
                        className="w-full text-sm sm:text-base py-3 rounded-lg border-gray-300 hover:bg-gray-100"
                        aria-label="Clear cart"
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4 text-sm sm:text-base">No items available in {selectedCurrency}</p>
                    <Button
                      onClick={() => router.push("/products")}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm sm:text-base rounded-xl"
                      aria-label="Browse products"
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

      <Footer />
    </div>
  )
}