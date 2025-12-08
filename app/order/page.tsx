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
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, CheckCircle, XCircle, AlertTriangle, Gift, Info } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'

const WHATSAPP_ORDER_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER

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
  isWelcomeCoupon?: boolean
  discountAmount: number
  minPurchase?: number
  validFrom?: string
  validTo?: string
}

export default function OrderPage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { cart, total, customerInfo, loading } = useSelector((state: RootState) => state.order)
  const orderType = "delivery"
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

  // Update payment method and country when currency changes
  useEffect(() => {
    if (selectedCurrency === 'AED') {
      setPaymentMethod('cod')
      setDetailedAddress(prev => ({ ...prev, country: 'UAE' }))
    } else {
      setPaymentMethod('upi')
      setDetailedAddress(prev => ({ ...prev, country: 'India' }))
    }
  }, [selectedCurrency])

  // Update full address when country or any address field changes
  useEffect(() => {
    if (detailedAddress.street || detailedAddress.area || detailedAddress.city || detailedAddress.state || detailedAddress.pincode) {
      const fullAddress = `${detailedAddress.street}, ${detailedAddress.area}, ${detailedAddress.city}, ${detailedAddress.state}, ${detailedAddress.country} - ${detailedAddress.pincode}`
      dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
    }
  }, [detailedAddress.country, detailedAddress.street, detailedAddress.area, detailedAddress.city, detailedAddress.state, detailedAddress.pincode, dispatch, user?.id])

  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponErrorType, setCouponErrorType] = useState<"error" | "warning" | "info">("error")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

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
    if (variant) {
      return selectedCurrency === 'AED' ? (variant.available_aed && variant.price_aed > 0) : (variant.available_inr && variant.price_inr > 0)
    }

    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      if (selectedCurrency === 'AED') {
        return item.variants.some((v: any) => v.available_aed && v.price_aed && v.price_aed > 0)
      } else if (selectedCurrency === 'INR') {
        return item.variants.some((v: any) => v.available_inr && v.price_inr && v.price_inr > 0)
      }
    }

    return false
  }

  const getCurrencySpecificPrice = (item: any, variant?: any) => {
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const targetVariant = variant || item.variants.find((v: any) =>
        selectedCurrency === 'AED' ? (v.available_aed && v.price_aed > 0) : (v.available_inr && v.price_inr > 0)
      ) || item.variants[0]

      if (selectedCurrency === 'AED' && targetVariant.available_aed && targetVariant.price_aed > 0) {
        return targetVariant.discount_aed && targetVariant.discount_aed > 0 ? targetVariant.discount_aed : targetVariant.price_aed
      } else if (selectedCurrency === 'INR' && targetVariant.available_inr && targetVariant.price_inr > 0) {
        return targetVariant.discount_inr && targetVariant.discount_inr > 0 ? targetVariant.discount_inr : targetVariant.price_inr
      }
    }

    if (variant) {
      if (selectedCurrency === 'AED' && variant.available_aed) {
        return variant.discount_aed && variant.discount_aed > 0 ? variant.discount_aed : (variant.price_aed || 0)
      } else if (selectedCurrency === 'INR' && variant.available_inr) {
        return variant.discount_inr && variant.discount_inr > 0 ? variant.discount_inr : (variant.price_inr || 0)
      }
    }

    if (selectedCurrency === 'AED' && item.available_aed) {
      return item.discount_aed && item.discount_aed > 0 ? item.discount_aed : (item.price_aed || 0)
    } else if (selectedCurrency === 'INR' && item.available_inr) {
      return item.discount_inr && item.discount_inr > 0 ? item.discount_inr : (item.price_inr || 0)
    }
    return 0
  }

  const validCartItems = cart.filter(item => {
    const isAvailable = hasSelectedCurrencyPrice(item.menuItem, item.selected_variant)
    const price = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
    return isAvailable && price > 0
  })

  const invalidCartItems = cart.filter(item => {
    const isAvailable = hasSelectedCurrencyPrice(item.menuItem, item.selected_variant)
    const price = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
    return !isAvailable || price <= 0
  })

  const calculateCartTotal = () => {
    return validCartItems.reduce((sum, item) => {
      const price = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
      return sum + price * item.quantity
    }, 0)
  }

  useEffect(() => {
    if (cart.length > 0) {
      dispatch(recalculateTotal(selectedCurrency))
      
      if (!isLoadingFromStorage) {
        setHasUserInteracted(true)
      }
      
      if (appliedCoupon) {
        const cartTotal = cart.reduce((sum, item) => {
          const price = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
          return sum + (price * item.quantity)
        }, 0)
        
        let newDiscount = appliedCoupon.discountAmount || 0;
        
        if (!newDiscount || newDiscount <= 0) {
          if (appliedCoupon.type === "flat" || appliedCoupon.type === "cash") {
            newDiscount = Math.min(parseFloat(appliedCoupon.discount), cartTotal)
          } else if (appliedCoupon.type === "percentage" || appliedCoupon.type === "percent") {
            newDiscount = (cartTotal * parseFloat(appliedCoupon.discount)) / 100
          }
        }
        
        newDiscount = Math.min(newDiscount, cartTotal)
        setDiscountAmount(newDiscount)
      }
    }
  }, [selectedCurrency, cart, dispatch, appliedCoupon, isLoadingFromStorage])

  useEffect(() => {
    if (invalidCartItems.length > 0) {
      toast.error(`${invalidCartItems.length} item(s) are not available in ${selectedCurrency === 'AED' ? "UAE" : "India"}`, {
        position: 'top-center'
      })
    }
  }, [selectedCurrency, invalidCartItems.length])

  // Load saved coupon from localStorage
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon")
    if (savedCoupon) {
      try {
        const couponData: CouponData = JSON.parse(savedCoupon)
        const now = new Date()
        const expiresAt = new Date(couponData.expiresAt)
        
        if (expiresAt > now) {
          setAppliedCoupon(couponData)
          setCouponCode(couponData.code)
          
          const cartTotal = calculateCartTotal()
          const discount = Math.min(couponData.discountAmount || 0, cartTotal)
          setDiscountAmount(discount)
        } else {
          localStorage.removeItem("appliedCoupon")
          toast.error('This coupon has expired. Please apply a new one.', { 
            position: 'top-center',
            duration: 4000 
          })
        }
      } catch (error) {
        console.error("Error loading saved coupon:", error)
        localStorage.removeItem("appliedCoupon")
        toast.error('Failed to load saved coupon', { position: 'top-center' })
      }
    }
    
    setTimeout(() => {
      setIsLoadingFromStorage(false)
    }, 2000)
  }, [])

  // Auto re-validate coupon when cart changes
  useEffect(() => {
    if (appliedCoupon && cart.length > 0 && hasUserInteracted) {
      const timeoutId = setTimeout(async () => {
        try {
          const orderTotal = calculateCartTotal()
          let currentShop = localStorage.getItem('currentShop') || 'B'
          
          const response = await fetch('/api/offers/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerCode: appliedCoupon.code,
              orderTotal,
              currency: selectedCurrency,
              shopId: currentShop,
              userType: user?.id ? "returning" : "new",
              userId: user?.id || "guest",
              cartItems: cart.map((item: any) => ({
                id: item.menuItem?.id || item.id,
                categoryId: item.menuItem?.category_id || item.category_id || item.categoryId,
                quantity: item.quantity,
                price: getCurrencySpecificPrice(item.menuItem, item.selected_variant)
              }))
            })
          })

          const result = await response.json()

          if (!response.ok || !result.valid) {
            // Handle different error types
            let errorMessage = "Coupon removed"
            let errorType: "error" | "warning" | "info" = "error"
            
            if (result.error && typeof result.error === 'string') {
              if (result.error.includes("already used this coupon") || 
                  result.error.includes("already been redeemed") ||
                  result.error.includes("already redeemed")) {
                errorMessage = "You have already used this coupon. It cannot be used again."
                errorType = "error"
              } else if (result.error.includes("expired") || 
                         result.error.includes("has expired")) {
                errorMessage = "This coupon has expired. Please use a different coupon."
                errorType = "warning"
              } else if (result.error.includes("Minimum order value") || 
                         result.error.includes("Minimum order")) {
                errorMessage = result.error
                errorType = "info"
              } else {
                errorMessage = result.error || "Coupon is no longer valid."
                errorType = "error"
              }
            }
            
            // Remove invalid coupon
            setAppliedCoupon(null)
            setCouponCode("")
            setDiscountAmount(0)
            setCouponError(errorMessage)
            setCouponErrorType(errorType)
            localStorage.removeItem("appliedCoupon")
            
            // Show appropriate toast
            if (errorType === "error") {
              toast.error(errorMessage, { 
                position: 'top-center', 
                duration: 4000 
              })
            } else if (errorType === "warning") {
              toast.error(errorMessage, { 
                position: 'top-center', 
                duration: 4000 
              })
            } else {
              toast.error(errorMessage, { 
                position: 'top-center', 
                duration: 4000 
              })
            }
          } else {
            // Coupon is still valid, update coupon data and discount
            const discountAmountFromBackend = result.type === "welcome" 
              ? result.coupon.discountAmount 
              : result.offer.discountAmount;
            
            const updatedCoupon: CouponData = {
              code: result.type === "welcome" ? result.coupon.code : result.offer.code,
              discount: result.type === "welcome" ? result.coupon.discountValue : result.offer.value,
              type: result.type === "welcome" ? result.coupon.discountType : result.offer.type,
              title: result.type === "welcome" ? result.coupon.title : result.offer.title,
              offerTitle: result.type === "welcome" ? result.coupon.title : result.offer.title,
              offerId: result.type === "welcome" ? result.coupon.id : result.offer.id,
              timestamp: Date.now(),
              expiresAt: result.type === "welcome" 
                ? result.coupon.validTo 
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              isWelcomeCoupon: result.type === "welcome",
              discountAmount: discountAmountFromBackend,
              minPurchase: result.type === "welcome" ? parseFloat(result.coupon.minPurchase) : undefined,
              validFrom: result.type === "welcome" ? result.coupon.validFrom : undefined,
              validTo: result.type === "welcome" ? result.coupon.validTo : undefined
            }
            
            setAppliedCoupon(updatedCoupon)
            setDiscountAmount(discountAmountFromBackend)
            setCouponError("")
            localStorage.setItem("appliedCoupon", JSON.stringify(updatedCoupon))
          }
        } catch (error) {
          console.error('Error re-validating coupon:', error)
          const cartTotal = calculateCartTotal()
          const currentDiscount = Math.min(appliedCoupon.discountAmount || 0, cartTotal)
          setDiscountAmount(currentDiscount)
        }
      }, 200)

      return () => clearTimeout(timeoutId)
    }
  }, [cart.length, total, appliedCoupon?.code, selectedCurrency, user?.id, isLoadingFromStorage, hasUserInteracted])

  const calculateDiscount = (coupon: CouponData, subtotal: number) => {
    let discount = 0
    
    if (coupon.discountAmount && coupon.discountAmount > 0) {
      discount = Math.min(coupon.discountAmount, subtotal);
    } else {
      if (coupon.type === "flat" || coupon.type === "cash") {
        discount = Math.min(parseFloat(coupon.discount), subtotal);
      } else if (coupon.type === "percentage" || coupon.type === "percent") {
        discount = (subtotal * parseFloat(coupon.discount)) / 100;
      }
      discount = Math.min(discount, subtotal);
    }
    
    return discount;
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      setCouponErrorType("error")
      toast.error('Please enter a coupon code', { position: 'top-center' })
      return
    }
    
    const normalizedCode = couponCode.trim().toUpperCase()
    const isWelcomeCode = normalizedCode.startsWith('WELCOME')
    
    if (isWelcomeCode && !isAuthenticated) {
      setCouponError("Please login to use welcome coupons")
      setCouponErrorType("error")
      toast.error('Please login to use welcome coupons', { position: 'top-center' })
      openModal()
      return
    }
    
    setIsApplyingCoupon(true)
    setCouponError("")
    setCouponErrorType("error")
    
    try {
      const orderTotal = calculateCartTotal()
      const currentShop = localStorage.getItem('currentShop') || 'B'
      
      console.log('Applying coupon:', normalizedCode)
      
      const validationData = {
        offerCode: normalizedCode,
        orderTotal: orderTotal,
        shopId: currentShop,
        userType: user?.id ? "returning" : "new",
        userId: user?.id || "guest",
        currency: selectedCurrency,
        cartItems: validCartItems.map((item: any) => ({
          id: item.menuItem?.id || item.id,
          categoryId: item.menuItem?.category_id || item.category_id || item.categoryId,
          quantity: item.quantity,
          price: getCurrencySpecificPrice(item.menuItem, item.selected_variant)
        }))
      }

      console.log('Validation request data:', validationData)

      const response = await fetch('/api/offers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationData)
      })

      const result = await response.json()

      if (!response.ok || !result.valid) {
        let errorMessage = result.error || "Invalid offer code"
        let errorType: "error" | "warning" | "info" = "error"
        
        // Handle different error types with user-friendly messages
        if (isWelcomeCode) {
          if (result.error?.includes("already used this coupon") || 
              result.error?.includes("already been redeemed") ||
              result.error?.includes("already redeemed")) {
            errorMessage = "You have already used this welcome coupon. Each welcome coupon can only be used once."
            errorType = "error"
          } else if (result.error?.includes("expired") || 
                     result.error?.includes("has expired")) {
            errorMessage = "This welcome coupon has expired. Please use a different coupon."
            errorType = "warning"
          } else if (result.error?.includes("Minimum order value")) {
            const currencySymbol = selectedCurrency === 'AED' ? 'AED' : '₹'
            const minAmount = result.minPurchase || result.requiredAmount || '0'
            errorMessage = `Minimum order of ${currencySymbol}${minAmount} required for welcome coupons`
            errorType = "info"
          } else if (result.error?.includes("not yet valid")) {
            errorMessage = "This welcome coupon is not yet valid"
            errorType = "info"
          } else if (result.error?.includes("Please login")) {
            errorMessage = "Please login to use welcome coupons"
            errorType = "error"
          }
        } else {
          // Regular offers
          if (result.error?.includes("already used this coupon") || 
              result.error?.includes("already redeemed")) {
            errorMessage = "You have already used this offer. Try a different coupon code."
            errorType = "error"
          } else if (result.error?.includes("expired") || 
                     result.error?.includes("has expired")) {
            errorMessage = "This offer has expired. Please use a different coupon."
            errorType = "warning"
          } else if (result.error?.includes("Minimum order value")) {
            errorMessage = result.error
            errorType = "info"
          } else if (result.error?.includes("reached its usage limit")) {
            errorMessage = "This offer has reached its maximum usage limit"
            errorType = "error"
          }
        }
        
        setCouponError(errorMessage)
        setCouponErrorType(errorType)
        
        // Show appropriate toast based on error type
        if (errorType === "error") {
          toast.error(errorMessage, { 
            position: 'top-center', 
            duration: 5000,
            icon: '❌'
          })
        } else if (errorType === "warning") {
          toast.error(errorMessage, { 
            position: 'top-center', 
            duration: 5000,
            icon: '⚠️'
          })
        } else {
          toast.error(errorMessage, { 
            position: 'top-center', 
            duration: 5000,
            icon: 'ℹ️'
          })
        }
        
        setIsApplyingCoupon(false)
        return
      }

      // If we reach here, the coupon is valid
      const discountAmountFromBackend = result.type === "welcome" 
        ? result.coupon.discountAmount 
        : result.offer.discountAmount;
      
      const couponData: CouponData = {
        code: result.type === "welcome" ? result.coupon.code : result.offer.code,
        discount: result.type === "welcome" ? result.coupon.discountValue : result.offer.value,
        type: result.type === "welcome" ? result.coupon.discountType : result.offer.type,
        title: result.type === "welcome" ? result.coupon.title : result.offer.title,
        offerTitle: result.type === "welcome" ? result.coupon.title : result.offer.title,
        offerId: result.type === "welcome" ? result.coupon.id : result.offer.id,
        timestamp: Date.now(),
        expiresAt: result.type === "welcome" 
          ? result.coupon.validTo 
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isWelcomeCoupon: result.type === "welcome",
        discountAmount: discountAmountFromBackend,
        minPurchase: result.type === "welcome" ? parseFloat(result.coupon.minPurchase) : undefined,
        validFrom: result.type === "welcome" ? result.coupon.validFrom : undefined,
        validTo: result.type === "welcome" ? result.coupon.validTo : undefined
      }

      setAppliedCoupon(couponData)
      setDiscountAmount(discountAmountFromBackend)
      localStorage.setItem("appliedCoupon", JSON.stringify(couponData))
      
      // Show success message
      const discountText = formatPriceWithSmallDecimals(
        discountAmountFromBackend, 
        discountAmountFromBackend, 
        selectedCurrency, 
        true, 
        '#fff'
      ).replace(/<[^>]*>/g, '')
      
      const couponType = couponData.isWelcomeCoupon ? "Welcome coupon" : "Offer"
      toast.success(`${couponType} "${couponData.code}" applied! You saved ${discountText}`, { 
        position: 'top-center',
        icon: couponData.isWelcomeCoupon ? '🎁' : '🎉',
        duration: 5000
      })
      
      setCouponError("")
      
      // Clear coupon code input
      setCouponCode("")
      setIsCouponFieldOpen(false)
      
    } catch (error) {
      console.error("Error applying coupon:", error)
      setCouponError("Failed to apply coupon. Please try again.")
      setCouponErrorType("error")
      toast.error('Failed to apply coupon. Please try again.', { 
        position: 'top-center',
        duration: 4000 
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    if (appliedCoupon) {
      const couponType = appliedCoupon.isWelcomeCoupon ? "Welcome coupon" : "Coupon"
      toast.success(`${couponType} "${appliedCoupon.code}" removed`, { 
        position: 'top-center',
        icon: '🗑️'
      })
    }
    
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponCode("")
    setCouponError("")
    setCouponErrorType("error")
    localStorage.removeItem("appliedCoupon")
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
      couponType: appliedCoupon?.isWelcomeCoupon ? "welcome" : "regular",
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
        productImageUrl: item.menuItem.image_url || item.menuItem.image_urls?.[0] || null,
      })),
    }
    
    try {
      const result = await dispatch(submitOrder(orderData)).unwrap()
      
      // Track coupon usage ONLY after successful order placement
      if (appliedCoupon && user?.id) {
        try {
          console.log('Tracking coupon usage after successful order:', appliedCoupon.code)
          
          // Call the updated tracking API with simplified data
          const trackResponse = await fetch('/api/offers/track-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              offerId: appliedCoupon.offerId,
              userId: user.id,
              userEmail: user.email,
              // Send minimal data - just enough to mark as redeemed
              orderId: result.orderId || result.orderNumber,
              orderTotal: cartTotal,
              discountAmount: discountAmount,
              currency: selectedCurrency,
              couponType: appliedCoupon.isWelcomeCoupon ? 'welcome' : 'regular'
            })
          })
          
          const trackResult = await trackResponse.json();
          
          if (!trackResponse.ok) {
            console.error("Failed to track coupon usage:", trackResult.error);
            // Don't fail the order if tracking fails, just show a warning
            toast.error('Could not mark coupon as used. Please contact support.', {
              position: 'top-center',
              duration: 5000
            });
          } else {
            console.log('Coupon usage tracked successfully', trackResult);
          }
        } catch (trackError) {
          console.error("Error tracking coupon usage:", trackError)
          // Don't fail the order if usage tracking fails
        }
      }
      
      // Clear coupon state immediately to prevent revalidation on empty cart
      if (appliedCoupon) {
        // Add to used coupons list to prevent reuse in same session
        const usedCoupons = JSON.parse(localStorage.getItem("usedCoupons") || "[]")
        usedCoupons.push(appliedCoupon.code)
        localStorage.setItem("usedCoupons", JSON.stringify(usedCoupons))
        
        setAppliedCoupon(null)
        setCouponCode("")
        setDiscountAmount(0)
        setCouponError("")
        setCouponErrorType("error")
        localStorage.removeItem("appliedCoupon")
      }
      
      await clearCartAfterOrder()
      toast.success(`Order placed successfully! Order Number: ${result.orderNumber || result.orderId}`, { 
        position: 'top-center',
        icon: '✅',
        duration: 5000
      })
      router.push("/orders")
    } catch (error) {
      console.error("Failed to submit order:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to place order. Please try again."
      toast.error(errorMessage, { 
        position: 'top-center',
        duration: 5000 
      })
      throw error
    }
  }

  const handleSubmitOrder = async () => {
    // Validation checks
    if (!isAuthenticated) {
      openModal()
      toast.error('Please login to place an order', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }
    
    if (validCartItems.length === 0) {
      toast.error(`No items available for ${selectedCurrency}. Please add items or switch currency.`, { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    const cartTotal = calculateCartTotal()
    const minOrderAmount = selectedCurrency === 'AED' ? 20 : 100
    if (cartTotal < minOrderAmount) {
      toast.error(`Minimum order amount is ${selectedCurrency === 'AED' ? 'AED 20' : '₹100'}`, { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    // Check coupon minimum purchase if applied
    if (appliedCoupon?.minPurchase && cartTotal < appliedCoupon.minPurchase) {
      const currencySymbol = selectedCurrency === 'AED' ? 'AED' : '₹'
      const amountNeeded = (appliedCoupon.minPurchase - cartTotal).toFixed(2)
      toast.error(`Minimum ${currencySymbol}${appliedCoupon.minPurchase} required for this coupon. Add ${currencySymbol}${amountNeeded} more.`, { 
        position: 'top-center',
        duration: 5000 
      })
      return
    }

    if (!customerInfo.phone) {
      toast.error('Phone number is required to place an order', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }
    
    if (orderType === "delivery" && !customerInfo.deliveryAddress) {
      toast.error('Delivery address is required for delivery orders', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }
    
    if (orderType === "delivery") {
      const requiredFields = [detailedAddress.street, detailedAddress.area, detailedAddress.city, detailedAddress.state]
      if (selectedCurrency === 'INR') {
        requiredFields.push(detailedAddress.pincode)
      }

      if (requiredFields.some(field => !field)) {
        const missingField = selectedCurrency === 'INR' 
          ? 'Please complete all required address fields including PIN code' 
          : 'Please complete all required address fields (PIN code is optional for UAE)'
        toast.error(missingField, { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }
    }
    
    // Proceed with payment based on method
    if (paymentMethod === "upi" && selectedCurrency === 'INR') {
      try {
        setIsProcessingPayment(true)
        const razorpayResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: (calculateCartTotal() + deliveryFee - discountAmount),
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
              toast.error('Payment verification failed. Please try again.', { 
                position: 'top-center',
                duration: 4000 
              })
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
              toast.error('Payment cancelled', { 
                position: 'top-center',
                duration: 3000 
              })
            }
          }
        }
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } catch (error) {
        console.error("Failed to create payment order:", error)
        toast.error('Failed to initiate payment. Please try again.', { 
          position: 'top-center',
          duration: 4000 
        })
        setIsProcessingPayment(false)
      }
    } else {
      // COD payment
      await submitOrderAfterPayment()
    }
  }

  const handleWhatsAppOrder = () => {
    if (validCartItems.length === 0) {
      toast.error(`No items available for ${selectedCurrency}. Please add items or switch currency.`, { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    const cartTotal = calculateCartTotal()
    const minOrderAmount = selectedCurrency === 'AED' ? 20 : 100
    if (cartTotal < minOrderAmount) {
      toast.error(`Minimum order amount is ${selectedCurrency === 'AED' ? 'AED 20' : '₹100'}`, { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    // Validate customer information
    const customerName = user?.name || customerInfo.name || ""
    const customerPhone = customerInfo.phone || ""
    const customerEmail = user?.email || customerInfo.email || ""

    // Check mandatory fields
    if (!customerName || customerName.trim() === "") {
      toast.error('Please enter your name', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    if (!customerPhone || customerPhone.trim() === "") {
      toast.error('Please enter your phone number', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    const phoneRegex = /^[0-9]{10,15}$/
    if (!phoneRegex.test(customerPhone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error('Please enter a valid phone number', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }

    // For delivery orders, validate all address fields based on location
    if (orderType === 'delivery') {
      if (!detailedAddress.street || detailedAddress.street.trim() === "") {
        toast.error('Please enter your street address', { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }

      if (!detailedAddress.area || detailedAddress.area.trim() === "") {
        toast.error('Please enter your area/locality', { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }

      if (!detailedAddress.city || detailedAddress.city.trim() === "") {
        toast.error('Please enter your city', { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }

      if (!detailedAddress.state || detailedAddress.state.trim() === "") {
        const stateLabel = selectedCurrency === 'AED' ? 'Emirate' : 'State'
        toast.error(`Please enter your ${stateLabel}`, { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }

      // Validate PIN/Postal Code
      if (selectedCurrency === 'INR') {
        if (!detailedAddress.pincode || detailedAddress.pincode.trim() === "") {
          toast.error('Please enter your PIN code', { 
            position: 'top-center',
            duration: 4000 
          })
          return
        }
        const pinRegex = /^[0-9]{6}$/
        if (!pinRegex.test(detailedAddress.pincode)) {
          toast.error('Please enter a valid 6-digit PIN code', { 
            position: 'top-center',
            duration: 4000 
          })
          return
        }
      } else if (selectedCurrency === 'AED') {
        if (detailedAddress.pincode && detailedAddress.pincode.trim() !== "") {
          const postalRegex = /^[0-9]{5}$/
          if (!postalRegex.test(detailedAddress.pincode)) {
            toast.error('Please enter a valid 5-digit postal code', { 
              position: 'top-center',
              duration: 4000 
            })
            return
          }
        }
      }

      if (!customerInfo.deliveryAddress || customerInfo.deliveryAddress.trim() === "") {
        toast.error('Please complete your delivery address', { 
          position: 'top-center',
          duration: 4000 
        })
        return
      }
    }

    // WhatsApp ordering
    const finalTotal = cartTotal + deliveryFee - discountAmount
    const totalText = selectedCurrency === 'AED' ? `AED ${finalTotal.toFixed(2)}` : `₹${finalTotal.toFixed(2)}`
    const orderNumber = `#${Date.now().toString().slice(-6)}`

    // Create WhatsApp template
    let message = `*SABS ONLINE ORDER* ${orderNumber}\n`
    message += `═════════════════\n\n`
    
    // Customer Info Section
    message += `*CUSTOMER INFO*\n`
    message += `Name: ${customerName === "Customer" ? "_Please provide your name_" : customerName}\n`
    if (customerPhone) message += `Phone: ${customerPhone}\n`
    if (customerEmail) message += `Email: ${customerEmail}\n`
    
    // Coupon Applied
    if (appliedCoupon) {
      message += `Coupon: ${appliedCoupon.code} (${appliedCoupon.isWelcomeCoupon ? 'Welcome' : 'Regular'})\n`
    }
    message += `\n`

    // Order Details Section
    message += `*ORDER DETAILS*\n`
    message += `Type: ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}\n`
    message += `Payment: ${paymentMethod === 'upi' ? 'UPI' : 'COD'}\n`
    if (orderType === "delivery" && customerInfo.deliveryAddress) {
      message += `Address: ${customerInfo.deliveryAddress}\n`
    }
    message += `\n`

    // Items Section 
    message += `═════════════════\n`
    message += `*ITEMS ORDERED*\n`
    validCartItems.forEach((item, index) => {
      const itemPrice = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
      const variantName = item.selected_variant?.name || ''
      const itemName = item.menuItem.name
      const priceText = selectedCurrency === 'AED' ? `AED ${itemPrice.toFixed(2)}` : `₹ ${itemPrice.toFixed(2)}`
      
      const stockWarning = item.selected_variant && item.selected_variant.stock_quantity <= 5 ?
        (item.selected_variant.stock_quantity === 0 ? ' OUT OF STOCK' : ` ${item.selected_variant.stock_quantity} left`) : ''
      
      const formattedVariant = variantName && variantName !== 'Default' ? ` (${variantName})` : ''
      message += `${index + 1}. *${itemName}${formattedVariant}*\n`
      message += `    Qty: ${item.quantity} x ${priceText}${stockWarning}\n`
    })

    // Bill Summary 
    message += `═════════════════\n`
    message += `*BILL SUMMARY*\n`
    const subtotalText = selectedCurrency === 'AED' ? `AED ${cartTotal.toFixed(2)}` : `₹ ${cartTotal.toFixed(2)}`
    message += `Items Total: ${subtotalText}\n`
    
    if (deliveryFee > 0) {
      const deliveryText = selectedCurrency === 'AED' ? `AED ${deliveryFee.toFixed(2)}` : `₹ ${deliveryFee.toFixed(2)}`
      message += `Delivery: ${deliveryText}\n`
    } else if (orderType === "delivery") {
      message += `Delivery: FREE!\n`
    }
    
    if (discountAmount > 0 && appliedCoupon) {
      const discountText = selectedCurrency === 'AED' ? `AED ${discountAmount.toFixed(2)}` : `₹ ${discountAmount.toFixed(2)}`
      message += `Discount (${appliedCoupon.code}): -${discountText}\n`
    }
    
    message += `═════════════════\n`
    message += `*TOTAL: ${totalText}*\n`
    message += `═════════════════\n\n`

    // Special Instructions
    if (specialInstructions) {
      message += `*SPECIAL NOTES*\n${specialInstructions}\n\n`
    }

    // Payment Information for Online Payment
    if (paymentMethod === 'upi') {
      message += `*PAYMENT DETAILS*\n`
      message += `UPI ID: althukp1@okaxis\n`
      message += `GPay: 9037888193\n`
      message += `\n`
      message += `Please send payment screenshot after completing payment\n\n`
    }

    // Call to Action 
    message += `Please *CONFIRM* this order\n`
    message += `When will this be dispatched?\n\n`
    message += `Thank you!`
    
    const phoneNumber = WHATSAPP_ORDER_NUMBER || "+919037888193"
    
    if (!phoneNumber) {
      toast.error('WhatsApp number not configured. Please contact support.', { 
        position: 'top-center',
        duration: 4000 
      })
      return
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhoneNumber}`
    const url = new URL(whatsappUrl)
    url.searchParams.set('text', message)
    
    try {
      window.open(url.toString(), "_blank")
      toast.success('Order sent via WhatsApp! Check your WhatsApp app.', { 
        position: 'top-center',
        duration: 4000 
      })
    } catch (error) {
      console.error('Failed to open WhatsApp:', error)
      try {
        const fallbackUrl = `https://wa.me/${cleanPhoneNumber}`
        window.open(fallbackUrl, "_blank")
        toast.success('WhatsApp opened! Please copy and paste your order details.', { 
          position: 'top-center',
          duration: 4000 
        })
      } catch (fallbackError) {
        toast.error('Failed to open WhatsApp. Please try again.', { 
          position: 'top-center',
          duration: 4000 
        })
      }
    }
  }

  // Dynamic delivery fee calculation
  const calculateDeliveryFee = () => {
    if (orderType !== "delivery") return 0

    const cartTotal = calculateCartTotal()
    if (selectedCurrency === 'AED') {
      if (cartTotal >= 200) {
        return 0
      } else if (cartTotal >= 50) {
        return 10
      } else {
        return 20
      }
    } else {
      return cartTotal >= 3000 ? 0 : 70
    }
  }

  // Function to get delivery fee message
  const getDeliveryFeeMessage = () => {
    if (orderType !== "delivery") return null

    const cartTotal = calculateCartTotal()
    const currentDeliveryFee = calculateDeliveryFee()

    if (currentDeliveryFee === 0) return null

    if (selectedCurrency === 'AED') {
      if (cartTotal >= 50) {
        const amountNeeded = 200 - cartTotal
        return {
          type: 'info',
          message: `Shop for AED ${amountNeeded.toFixed(2)} more to get FREE delivery!`,
          icon: '🚚'
        }
      } else {
        const amountForReducedFee = 50 - cartTotal
        const amountForFree = 200 - cartTotal
        return {
          type: 'warning',
          message: `Shop for AED ${amountForReducedFee.toFixed(2)} more to get AED 10 off delivery or spend AED ${amountForFree.toFixed(2)} for FREE delivery!`,
          icon: '💰'
        }
      }
    } else {
      const amountNeeded = 3000 - cartTotal
      return {
        type: 'info',
        message: `Shop for ₹${amountNeeded.toFixed(2)} more to get FREE delivery!`,
        icon: '🚚'
      }
    }
  }

  const deliveryFee = calculateDeliveryFee()
  const deliveryMessage = getDeliveryFeeMessage()
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
                    Available Items 
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validCartItems.map((item) => {
                    const itemPrice = getCurrencySpecificPrice(item.menuItem, item.selected_variant)
                    const variantName = item.selected_variant?.name || ''
                    const itemName = item.menuItem.name
                    const isAvailable = hasSelectedCurrencyPrice(item.menuItem, item.selected_variant)

                    return (
                      <div key={item.menuItem.id} className="border rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden p-4 space-y-3">
                          <div className="flex gap-3">
                            <Image
                              src={
                                item.menuItem.image_url ||
                                item.menuItem.image_urls?.[0] ||
                                `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                              }
                              alt={itemName}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover w-20 h-20 flex-shrink-0 shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{itemName}</h3>
                              {variantName && variantName !== 'Default' && (
                                <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium mt-1">
                                  {variantName}
                                </span>
                              )}
                              <div className="mt-2">
                                {isAvailable && itemPrice > 0 ? (
                                  <p className="font-bold text-lg text-gray-900">
                                    {formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')}
                                    <span className="text-sm text-gray-500 font-normal ml-1">per item</span>
                                  </p>
                                ) : (
                                  <p className="font-bold text-base text-red-600">
                                    Unavailable in {selectedCurrency === 'AED' ? 'UAE' : 'India'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">Qty:</span>
                              <div className="flex items-center bg-white rounded-lg border shadow-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.menuItem.id, item.quantity - 1)}
                                  className="p-1.5 hover:bg-gray-100 rounded-l-lg"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-semibold text-sm bg-gray-50 py-1.5">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.menuItem.id, item.quantity + 1)}
                                  className="p-1.5 hover:bg-gray-100 rounded-r-lg"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-bold text-lg text-orange-600">
                                  {formatPriceWithSmallDecimals(itemPrice * item.quantity, itemPrice * item.quantity, selectedCurrency, true, '#000')}
                                </p>
                                <p className="text-xs text-gray-500">total</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.menuItem.id, 0)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 p-1.5 rounded-lg"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Stock Warning for Mobile */}
                          {item.selected_variant && item.selected_variant.stock_quantity <= 5 && (
                            <div className="flex items-center gap-2 bg-orange-50 p-2 rounded-lg mt-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <p className="text-sm text-orange-700 font-medium">
                                {item.selected_variant.stock_quantity === 0 ? 'Out of Stock' : `Only ${item.selected_variant.stock_quantity} left in stock`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex sm:items-center gap-4 p-6">
                          <Image
                            src={
                              item.menuItem.image_url ||
                              item.menuItem.image_urls?.[0] ||
                              `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                            }
                            alt={itemName}
                            width={90}
                            height={90}
                            className="rounded-xl object-cover w-24 h-24 shadow-sm flex-shrink-0"
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
                                {isAvailable && itemPrice > 0 ? (
                                  <>
                                    <p className="font-bold text-lg text-gray-900">
                                      {formatPriceWithSmallDecimals(itemPrice, itemPrice, selectedCurrency, true, '#000')}
                                    </p>
                                    <p className="text-sm text-gray-500">per item</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-bold text-lg text-red-600">
                                      Unavailable
                                    </p>
                                    <p className="text-sm text-red-500">in {selectedCurrency === 'AED' ? 'UAE' : 'India'}</p>
                                  </>
                                )}
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
                            
                            {/* Stock Warning for Desktop */}
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
                    const itemName = item.menuItem.name
                    const variantName = item.selected_variant?.name || ''
                    return (
                      <div key={item.menuItem.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 border-2 border-red-200 rounded-xl bg-gradient-to-r from-red-50 to-orange-50">
                        <Image
                          src={
                            item.menuItem.image_url ||
                            item.menuItem.image_urls?.[0] ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(itemName)}`
                          }
                          alt={itemName}
                          width={90}
                          height={90}
                          className="rounded-xl object-cover w-20 h-20 sm:w-24 sm:h-24 grayscale opacity-70"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-gray-700">{itemName}</h3>
                          {variantName && variantName !== 'Default' && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                                {variantName}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
                              <XCircle className="w-4 h-4" />
                              Unavailable in {selectedCurrency === 'AED' ? "UAE" : "India"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This variant is not available in your selected region
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm font-medium">Qty: {item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.menuItem.id, 0)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg"
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
                    {appliedCoupon?.isWelcomeCoupon && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Eligible for welcome coupons
                      </p>
                    )}
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
                        <Label htmlFor="pincode" className="text-sm">
                          {selectedCurrency === 'AED' ? 'Postal Code (Optional)' : 'PIN Code *'}
                        </Label>
                        <Input
                          id="pincode"
                          value={detailedAddress.pincode}
                          onChange={(e) => {
                            setDetailedAddress(prev => ({ ...prev, pincode: e.target.value }))
                            const fullAddress = `${detailedAddress.street}, ${detailedAddress.area}, ${detailedAddress.city}, ${detailedAddress.state}, ${detailedAddress.country} - ${e.target.value}`
                            dispatch(setCustomerInfo({ info: { deliveryAddress: fullAddress.trim() }, userId: user?.id }))
                          }}
                          required={selectedCurrency === 'INR'}
                          className="text-sm rounded-lg"
                          placeholder={selectedCurrency === 'AED' ? "12345 (Optional)" : "400001"}
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
                      {(selectedCurrency === 'AED' && cartTotal < 20) || (selectedCurrency === 'INR' && cartTotal < 100) ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-700">
                              Minimum order: {selectedCurrency === 'AED' ? 'AED 20' : '₹100'}
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
                      {deliveryMessage && (
                         <div className={`p-3 rounded-lg text-sm ${
                           deliveryMessage.type === 'success' 
                             ? 'bg-green-50 border border-green-200 text-green-800' 
                             : deliveryMessage.type === 'info'
                             ? 'bg-blue-50 border border-blue-200 text-blue-800'
                             : 'bg-orange-50 border border-orange-200 text-orange-800'
                         }`}>
                           <div className="flex items-start gap-2">
                             <span className="text-lg">{deliveryMessage.icon}</span>
                             <span className="flex-1">{deliveryMessage.message}</span>
                           </div>
                         </div>
                       )}
                       
                       {/* Welcome Coupon Display */}
                       {appliedCoupon?.isWelcomeCoupon && (
                         <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                 <Gift className="w-4 h-4 text-purple-600" />
                               </div>
                               <div>
                                 <span className="font-bold text-purple-800 text-sm">Welcome Bonus!</span>
                                 <div className="text-xs text-purple-600 font-mono">{appliedCoupon.code}</div>
                               </div>
                             </div>
                             <Button
                               onClick={handleRemoveCoupon}
                               variant="ghost"
                               size="sm"
                               className="text-purple-600 hover:text-red-600 hover:bg-red-50 rounded-full p-1.5 h-auto transition-colors"
                               aria-label="Remove welcome coupon"
                             >
                               <XCircle className="w-4 h-4" />
                             </Button>
                           </div>
                           
                           {/* Offer Details */}
                           <div className="bg-white/60 rounded-lg p-3 mb-3">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-purple-700 font-medium">
                                  {appliedCoupon.type === 'flat' || appliedCoupon.type === 'cash'
                                    ? `${selectedCurrency} ${appliedCoupon.discount} Flat Discount` 
                                    : `${appliedCoupon.discount}% Welcome Discount`}
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">
                                  WELCOME
                                </span>
                             </div>
                             {appliedCoupon.minPurchase && (
                               <div className="text-xs text-purple-600 mt-2">
                                 Min. purchase: {selectedCurrency} {appliedCoupon.minPurchase}
                               </div>
                             )}
                           </div>
                           
                           {/* Price Breakdown */}
                           <div className="space-y-3 text-sm">
                             <div className="flex justify-between items-center">
                               <span className="text-gray-700">Subtotal + Delivery</span>
                               <span className="font-medium text-gray-900">
                                 {formatPriceWithSmallDecimals(subtotalWithDelivery, subtotalWithDelivery, selectedCurrency, true, '#111827')}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center border-t border-purple-100 pt-2">
                               <span className="text-purple-700">Discount Applied</span>
                               <span className="font-bold text-purple-600">
                                 -{formatPriceWithSmallDecimals(discountAmount, discountAmount, selectedCurrency, true, '#7c3aed')}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center border-t-2 border-purple-200 pt-2 bg-purple-100/50 rounded-lg px-3 py-2 -mx-1">
                               <span className="font-bold text-purple-800">You Pay</span>
                               <span className="font-bold text-lg text-purple-800">
                                 {formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#5b21b6')}
                               </span>
                             </div>
                           </div>
                         </div>
                       )}
                       
                       {/* Regular Coupon Display */}
                       {appliedCoupon && !appliedCoupon.isWelcomeCoupon && (
                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                 <CheckCircle className="w-4 h-4 text-green-600" />
                               </div>
                               <div>
                                 <span className="font-bold text-green-800 text-sm">Offer Applied</span>
                                 <div className="text-xs text-green-600 font-mono">{appliedCoupon.code}</div>
                               </div>
                             </div>
                             <Button
                               onClick={handleRemoveCoupon}
                               variant="ghost"
                               size="sm"
                               className="text-green-600 hover:text-red-600 hover:bg-red-50 rounded-full p-1.5 h-auto transition-colors"
                               aria-label="Remove coupon"
                             >
                               <XCircle className="w-4 h-4" />
                             </Button>
                           </div>
                           
                           {/* Offer Details */}
                           <div className="bg-white/60 rounded-lg p-3 mb-3">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-green-700 font-medium">
                                  {appliedCoupon.type === 'cash' || appliedCoupon.type === 'flat'
                                    ? `${selectedCurrency} ${appliedCoupon.discount} Cash Offer` 
                                    : `${appliedCoupon.discount}% Discount Offer`}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                  APPLIED
                                </span>
                             </div>
                           </div>
                           
                           {/* Price Breakdown */}
                           <div className="space-y-3 text-sm">
                             <div className="flex justify-between items-center">
                               <span className="text-gray-700">Subtotal + Delivery</span>
                               <span className="font-medium text-gray-900">
                                 {formatPriceWithSmallDecimals(subtotalWithDelivery, subtotalWithDelivery, selectedCurrency, true, '#111827')}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center border-t border-green-100 pt-2">
                               <span className="text-green-700">Discount Applied</span>
                               <span className="font-bold text-green-600">
                                 -{formatPriceWithSmallDecimals(discountAmount, discountAmount, selectedCurrency, true, '#059669')}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center border-t-2 border-green-200 pt-2 bg-green-100/50 rounded-lg px-3 py-2 -mx-1">
                               <span className="font-bold text-green-800">You Pay</span>
                               <span className="font-bold text-lg text-green-800">
                                 {formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#166534')}
                               </span>
                             </div>
                           </div>
                         </div>
                       )}
                       
                       <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                          <span>Final Total</span>
                          <div className="text-right">
                            <div className={`${appliedCoupon && discountAmount > 0 ? 
                              (appliedCoupon.isWelcomeCoupon ? 'text-purple-600' : 'text-green-600') 
                              : 'text-gray-900'} font-bold`}>
                              {formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, 
                                appliedCoupon?.isWelcomeCoupon ? '#7c3aed' : 
                                appliedCoupon ? '#059669' : '#000')}
                            </div>
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
                                <Label htmlFor="coupon" className="text-sm sm:text-base">
                                  Enter Coupon Code (Welcome coupons start with WELCOME)
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="coupon"
                                    value={couponCode}
                                    onChange={(e) => {
                                      setCouponCode(e.target.value)
                                      setCouponError("")
                                      setCouponErrorType("error")
                                    }}
                                    placeholder="e.g., WELCOME50 or CASH100..."
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
                                  <div className={`flex items-center gap-1 text-xs sm:text-sm rounded-lg p-2 mt-1 ${
                                    couponErrorType === 'error' 
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : couponErrorType === 'warning'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {couponErrorType === 'error' ? (
                                      <XCircle className="w-4 h-4 flex-shrink-0" />
                                    ) : couponErrorType === 'warning' ? (
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                      <Info className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <span className="ml-1">{couponError}</span>
                                  </div>
                                )}
                                {couponCode.trim().toUpperCase().startsWith('WELCOME') && !isAuthenticated && (
                                  <div className="flex items-center gap-1 text-amber-600 text-xs sm:text-sm bg-amber-50 p-2 rounded-lg">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Login required for welcome coupons</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`p-3 rounded-lg ${appliedCoupon.isWelcomeCoupon ? 'bg-gradient-to-r from-purple-50 to-indigo-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {appliedCoupon.isWelcomeCoupon ? (
                                  <Gift className="w-5 h-5 text-purple-500" />
                                ) : (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                                <div>
                                  <div className={`font-medium ${appliedCoupon.isWelcomeCoupon ? 'text-purple-800' : 'text-green-800'} text-sm sm:text-base`}>
                                    {appliedCoupon.isWelcomeCoupon ? 'Welcome Coupon Applied!' : 'Coupon Applied!'}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600">
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
                          {loading ? "Processing..." : 
                           isProcessingPayment ? "Processing Payment..." :
                           isAuthenticated ? "Place Order" : "Login to Place Order"}
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
                                  Pay {formatPriceWithSmallDecimals(finalTotal, finalTotal, selectedCurrency, true, '#fff')}
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
