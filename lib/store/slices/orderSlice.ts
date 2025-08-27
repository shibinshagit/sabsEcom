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
}

// Load cart from localStorage with user-specific key
const loadCartFromStorage = (userId?: string | number): CartItem[] => {
  if (typeof window !== 'undefined' && userId) {
    try {
      const savedCart = localStorage.getItem(`cart_${userId}`)
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('Error loading cart from storage:', error)
      return []
    }
  }
  return []
}

// Save cart to localStorage with user-specific key
const saveCartToStorage = (cart: CartItem[], userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(cart))
    } catch (error) {
      console.error('Error saving cart to storage:', error)
    }
  }
}

// Clear user-specific cart from localStorage
const clearCartFromStorage = (userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.removeItem(`cart_${userId}`)
    } catch (error) {
      console.error('Error clearing cart from storage:', error)
    }
  }
}

// Save customer info to localStorage with user-specific key
const saveCustomerInfoToStorage = (customerInfo: any, userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`customerInfo_${userId}`, JSON.stringify(customerInfo))
    } catch (error) {
      console.error('Error saving customer info to storage:', error)
    }
  }
}

// Load customer info from localStorage with user-specific key
const loadCustomerInfoFromStorage = (userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      const savedInfo = localStorage.getItem(`customerInfo_${userId}`)
      return savedInfo ? JSON.parse(savedInfo) : null
    } catch (error) {
      console.error('Error loading customer info from storage:', error)
      return null
    }
  }
  return null
}

// Helper function to check if item has valid currency price
const hasValidCurrencyPrice = (item: MenuItem, currency: string): boolean => {
  if (currency === 'AED' && item.price_aed && item.price_aed > 0) {
    return true
  } else if (currency === 'INR' && item.price_inr && item.price_inr > 0) {
    return true
  }
  return false
}

// Helper function to get currency-specific price
const getCurrencyPrice = (item: MenuItem, currency: string): number => {
  if (currency === 'AED' && item.price_aed && item.price_aed > 0) {
    return item.price_aed
  } else if (currency === 'INR' && item.price_inr && item.price_inr > 0) {
    return item.price_inr
  }
  return item.price // fallback to default price
}

// Helper function to calculate total based on selected currency (only valid items)
const calculateTotal = (cart: CartItem[], selectedCurrency: string) => {
  return cart
    .filter(item => hasValidCurrencyPrice(item.menuItem, selectedCurrency))
    .reduce((sum, item) => {
      const price = getCurrencyPrice(item.menuItem, selectedCurrency)
      return sum + price * item.quantity
    }, 0)
}

export const submitOrder = createAsyncThunk("order/submit", async (orderData: any) => {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  })
  if (!response.ok) throw new Error("Failed to submit order")
  return response.json()
})

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
      saveCartToStorage(state.cart, userId)
    },
    
    removeFromCart: (state, action: PayloadAction<{ 
      id: number; 
      userId?: string | number 
    }>) => {
      const { id, userId } = action.payload
      state.cart = state.cart.filter((item) => item.menuItem.id !== id)
      state.total = calculateTotal(state.cart, 'AED')
      saveCartToStorage(state.cart, userId)
    },
    
    updateQuantity: (state, action: PayloadAction<{ 
      id: number; 
      quantity: number;
      userId?: string | number;
    }>) => {
      const { id, quantity, userId } = action.payload
      const item = state.cart.find((item) => item.menuItem.id === id)
      
      if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) {
          state.cart = state.cart.filter((cartItem) => cartItem.menuItem.id !== id)
        }
      }
      
      state.total = calculateTotal(state.cart, 'AED')
      saveCartToStorage(state.cart, userId)
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
      const { info, userId } = action.payload
      state.customerInfo = { ...state.customerInfo, ...info }
      saveCustomerInfoToStorage(state.customerInfo, userId)
    },
    
    clearCart: (state, action: PayloadAction<{ userId?: string | number }>) => {
      const { userId } = action.payload
      state.cart = []
      state.total = 0
      clearCartFromStorage(userId)
    },
    
    removeInvalidCurrencyItems: (state, action: PayloadAction<{
      selectedCurrency: string;
      userId?: string | number;
    }>) => {
      const { selectedCurrency, userId } = action.payload
      state.cart = state.cart.filter(item => hasValidCurrencyPrice(item.menuItem, selectedCurrency))
      state.total = calculateTotal(state.cart, selectedCurrency)
      saveCartToStorage(state.cart, userId)
    },
    
    loadUserCart: (state, action: PayloadAction<{ 
      userId?: string | number;
      selectedCurrency?: string;
    }>) => {
      const { userId, selectedCurrency } = action.payload
      const savedCart = loadCartFromStorage(userId)
      const savedCustomerInfo = loadCustomerInfoFromStorage(userId)
      
      state.cart = savedCart
      if (savedCustomerInfo) {
        state.customerInfo = { ...state.customerInfo, ...savedCustomerInfo }
      }
      
      const currency = selectedCurrency || 'AED'
      state.total = calculateTotal(state.cart, currency)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.loading = false
        state.cart = []
        state.total = 0
        const userId = action.meta.arg.userId
        clearCartFromStorage(userId)
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to submit order"
      })
  },
})

// Export only the Redux actions (not helper functions)
export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  recalculateTotal, 
  setOrderType, 
  setCustomerInfo, 
  clearCart,
  removeInvalidCurrencyItems,
  loadUserCart
} = orderSlice.actions

export default orderSlice.reducer
