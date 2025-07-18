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
    addToCart: (state, action: PayloadAction<{ menuItem: MenuItem; quantity: number; specialRequests?: string }>) => {
      const existingItem = state.cart.find((item) => item.menuItem.id === action.payload.menuItem.id)
      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.cart.push(action.payload)
      }
      state.total = state.cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cart = state.cart.filter((item) => item.menuItem.id !== action.payload)
      state.total = state.cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
    },
    updateQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.cart.find((item) => item.menuItem.id === action.payload.id)
      if (item) {
        item.quantity = action.payload.quantity
        if (item.quantity <= 0) {
          state.cart = state.cart.filter((cartItem) => cartItem.menuItem.id !== action.payload.id)
        }
      }
      state.total = state.cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
    },
    setOrderType: (state, action: PayloadAction<"dine-in" | "takeaway" | "delivery">) => {
      state.orderType = action.payload
    },
    setCustomerInfo: (state, action: PayloadAction<Partial<OrderState["customerInfo"]>>) => {
      state.customerInfo = { ...state.customerInfo, ...action.payload }
    },
    clearCart: (state) => {
      state.cart = []
      state.total = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitOrder.fulfilled, (state) => {
        state.loading = false
        state.cart = []
        state.total = 0
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to submit order"
      })
  },
})

export const { addToCart, removeFromCart, updateQuantity, setOrderType, setCustomerInfo, clearCart } =
  orderSlice.actions
export default orderSlice.reducer
