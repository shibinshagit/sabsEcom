import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '@/lib/contexts/auth-context'
import { loadUserWishlist, clearWishlist } from '@/lib/store/slices/wishlistSlice'
import type { AppDispatch } from '@/lib/store'

export const useWishlistSync = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Load user-specific wishlist when user logs in
      dispatch(loadUserWishlist({ userId: user.id }))
    } else if (!isAuthenticated) {
      // Clear wishlist when user logs out
      dispatch(clearWishlist({ userId: undefined }))
    }
  }, [isAuthenticated, user?.id, dispatch])
}
