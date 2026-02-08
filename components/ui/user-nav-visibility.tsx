"use client"
import { usePathname } from "next/navigation"

export default function UserNavVisibility() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  if (isAdmin) return null
  return null
} 