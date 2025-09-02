"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Currency = 'AED' | 'INR'

interface CurrencyContextType {
    selectedCurrency: Currency
    setSelectedCurrency: (currency: Currency) => void
    formatPrice: (priceAed?: number, priceInr?: number, defaultCurrency?: Currency) => string
    getCurrencySymbol: (currency: Currency) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('AED')

    // Load currency preference from localStorage on mount
    useEffect(() => {
        const savedCurrency = localStorage.getItem('selectedCurrency') as Currency
        if (savedCurrency && (savedCurrency === 'AED' || savedCurrency === 'INR')) {
            setSelectedCurrency(savedCurrency)
        }
    }, [])

    // Save currency preference to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('selectedCurrency', selectedCurrency)
    }, [selectedCurrency])

    const getCurrencySymbol = (currency: Currency): string => {
        switch (currency) {
            case 'AED':
                return 'D'
            case 'INR':
                return '₹'
            default:
                return 'AED'
        }
    }

    const formatPrice = (priceAed?: number, priceInr?: number, defaultCurrency?: Currency): string => {
        const currency = selectedCurrency
        const symbol = getCurrencySymbol(currency)

        if (currency === 'AED' && priceAed != null) {
            const priceNum = Number(priceAed)
            if (!isNaN(priceNum)) {
                return `${symbol} ${priceNum.toFixed(2)}`
            }
        } else if (currency === 'INR' && priceInr != null) {
            const priceNum = Number(priceInr)
            if (!isNaN(priceNum)) {
                return `${symbol} ${priceNum.toFixed(2)}`
            }
        }


        // Last fallback
        if (priceAed) return `D ${priceAed.toFixed(2)}`
        if (priceInr) return `₹ ${priceInr.toFixed(2)}`

        return 'Price not available'
    }

    return (
        <CurrencyContext.Provider value={{
            selectedCurrency,
            setSelectedCurrency,
            formatPrice,
            getCurrencySymbol
        }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
