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
    
    // Optional: Add analytics tracking
    console.log('Country selected:', country)
    
    // Optional: Show success toast
    // toast.success(`Welcome! Shopping in ${country.name} (${country.currency})`)
  }

  const closeModal = () => {
    setShowModal(false)
    // Mark as selected even if closed without selection
    localStorage.setItem('country-selected', 'true')
  }

  return (
    <CountrySelectionModal
      isOpen={showModal}
      // onClose={closeModal}
      onCountrySelect={handleCountrySelect}
    />
  )
}
