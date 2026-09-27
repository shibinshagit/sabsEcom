"use client"

import { useEffect, useState } from "react"
import CountrySelectionModal from "./country-selection-modal"

interface Country {
  code: string
  name: string
  currency: string
  flag: string
}

export default function CountrySelectionWrapper() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if user has already selected a country
    const hasSelectedCountry = localStorage.getItem('country-selected')
    
    if (!hasSelectedCountry) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true)
      }, 1500) // Slightly longer delay to ensure page is fully loaded

      return () => clearTimeout(timer)
    }
  }, [])

  const handleCountrySelect = (country: Country) => {
    setShowModal(false)
    window.dispatchEvent(new Event('country-selected'))
    
    // Optional: Add analytics tracking
    console.log('Country selected:', country)
  }

  const closeModal = () => {
    setShowModal(false)
    // Mark as selected even if closed without selection
    localStorage.setItem('country-selected', 'true')
    window.dispatchEvent(new Event('country-selected'))
  }

  return (
    <CountrySelectionModal
      isOpen={showModal}
      // onClose={closeModal}
      onCountrySelect={handleCountrySelect}
    />
  )
}
