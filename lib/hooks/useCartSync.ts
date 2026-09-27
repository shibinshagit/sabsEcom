import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCurrency } from '@/lib/contexts/currency-context'
import {
  syncCartAfterLogin,
  saveCartToAPI,
  hydrateGuestCart,
  recalculateTotal,
} from '@/lib/store/slices/orderSlice'
import { saveGuestCart } from '@/lib/utils/guest-cart'
import type { AppDispatch, RootState } from '@/lib/store'

export const useCartSync = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, loading } = useAuth()
  const { selectedCurrency } = useCurrency()
  const { cart, loading: cartLoading } = useSelector((state: RootState) => state.order)
  const hasMergedLoginRef = useRef(false)
  const guestHydratedRef = useRef(false)
  const prevAuthRef = useRef<boolean | null>(null)

  // Auth transitions
  useEffect(() => {
    if (loading) return

    if (isAuthenticated && user?.id) {
      guestHydratedRef.current = false
      if (!hasMergedLoginRef.current) {
        hasMergedLoginRef.current = true
        dispatch(
          syncCartAfterLogin({
            userId: user.id.toString(),
            selectedCurrency,
          })
        )
      }
    } else {
      // Leaving an authenticated session — keep items for guest checkout later
      if (prevAuthRef.current === true && cart.length > 0) {
        saveGuestCart(cart)
      }
      hasMergedLoginRef.current = false
      if (!guestHydratedRef.current) {
        dispatch(hydrateGuestCart(selectedCurrency))
        guestHydratedRef.current = true
      }
      dispatch(recalculateTotal(selectedCurrency))
    }

    prevAuthRef.current = isAuthenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cart snapshot only needed on logout transition
  }, [isAuthenticated, user?.id, loading, selectedCurrency, dispatch])

  // Persist guest cart; debounce-save authenticated cart
  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      // Wait until guest cart has been hydrated so we don't overwrite storage with []
      if (!guestHydratedRef.current) return
      saveGuestCart(cart)
      return
    }

    if (!user?.id || !hasMergedLoginRef.current || cartLoading) return

    const timeoutId = setTimeout(() => {
      dispatch(
        saveCartToAPI({
          userId: user.id.toString(),
          cart,
          selectedCurrency,
        })
      )
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [cart, isAuthenticated, user?.id, selectedCurrency, loading, cartLoading, dispatch])
}
