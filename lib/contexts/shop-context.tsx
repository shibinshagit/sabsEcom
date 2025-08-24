"use client"
import React, { createContext, useContext, useState, useEffect } from "react"

type Shop = "A" | "B"

interface ShopContextType {
  shop: Shop
  setShop: (shop: Shop) => void
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [shop, setShopState] = useState<Shop>("A")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("selectedShop") : null
    if (stored === "A" || stored === "B") setShopState(stored)
  }, [])

  const setShop = (newShop: Shop) => {
    setShopState(newShop)
    if (typeof window !== "undefined") localStorage.setItem("selectedShop", newShop)
  }

  return (
    <ShopContext.Provider value={{ shop, setShop }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error("useShop must be used within a ShopProvider")
  return ctx
} 

