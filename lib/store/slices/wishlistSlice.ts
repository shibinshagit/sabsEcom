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

// Load wishlist from localStorage with user-specific key
const loadWishlistFromStorage = (userId?: string | number): WishlistItem[] => {
  if (typeof window !== 'undefined' && userId) {
    try {
      const savedWishlist = localStorage.getItem(`wishlist_${userId}`)
      return savedWishlist ? JSON.parse(savedWishlist) : []
    } catch (error) {
      console.error('Error loading wishlist from storage:', error)
      return []
    }
  }
  return []
}

// Save wishlist to localStorage with user-specific key
const saveWishlistToStorage = (items: WishlistItem[], userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.setItem(`wishlist_${userId}`, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving wishlist to storage:', error)
    }
  }
}

// Clear user-specific wishlist from localStorage
const clearWishlistFromStorage = (userId?: string | number) => {
  if (typeof window !== 'undefined' && userId) {
    try {
      localStorage.removeItem(`wishlist_${userId}`)
    } catch (error) {
      console.error('Error clearing wishlist from storage:', error)
    }
  }
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<{ item: WishlistItem, userId?: string | number }>) => {
      const { item, userId } = action.payload
      const existingItem = state.items.find(wishlistItem => wishlistItem.id === item.id)
      if (!existingItem) {
        state.items.push(item)
        saveWishlistToStorage(state.items, userId)
      }
    },
    removeFromWishlist: (state, action: PayloadAction<{ productId: number, userId?: string | number }>) => {
      const { productId, userId } = action.payload
      state.items = state.items.filter(item => item.id !== productId)
      saveWishlistToStorage(state.items, userId)
    },
    clearWishlist: (state, action: PayloadAction<{ userId?: string | number }>) => {
      const { userId } = action.payload
      state.items = []
      clearWishlistFromStorage(userId)
    },
    loadUserWishlist: (state, action: PayloadAction<{ userId?: string | number }>) => {
      const { userId } = action.payload
      state.items = loadWishlistFromStorage(userId)
    },
    // For backwards compatibility and guest users
    loadWishlistFromStorage: (state) => {
      // Load from generic key for guest users
      if (typeof window !== 'undefined') {
        try {
          const savedWishlist = localStorage.getItem('wishlist')
          state.items = savedWishlist ? JSON.parse(savedWishlist) : []
        } catch (error) {
          console.error('Error loading wishlist from storage:', error)
        }
      }
    }
  }
})

export const { 
  addToWishlist, 
  removeFromWishlist, 
  clearWishlist, 
  loadUserWishlist,
  loadWishlistFromStorage: loadWishlist 
} = wishlistSlice.actions
export default wishlistSlice.reducer
