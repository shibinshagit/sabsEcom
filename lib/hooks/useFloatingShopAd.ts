import { useState, useEffect, useCallback } from 'react'
import { useShop } from '@/lib/contexts/shop-context'

interface UseFloatingShopAdOptions {
  showAfterScrollPixels?: number // Show after scrolling X pixels
  displayDurationMinutes?: number // How long to show the ad (in minutes)
  cooldownMinutes?: number // Cooldown before showing again (in minutes)
  maxShowsPerSession?: number // Maximum times to show per session
}

export function useFloatingShopAd({
  showAfterScrollPixels = 400, // Show after scrolling 400px
  displayDurationMinutes = 2, // Show for 2 minutes
  cooldownMinutes = 4, // 4 minute cooldown
  maxShowsPerSession = 3 // Max 3 times per session
}: UseFloatingShopAdOptions = {}) {
  const [isAdVisible, setIsAdVisible] = useState(false)
  const [showCount, setShowCount] = useState(0)
  const [lastShownTime, setLastShownTime] = useState<number | null>(null)
  const [adStartTime, setAdStartTime] = useState<number | null>(null)
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false)
  const { shop, setShop } = useShop()

  // Check if we should show the ad
  const shouldShowAd = useCallback(() => {
    const now = Date.now()
    
    // Don't show if we've reached max shows
    if (showCount >= maxShowsPerSession) {
      return false
    }

    // Don't show if ad is already visible
    if (isAdVisible) {
      return false
    }

    // Must have scrolled enough
    if (!hasScrolledEnough) {
      return false
    }

    // Check cooldown period
    if (lastShownTime) {
      const timeSinceLastShow = now - lastShownTime
      const cooldownMs = cooldownMinutes * 60 * 1000
      return timeSinceLastShow >= cooldownMs
    }

    return true
  }, [showCount, maxShowsPerSession, isAdVisible, hasScrolledEnough, lastShownTime, cooldownMinutes])

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      if (scrollY >= showAfterScrollPixels && !hasScrolledEnough) {
        setHasScrolledEnough(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showAfterScrollPixels, hasScrolledEnough])

  // Initialize session tracking
  useEffect(() => {
    const sessionStart = sessionStorage.getItem('floatingAdSessionStart')
    if (!sessionStart) {
      sessionStorage.setItem('floatingAdSessionStart', Date.now().toString())
    }

    // Load previous session data
    const savedShowCount = sessionStorage.getItem('floatingAdShowCount')
    const savedLastShown = sessionStorage.getItem('floatingAdLastShown')
    
    if (savedShowCount) {
      setShowCount(parseInt(savedShowCount))
    }
    if (savedLastShown) {
      setLastShownTime(parseInt(savedLastShown))
    }
  }, [])

  // Check if ad should be shown
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (shouldShowAd()) {
        const now = Date.now()
        setIsAdVisible(true)
        setAdStartTime(now)
        setLastShownTime(now)
        setShowCount(prev => {
          const newCount = prev + 1
          sessionStorage.setItem('floatingAdShowCount', newCount.toString())
          return newCount
        })
        sessionStorage.setItem('floatingAdLastShown', now.toString())
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(checkInterval)
  }, [shouldShowAd])

  // Auto-hide ad after display duration
  useEffect(() => {
    if (isAdVisible && adStartTime) {
      const hideTimer = setTimeout(() => {
        setIsAdVisible(false)
        setAdStartTime(null)
      }, displayDurationMinutes * 60 * 1000)

      return () => clearTimeout(hideTimer)
    }
  }, [isAdVisible, adStartTime, displayDurationMinutes])

  const closeAd = useCallback(() => {
    setIsAdVisible(false)
    setAdStartTime(null)
  }, [])

  const switchShop = useCallback(() => {
    const newShop = shop === "A" ? "B" : "A"
    setShop(newShop)
    setIsAdVisible(false)
    setAdStartTime(null)
    
    // Reset counters when user switches (reward engagement)
    setShowCount(0)
    sessionStorage.setItem('floatingAdShowCount', '0')
  }, [shop, setShop])

  // Reset session data (useful for testing)
  const resetSession = useCallback(() => {
    setShowCount(0)
    setLastShownTime(null)
    setIsAdVisible(false)
    setAdStartTime(null)
    setHasScrolledEnough(false)
    sessionStorage.removeItem('floatingAdSessionStart')
    sessionStorage.removeItem('floatingAdShowCount')
    sessionStorage.removeItem('floatingAdLastShown')
    sessionStorage.setItem('floatingAdSessionStart', Date.now().toString())
  }, [])

  return {
    isAdVisible,
    closeAd,
    switchShop,
    resetSession,
    showCount,
    canShowMore: showCount < maxShowsPerSession,
    hasScrolledEnough
  }
}
