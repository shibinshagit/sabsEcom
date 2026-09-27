export type GuestCartItem = {
  menuItem: any
  quantity: number
  specialRequests?: string
  variant_id?: number
  selected_variant?: any
}

export const GUEST_CART_KEY = "sabs-guest-cart"

export function loadGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGuestCart(cart: GuestCartItem[]) {
  if (typeof window === "undefined") return
  try {
    if (!cart.length) {
      localStorage.removeItem(GUEST_CART_KEY)
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
    }
  } catch {
    // ignore quota / private mode
  }
}

export function clearGuestCart() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch {
    // ignore
  }
}

function cartItemKey(item: GuestCartItem) {
  return `${item.menuItem?.id ?? "x"}:${item.variant_id ?? "base"}`
}

/** Merge guest/local cart into server cart (sum quantities for matching lines). */
export function mergeCartItems(local: GuestCartItem[], remote: GuestCartItem[]): GuestCartItem[] {
  const map = new Map<string, GuestCartItem>()

  for (const item of remote) {
    map.set(cartItemKey(item), { ...item, menuItem: item.menuItem, selected_variant: item.selected_variant })
  }

  for (const item of local) {
    const key = cartItemKey(item)
    const existing = map.get(key)
    if (existing) {
      map.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        specialRequests: item.specialRequests || existing.specialRequests,
        selected_variant: item.selected_variant || existing.selected_variant,
      })
    } else {
      map.set(key, { ...item })
    }
  }

  return Array.from(map.values())
}
