import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCurrency } from '@/lib/contexts/currency-context'
import { loadUserCart, clearCart } from '@/lib/store/slices/orderSlice'
import type { AppDispatch, RootState } from '@/lib/store'

export const useCartSync = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()
  const { selectedCurrency } = useCurrency()

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(loadUserCart({ 
        userId: user.id,
        selectedCurrency 
      }))
    } else if (!isAuthenticated) {
      dispatch(clearCart({ userId: undefined }))
    }
  }, [isAuthenticated, user?.id, dispatch, selectedCurrency])
}
