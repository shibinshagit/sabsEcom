"use client"

import type React from "react"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/store"
import { fetchAdminData } from "@/lib/store/slices/adminSlice"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import AdminBottomTabs from "@/components/admin/admin-bottom-tabs"

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
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 pb-24 sm:pb-24 md:pb-24 lg:pb-6">{children}</main>
        </div>
      </div>
      <AdminBottomTabs />
    </div>
  )
}
