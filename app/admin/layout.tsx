"use client"

import type React from "react"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/store"
import { fetchAdminData } from "@/lib/store/slices/adminSlice"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(fetchAdminData())
  }, [dispatch])

  return (
    <div className="min-h-screen admin-gradient">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
