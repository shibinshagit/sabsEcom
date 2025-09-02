import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { MenuItem } from "@/lib/database"

interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialRequests?: string
}

interface OrderState {
  cart: CartItem[]
  total: number
  orderType: "dine-in" | "takeaway" | "delivery"
  customerInfo: {
    name: string
    email: string
    phone: string
    tableNumber?: number
    deliveryAddress?: string
  }
  loading: boolean
  error: string | null
  razorpayOrder: any | null
  paymentStatus: 'idle' | 'creating' | 'processing' | 'success' | 'failed'
}

const initialState: OrderState = {
  cart: [],
  total: 0,
  orderType: "dine-in",
  customerInfo: {
    name: "",
    email: "",
    phone: "",
  },
  loading: false,
  error: null,
  razorpayOrder: null,
  paymentStatus: 'idle',
}

export const fetchCartFromAPI = createAsyncThunk(
  'cart/fetchFromAPI',
  async ({ userId, selectedCurrency }: { userId: string; selectedCurrency: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart?userId=${userId}&currency=${selectedCurrency}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - user not logged in')
          return { cart: [], total: 0 }
        }
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Fetch cart failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cart')
    }
  }
)

export const saveCartToAPI = createAsyncThunk(
  'cart/saveToAPI',
  async ({ userId, cart, selectedCurrency }: { userId: string; cart: CartItem[]; selectedCurrency: string }, { rejectWithValue }) => {
    try {      
      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, cart, selectedCurrency }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Save cart failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save cart')
    }
  }
)

export const createRazorpayOrder = createAsyncThunk(
  'order/createRazorpayOrder',
  async ({ amount, currency }: { amount: number; currency: string }, { rejectWithValue }) => {
    try {
      const receipt = `order_${Date.now()}`
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, receipt }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment order')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Payment order creation failed')
    }
  }
)

export const verifyRazorpayPayment = createAsyncThunk(
  'order/verifyRazorpayPayment',
  async (paymentData: any, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Payment verification failed')
    }
  }
)

const hasValidCurrencyPrice = (item: MenuItem, currency: string): boolean => {
  if (currency === 'AED' && item.price_aed && item.price_aed > 0) {
    return true
  } else if (currency === 'INR' && item.price_inr && item.price_inr > 0) {
    return true
  }
  return false
}

const getCurrencyPrice = (item: MenuItem, currency: string): number => {
  if (currency === 'AED' && item.price_aed && item.price_aed > 0) {
    return item.price_aed
  } else if (currency === 'INR' && item.price_inr && item.price_inr > 0) {
    return item.price_inr
  }
  return item.price 
}

const calculateTotal = (cart: CartItem[], selectedCurrency: string) => {
  return cart
    .filter(item => hasValidCurrencyPrice(item.menuItem, selectedCurrency))
    .reduce((sum, item) => {
      const price = getCurrencyPrice(item.menuItem, selectedCurrency)
      return sum + price * item.quantity
    }, 0)
}

export const submitOrder = createAsyncThunk(
  "order/submit", 
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Submit order failed:", error)
      return rejectWithValue(error instanceof Error ? error.message : "Failed to submit order")
    }
  }
)

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ 
      menuItem: MenuItem; 
      quantity: number; 
      specialRequests?: string; 
      selectedCurrency?: string;
      userId?: string | number;
    }>) => {
      const { menuItem, quantity, specialRequests, selectedCurrency, userId } = action.payload
      const existingItem = state.cart.find((item) => item.menuItem.id === menuItem.id)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        state.cart.push({
          menuItem,
          quantity,
          specialRequests
        })
      }
      
      const currency = selectedCurrency || 'AED'
      state.total = calculateTotal(state.cart, currency)
    },
    
    removeFromCart: (state, action: PayloadAction<{ 
      id: number; 
      userId?: string | number 
    }>) => {
      const { id } = action.payload
      state.cart = state.cart.filter((item) => item.menuItem.id !== id)
      state.total = calculateTotal(state.cart, 'AED')
    },
    
    updateQuantity: (state, action: PayloadAction<{ 
      id: number; 
      quantity: number;
      userId?: string | number;
    }>) => {
      const { id, quantity } = action.payload
      const item = state.cart.find((item) => item.menuItem.id === id)
      
      if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) {
          state.cart = state.cart.filter((cartItem) => cartItem.menuItem.id !== id)
        }
      }
      
      state.total = calculateTotal(state.cart, 'AED')
    },
    
    recalculateTotal: (state, action: PayloadAction<string>) => {
      const selectedCurrency = action.payload
      state.total = calculateTotal(state.cart, selectedCurrency)
    },
    
    setOrderType: (state, action: PayloadAction<"dine-in" | "takeaway" | "delivery">) => {
      state.orderType = action.payload
    },
    
    setCustomerInfo: (state, action: PayloadAction<{
      info: Partial<OrderState["customerInfo"]>;
      userId?: string | number;
    }>) => {
      const { info } = action.payload
      state.customerInfo = { ...state.customerInfo, ...info }
    },
    
    clearCart: (state, action: PayloadAction<{ userId?: string | number }>) => {
      state.cart = []
      state.total = 0
      state.error = null
    },
    
    removeInvalidCurrencyItems: (state, action: PayloadAction<{
      selectedCurrency: string;
      userId?: string | number;
    }>) => {
      const { selectedCurrency } = action.payload
      state.cart = state.cart.filter(item => hasValidCurrencyPrice(item.menuItem, selectedCurrency))
      state.total = calculateTotal(state.cart, selectedCurrency)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartFromAPI.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCartFromAPI.fulfilled, (state, action) => {
        state.loading = false
        state.cart = action.payload.cart || []
        state.total = action.payload.total || 0
        state.error = null
      })
      .addCase(fetchCartFromAPI.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    builder
      .addCase(saveCartToAPI.pending, (state) => {
        state.error = null
      })
      .addCase(saveCartToAPI.fulfilled, (state) => {
        state.error = null
      })
      .addCase(saveCartToAPI.rejected, (state, action) => {
        state.error = action.payload as string
      })

    builder
      .addCase(createRazorpayOrder.pending, (state) => {
        state.paymentStatus = 'creating'
        state.error = null
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.paymentStatus = 'idle'
        state.razorpayOrder = action.payload
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.paymentStatus = 'failed'
        state.error = action.payload as string
      })
      
    builder
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentStatus = 'processing'
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.paymentStatus = 'success'
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.paymentStatus = 'failed'
        state.error = action.payload as string
      })

    builder
      .addCase(submitOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitOrder.fulfilled, (state) => {
        state.loading = false
        state.paymentStatus = 'idle'
        state.razorpayOrder = null
        state.error = null
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  recalculateTotal, 
  setOrderType, 
  setCustomerInfo, 
  clearCart,
  removeInvalidCurrencyItems,
} = orderSlice.actions

export default orderSlice.reducer
