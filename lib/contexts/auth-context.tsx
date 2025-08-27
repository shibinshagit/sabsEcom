"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/nextjs"

interface User {
  id: number | string   
  email: string
  name?: string
  isVerified: boolean
  createdAt?: string
  isClerkUser?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, otp: string, name?: string) => Promise<void>
  register: (email: string, otp: string, name: string, password: string) => Promise<void>
  loginWithPassword: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  sendOTP: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser()
  const { signOut: clerkSignOut } = useClerkAuth()

  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "",
        isVerified: true,
        isClerkUser: true,
        createdAt: undefined,
      })
      setLoading(false)
    } else if (clerkLoaded && !clerkUser) {
      fetch("/api/auth/me")
        .then(async (resp) => {
          if (resp.ok) {
            const data = await resp.json()
            setUser(data.user)
          } else {
            setUser(null)
          }
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    }
  }, [clerkUser, clerkLoaded])

  // ---- MANUAL AUTH FUNCTIONS ----
  const sendOTP = async (email: string) => {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to send OTP")
    }
    return data
  }

  const login = async (email: string, otp: string, name?: string) => {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to verify OTP")
    }
    setUser(data.user)
  }

  const register = async (email: string, otp: string, name: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to register")
    }
    setUser(data.user)
  }

  const loginWithPassword = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to login")
    }
    setUser(data.user)
  }

  // ---- LOGOUT ----
  const logout = async () => {
    if (user?.isClerkUser) {
      await clerkSignOut()
      setUser(null)
      setLoading(false)
    } else {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithPassword,
        logout,
        sendOTP,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
