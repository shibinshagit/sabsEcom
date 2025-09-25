import { useState, useEffect, useCallback } from 'react'
import { useShop } from '@/lib/contexts/shop-context'

interface UseShopSwitchPopupOptions {
  intervalMinutes?: number // How often to show popup (in minutes)
  initialDelayMinutes?: number // Initial delay before first popup (in minutes)
  maxShowsPerSession?: number // Maximum times to show per session
}

export function useShopSwitchPopup({
  intervalMinutes = 15, // Show every 15 minutes
  initialDelayMinutes = 10, // Wait 5 minutes before first show
  maxShowsPerSession = 2 // Max 2 times per session
}: UseShopSwitchPopupOptions = {}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showCount, setShowCount] = useState(0)
  const [lastShownTime, setLastShownTime] = useState<number | null>(null)
  const { shop, setShop } = useShop()

  // Check if we should show the popup
  const shouldShowPopup = useCallback(() => {
    const now = Date.now()
    
    // Don't show if we've reached max shows
    if (showCount >= maxShowsPerSession) {
      return false
    }

    // Don't show if popup is already open
    if (isPopupOpen) {
      return false
    }

    // Check if enough time has passed since last show
    if (lastShownTime) {
      const timeSinceLastShow = now - lastShownTime
      const intervalMs = intervalMinutes * 60 * 1000
      return timeSinceLastShow >= intervalMs
    }

    // For first show, check initial delay
    const sessionStartTime = sessionStorage.getItem('shopSwitchSessionStart')
    if (sessionStartTime) {
      const timeSinceStart = now - parseInt(sessionStartTime)
      const initialDelayMs = initialDelayMinutes * 60 * 1000
      return timeSinceStart >= initialDelayMs
    }

    return false
  }, [showCount, maxShowsPerSession, isPopupOpen, lastShownTime, intervalMinutes, initialDelayMinutes])

  // Initialize session tracking
  useEffect(() => {
    const sessionStart = sessionStorage.getItem('shopSwitchSessionStart')
    if (!sessionStart) {
      sessionStorage.setItem('shopSwitchSessionStart', Date.now().toString())
    }

    // Load previous session data
    const savedShowCount = sessionStorage.getItem('shopSwitchShowCount')
    const savedLastShown = sessionStorage.getItem('shopSwitchLastShown')
    
    if (savedShowCount) {
      setShowCount(parseInt(savedShowCount))
    }
    if (savedLastShown) {
      setLastShownTime(parseInt(savedLastShown))
    }
  }, [])

  // Set up interval to check if popup should be shown
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (shouldShowPopup()) {
        setIsPopupOpen(true)
        const now = Date.now()
        setLastShownTime(now)
        setShowCount(prev => {
          const newCount = prev + 1
          sessionStorage.setItem('shopSwitchShowCount', newCount.toString())
          return newCount
        })
        sessionStorage.setItem('shopSwitchLastShown', now.toString())
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkInterval)
  }, [shouldShowPopup])

  const closePopup = useCallback(() => {
    setIsPopupOpen(false)
  }, [])

  const switchShop = useCallback(() => {
    const newShop = shop === "A" ? "B" : "A"
    setShop(newShop)
    setIsPopupOpen(false)
    
    // Reset counters when user switches (reward engagement)
    setShowCount(0)
    sessionStorage.setItem('shopSwitchShowCount', '0')
  }, [shop, setShop])

  // Reset session data (useful for testing or manual reset)
  const resetSession = useCallback(() => {
    setShowCount(0)
    setLastShownTime(null)
    setIsPopupOpen(false)
    sessionStorage.removeItem('shopSwitchSessionStart')
    sessionStorage.removeItem('shopSwitchShowCount')
    sessionStorage.removeItem('shopSwitchLastShown')
    sessionStorage.setItem('shopSwitchSessionStart', Date.now().toString())
  }, [])

  return {
    isPopupOpen,
    closePopup,
    switchShop,
    resetSession,
    showCount,
    canShowMore: showCount < maxShowsPerSession
  }
}
