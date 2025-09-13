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
  const { cart, total, customerInfo, loading } = useSelector((state: RootState) => state.order)
  const orderType = "delivery" // Make delivery default and required
  const { isAuthenticated, user } = useAuth()
  const { selectedCurrency, formatPriceWithSmallDecimals } = useCurrency()
   const { openModal } = useLoginModal()
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [detailedAddress, setDetailedAddress] = useState({
    street: "",
    landmark: "",
    area: "",
    city: "",
    pincode: "",
    state: "",
    country: selectedCurrency === 'AED' ? 'UAE' : 'India'
  })
  
  const [couponCode, setCouponCode] = useState("")
  const [isCouponFieldOpen, setIsCouponFieldOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(selectedCurrency === 'AED' ? "cod" : "upi")

  // Update payment method when currency changes
  useEffect(() => {
    if (selectedCurrency === 'AED') {
      setPaymentMethod('cod')
    } else {
      setPaymentMethod('upi')
    }
  }, [selectedCurrency])
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

  const hasSelectedCurrencyPrice = (item: any, variant?: any) => {
    // Check if product has variants with pricing for selected currency
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      if (selectedCurrency === 'AED') {
        return item.variants.some((v: any) => v.available_aed && v.price_aed && v.price_aed > 0)
      } else if (selectedCurrency === 'INR') {
        return item.variants.some((v: any) => v.available_inr && v.price_inr && v.price_inr > 0)
      }
    }
    // If variant is provided directly, check variant prices
    if (variant) {
      return selectedCurrency === 'AED' ? (variant.available_aed && variant.price_aed > 0) : (variant.available_inr && variant.price_inr > 0)
    }
    // Fallback to product-level prices
    return selectedCurrency === 'AED' ? (item.available_aed && item.price_aed > 0) : (item.available_inr && item.price_inr > 0)
  }

  const getCurrencySpecificPrice = (item: any, variant?: any) => {
    // If product has variants, use first available variant or specified variant
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const targetVariant = variant || item.variants.find((v: any) =>
        selectedCurrency === 'AED' ? (v.available_aed && v.price_aed > 0) : (v.available_inr && v.price_inr > 0)
      ) || item.variants[0]

      if (selectedCurrency === 'AED' && targetVariant.available_aed && targetVariant.price_aed > 0) {
        const discount = targetVariant.discount_aed || 0
        return Math.max(0, targetVariant.price_aed - discount)
      } else if (selectedCurrency === 'INR' && targetVariant.available_inr && targetVariant.price_inr > 0) {
        const discount = targetVariant.discount_inr || 0
        return Math.max(0, targetVariant.price_inr - discount)
      }
    }

    // If variant is provided directly, use variant prices with discount applied
    if (variant) {
      if (selectedCurrency === 'AED' && variant.available_aed) {
        const discount = variant.discount_aed || 0
        return Math.max(0, (variant.price_aed || 0) - discount)
      } else if (selectedCurrency === 'INR' && variant.available_inr) {
        const discount = variant.discount_inr || 0
        return Math.max(0, (variant.price_inr || 0) - discount)
      }
    }

    // Fallback to product-level prices
    if (selectedCurrency === 'AED' && item.available_aed) {
      const discount = item.discount_aed || 0
      return Math.max(0, (item.price_aed || 0) - discount)
    } else if (selectedCurrency === 'INR' && item.available_inr) {
      const discount = item.discount_inr || 0
      return Math.max(0, (item.price_inr || 0) - discount)
    }
    return 0
  }

  const validCartItems = cart.filter(item => hasSelectedCurrencyPrice(item.menuItem, item.selected_variant))
  const invalidCartItems = cart.filter(item => !hasSelectedCurrencyPrice(item.menuItem, item.selected_variant))

  const calculateCartTotal = () => {
    return validCartItems.reduce((sum, item) => {
      const price = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
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
      toast.error(`${invalidCartItems.length} item(s) are not available in ${selectedCurrency === 'AED' ? "UAE" : "India"}`, {
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

  const submitOrderAfterPayment = async (paymentId?: string, razorpayDetails?: any) => {
    const cartTotal = calculateCartTotal()
    const finalTotal = cartTotal + deliveryFee - discountAmount
    const orderData = {
      customerName: user?.name || customerInfo.name,
      customerEmail: user?.email || customerInfo.email,
      customerPhone: customerInfo.phone,
      orderType,
      paymentMethod,
      paymentId: paymentId,
      // Enhanced Razorpay payment details for bank reconciliation
      razorpayOrderId: razorpayDetails?.razorpay_order_id,
      razorpayPaymentId: razorpayDetails?.razorpay_payment_id,
      razorpaySignature: razorpayDetails?.razorpay_signature,
      paymentStatus: razorpayDetails ? 'completed' : (paymentMethod === 'cod' ? 'pending' : 'failed'),
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
        variantId: item.variant_id,
        variantName: item.selected_variant?.name || 'Default',
        quantity: item.quantity,
        unitPrice: getCurrencySpecificPrice(item.menuItem, item.selected_variant).toString(),
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
    // Validation alerts without disabling button
    if (!isAuthenticated) {
      openModal()
      toast.error('Please login to place an order', { position: 'top-center' })
      return
    }
    if (validCartItems.length === 0) {
      toast.error(`No items available for ${selectedCurrency}. Please add items or switch currency.`, { position: 'top-center' })
      return
    }

    const cartTotal = calculateCartTotal()
    const minOrderAmount = selectedCurrency === 'AED' ? 50 : 100
    if (cartTotal < minOrderAmount) {
      toast.error(`Minimum order amount is ${selectedCurrency === 'AED' ? 'AED 50' : '₹100'}`, { position: 'top-center' })
      return
    }

    if (!customerInfo.phone) {
      toast.error('Phone number is required to place an order', { position: 'top-center' })
      return
    }
    if (orderType === "delivery" && !customerInfo.deliveryAddress) {
      toast.error('Delivery address is required for delivery orders', { position: 'top-center' })
      return
    }
    if (orderType === "delivery" && (!detailedAddress.street || !detailedAddress.area || !detailedAddress.city || !detailedAddress.state || !detailedAddress.pincode)) {
      toast.error('Please complete all required address fields', { position: 'top-center' })
      return
    }
    if (paymentMethod === "upi" && selectedCurrency === 'INR') {
      try {
        setIsProcessingPayment(true)
        const razorpayResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: (calculateCartTotal() + deliveryFee - discountAmount) , // Convert to paise for INR
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
                await submitOrderAfterPayment(verificationResult.paymentId, response)
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

    const cartTotal = calculateCartTotal()
    const minOrderAmount = selectedCurrency === 'AED' ? 50 : 100
    if (cartTotal < minOrderAmount) {
      toast.error(`Minimum order amount is ${selectedCurrency === 'AED' ? 'AED 50' : '₹100'}`, { position: 'top-center' })
      return
    }

    // WhatsApp ordering is always enabled - customer can provide details in WhatsApp chat
    const customerName = user?.name || customerInfo.name || "Customer"
    const customerPhone = customerInfo.phone || "Not provided"
    const customerEmail = user?.email || customerInfo.email || "Not provided"

    let message = `🛍️ *New Order from Sabs Online*\n\n`
    message += `👤 *Customer Details:*\n`
    message += `Name: ${customerName === "Customer" ? "Please provide your name" : customerName}\n`
    message += `Phone: ${customerPhone === "Not provided" ? "Please provide your phone number" : customerPhone}\n`
    message += `Email: ${customerEmail === "Not provided" ? "Please provide your email (optional)" : customerEmail}\n\n`
    message += `📋 *Order Type:* ${orderType.charAt(0).toUpperCase() + orderType.slice(1)}\n`
    message += `💳 *Payment Method:* ${paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}\n`
    message += `💰 *Currency:* ${selectedCurrency}\n`
    if (orderType === "delivery") {
      if (customerInfo.deliveryAddress) {
        message += `📍 *Delivery Address:* ${customerInfo.deliveryAddress}\n`
      } else {
        message += `📍 *Delivery Address:* Please provide your delivery address\n`
      }
    }
    message += `\n🛒 *Order Items:*\n`
    validCartItems.forEach((item, index) => {
      const itemPrice = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
      const variantName = item.selected_variant?.name || ''
      const itemName = item.menuItem.name
      const stockInfo = item.selected_variant && item.selected_variant.stock_quantity <= 5 ?
        ` (${item.selected_variant.stock_quantity === 0 ? 'OUT OF STOCK' : `${item.selected_variant.stock_quantity} left`})` : ''
      const priceText = selectedCurrency === 'AED' ? `AED ${itemPrice.toFixed(2)}` : `₹${itemPrice.toFixed(2)}`
      message += `${index + 1}. ${itemName}${variantName && variantName !== 'Default' ? ` - ${variantName}` : ''} x${item.quantity}${stockInfo} - ${priceText}\n`
    })
    const finalTotal = cartTotal + deliveryFee - discountAmount
    message += `\n💰 *Order Summary:*\n`
    const subtotalText = selectedCurrency === 'AED' ? `AED ${cartTotal.toFixed(2)}` : `₹${cartTotal.toFixed(2)}`
    message += `Subtotal: ${subtotalText}\n`
    if (deliveryFee > 0) {
      const deliveryText = selectedCurrency === 'AED' ? `AED ${deliveryFee.toFixed(2)}` : `₹${deliveryFee.toFixed(2)}`
      message += `Delivery Fee: ${deliveryText}\n`
    } else if (orderType === "delivery") {
      message += `Delivery Fee: FREE! 🎉\n`
    }
    if (discountAmount > 0) {
      const discountText = selectedCurrency === 'AED' ? `AED ${discountAmount.toFixed(2)}` : `₹${discountAmount.toFixed(2)}`
      message += `Discount (${appliedCoupon?.code}): -${discountText}\n`
    }
    const totalText = selectedCurrency === 'AED' ? `AED ${finalTotal.toFixed(2)}` : `₹${finalTotal.toFixed(2)}`
    message += `*Total: ${totalText}*\n`
    if (specialInstructions) {
      message += `\n📝 *Special Instructions:*\n${specialInstructions}\n`
    }
    message += `\nPlease confirm this order and let me know the estimated preparation time. Thank you! 🙏`
    const phoneNumber = "+917012975494"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    try {
      window.open(whatsappUrl, "_blank")
      toast.success('Order sent via WhatsApp! Check your WhatsApp app.', { position: 'top-center' })
    } catch (error) {
      console.error('Failed to open WhatsApp:', error)
      toast.error('Failed to open WhatsApp. Please try again.', { position: 'top-center' })
    }
  }

  // Dynamic delivery fee calculation
  const calculateDeliveryFee = () => {
    if (orderType !== "delivery") return 0

    const cartTotal = calculateCartTotal()
    if (selectedCurrency === 'AED') {
      // AED: free delivery above 200, otherwise 10 AED
      return cartTotal >= 200 ? 0 : 10
    } else {
      // INR: free delivery above 3000, otherwise 70 INR
      return cartTotal >= 3000 ? 0 : 70
    }
  }

  const deliveryFee = calculateDeliveryFee()
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
            Region: <span className="font-semibold text-gray-900">{selectedCurrency === 'AED' ? "UAE" : "India"}</span>
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
                    {invalidCartItems.length} item(s) in your cart are not available in {selectedCurrency === 'AED' ? "UAE" : "India"}.
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
                    const itemPrice = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
                    const variantName = item.selected_variant?.name || ''
                    const itemName = item.menuItem.name
                    return (
                      <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 border rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow">
                        <Image
                          src={
                            item.menuItem.image_url ||
                            item.menuItem.image_urls?.[0] ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                          }
                          alt={itemName}
                          width={90}
                          height={90}
                          className="rounded-xl object-cover w-20 h-20 sm:w-24 sm:h-24 shadow-sm"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 leading-tight">{itemName}</h3>
                              {variantName && variantName !== 'Default' && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                    {variantName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">
                                {formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')}
                              </p>
                              <p className="text-sm text-gray-500">per item</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                              <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.menuItem.id, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100 rounded-l-lg"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold text-lg bg-gray-50 py-1">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.menuItem.id, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-100 rounded-r-lg"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold text-xl text-orange-600">
                                  {formatPriceWithSmallDecimals(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency, true, '#000')}
                                </p>
                                <p className="text-sm text-gray-500">total</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.menuItem.id, 0)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 p-2 rounded-lg"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {item.selected_variant && item.selected_variant.stock_quantity <= 5 && (
                            <div className="flex items-center gap-2 bg-orange-50 p-2 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <p className="text-sm text-orange-700 font-medium">
                                {item.selected_variant.stock_quantity === 0 ? 'Out of Stock' : `Only ${item.selected_variant.stock_quantity} left in stock`}
                              </p>
                            </div>
                          )}
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
                            Not available in {selectedCurrency === 'AED' ? "UAE" : "India"}
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

            {/* <Card className="border-0 shadow-lg rounded-2xl bg-white">
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
            </Card> */}

            <Card className="border-0 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-1 gap-4"
                >
                  {selectedCurrency === 'INR' && (
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="text-sm sm:text-base cursor-pointer">
                        UPI Payment
                      </Label>
                    </div>
                  )}
                  {selectedCurrency === 'AED' && (
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="text-sm sm:text-base cursor-pointer">
                        Cash on Delivery
                      </Label>
                    </div>
                  )}
                </RadioGroup>
                {selectedCurrency === 'AED' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Only Cash on Delivery is available for UAE orders
                    </p>
                  </div>
                )}
                {selectedCurrency === 'INR' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      💳 Only UPI Payment is available for India orders
                    </p>
                  </div>
                )}
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
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Delivery Address *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="street" className="text-sm">Street Address *</Label>
                        <Input
                          id="street"
                          value={detailedAddress.street}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, street: e.target.value }))
                            const fullAddress = `${e.target.value}, ${detailedAddress.area}, ${detailedAddress.city}, ${detailedAddress.state}, ${detailedAddress.country} - ${detailedAddress.pincode}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required
                          className="text-sm rounded-lg"
                          placeholder="House/Flat No, Building, Street"
                        />
                      </div>
                      <div>
                        <Label htmlFor="landmark" className="text-sm">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          value={detailedAddress.landmark}
                          onChange={(e) => setDetailedAddress(prev => ({ ...prev, landmark: e.target.value }))}
                          className="text-sm rounded-lg"
                          placeholder="Near landmark/reference point"
                        />
                      </div>
                      <div>
                        <Label htmlFor="area" className="text-sm">Area/Locality *</Label>
                        <Input
                          id="area"
                          value={detailedAddress.area}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, area: e.target.value }))
                            const fullAddress = `${detailedAddress.street}, ${e.target.value}, ${detailedAddress.city}, ${detailedAddress.state}, ${detailedAddress.country} - ${detailedAddress.pincode}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required
                          className="text-sm rounded-lg"
                          placeholder="Area, Locality, Neighborhood"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-sm">City *</Label>
                        <Input
                          id="city"
                          value={detailedAddress.city}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, city: e.target.value }))
                            const fullAddress = `${detailedAddress.street}, ${detailedAddress.area}, ${e.target.value}, ${detailedAddress.state}, ${detailedAddress.country} - ${detailedAddress.pincode}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required
                          className="text-sm rounded-lg"
                          placeholder={selectedCurrency === 'AED' ? "Dubai, Abu Dhabi, etc." : "Mumbai, Delhi, etc."}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm">{selectedCurrency === 'AED' ? 'Emirate' : 'State'} *</Label>
                        <Input
                          id="state"
                          value={detailedAddress.state}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, state: e.target.value }))
                            const fullAddress = `${detailedAddress.street}, ${detailedAddress.area}, ${detailedAddress.city}, ${e.target.value}, ${detailedAddress.country} - ${detailedAddress.pincode}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required
                          className="text-sm rounded-lg"
                          placeholder={selectedCurrency === 'AED' ? "Dubai, Abu Dhabi, etc." : "Maharashtra, Delhi, etc."}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode" className="text-sm">{selectedCurrency === 'AED' ? 'Postal Code' : 'PIN Code'} *</Label>
                        <Input
                          id="pincode"
                          value={detailedAddress.pincode}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, pincode: e.target.value }))
                            const fullAddress = `${detailedAddress.street}, ${detailedAddress.area}, ${detailedAddress.city}, ${detailedAddress.state}, ${detailedAddress.country} - ${e.target.value}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required
                          className="text-sm rounded-lg"
                          placeholder={selectedCurrency === 'AED' ? "12345" : "400001"}
                          pattern={selectedCurrency === 'AED' ? "[0-9]{5}" : "[0-9]{6}"}
                          maxLength={selectedCurrency === 'AED' ? 5 : 6}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Complete Address Preview:</Label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 mt-1">
                        {customerInfo.deliveryAddress || "Address will appear here as you type..."}
                      </div>
                    </div>
                  </div>
                )}
                {/* <div>
                  <Label htmlFor="instructions" className="text-sm sm:text-base">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or instructions"
                    className="text-sm sm:text-base rounded-lg"
                  />
                </div> */}
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
                    <div className="space-y-3">
                      {validCartItems.map((item) => {
                        const itemPrice = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
                        const variantName = item.selected_variant?.name || ''
                        const itemName = item.menuItem.name
                        return (
                          <div key={item.menuItem.id} className="flex justify-between items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                                  {item.quantity}x
                                </span>
                                <span className="font-semibold text-gray-900 text-sm leading-tight">
                                  {itemName}
                                </span>
                              </div>
                              {variantName && variantName !== 'Default' && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-8 w-fit">
                                  {variantName}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-900">
                                {formatPriceWithSmallDecimals(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency, true, '#000')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')} each
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      {(selectedCurrency === 'AED' && cartTotal < 50) || (selectedCurrency === 'INR' && cartTotal < 100) ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-700">
                              Minimum order: {selectedCurrency === 'AED' ? 'AED 50' : '₹100'}
                              {orderType === "delivery" && (
                                <span className="block">
                                  Free delivery: {selectedCurrency === 'AED' ? 'AED 200+' : '₹3000+'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ) : orderType === "delivery" && deliveryFee === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-700">
                              🎉 You qualify for free delivery!
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Subtotal</span>
                        <span>{formatPriceWithSmallDecimals(cartTotal, cartTotal, selectedCurrency, true, '#000')}</span>
                      </div>
                      {orderType === "delivery" && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="flex items-center gap-2">
                            Delivery Fee
                            {deliveryFee === 0 && (
                              <span className="text-green-600 font-medium text-xs bg-green-100 px-2 py-1 rounded-full">
                                FREE! 🎉
                              </span>
                            )}
                          </span>
                          <span className={deliveryFee === 0 ? "text-green-600 font-bold" : ""}>
                            {deliveryFee === 0 ? "FREE" : formatPriceWithSmallDecimals(deliveryFee, deliveryFee, selectedCurrency, true, '#000')}
                          </span>
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
                          disabled={loading || isProcessingPayment}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm sm:text-base py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
                          aria-label="Place order"
                        >
                          {loading ? "Processing..." : isAuthenticated ? "Place Order" : "Login to Place Order"}
                        </Button>
                      ) : (
                        <Button
  onClick={handleSubmitOrder}
  disabled={loading || isProcessingPayment}
  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm sm:text-base py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
  aria-label="Pay now"
>
  {isProcessingPayment ? "Processing Payment..." :
    loading ? "Processing..." :
      isAuthenticated ? (
        <>
          Pay {formatPriceWithSmallDecimals(finalTotal, finalTotal, 'AED', true, '#fff')}
        </>
      ) : "Login to Pay"}
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
                        disabled={validCartItems.length === 0}
                        aria-label="Order via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Order via WhatsApp
                      </Button>

                      {orderType === "delivery" && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          💡 For WhatsApp orders, you can provide address details in the chat
                        </div>
                      )}

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