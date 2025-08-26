import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WishlistItem {
  id: number
  name: string
  price: number
  price_aed?: number  
  price_inr?: number 
  default_currency?: string 
  image_url: string
  category_id?: number
  category_name?: string
  description?: string
  brand?: string
  is_available: boolean
  shop_category?: string
  features?: string[]
}

interface WishlistState {
  items: WishlistItem[]
}

const initialState: WishlistState = {
  items: []
}

// Load wishlist from localStorage
const loadWishlistFromStorage = (): WishlistItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const savedWishlist = localStorage.getItem('wishlist')
      return savedWishlist ? JSON.parse(savedWishlist) : []
    } catch (error) {
      console.error('Error loading wishlist from storage:', error)
      return []
    }
  }
  return []
}

// Save wishlist to localStorage
const saveWishlistToStorage = (items: WishlistItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wishlist', JSON.stringify(items))
    } catch (error) {
      console.error('Error saving wishlist to storage:', error)
    }
  }
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    ...initialState,
    items: loadWishlistFromStorage()
  },
  reducers: {
    addToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (!existingItem) {
        state.items.push(action.payload)
        saveWishlistToStorage(state.items)
      }
    },
    removeFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      saveWishlistToStorage(state.items)
    },
    clearWishlist: (state) => {
      state.items = []
      saveWishlistToStorage(state.items)
    },
    loadWishlistFromStorage: (state) => {
      state.items = loadWishlistFromStorage()
    }
  }
})

export const { addToWishlist, removeFromWishlist, clearWishlist, loadWishlistFromStorage: loadWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
