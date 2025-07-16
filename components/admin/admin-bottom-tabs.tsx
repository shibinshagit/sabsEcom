"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  ListOrdered,
  Users,
  Settings,
  Image as ImageIcon,
  Tag,
  Star,
  BookOpen,
  Calendar,
  Menu,
  MessageCircle,
} from "lucide-react"

const tabs = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/menu", label: "Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/slider", label: "Slider", icon: ImageIcon },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/about", label: "About", icon: BookOpen },
//   { href: "/admin/reservations", label: "Reservations", icon: Calendar },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminBottomTabs() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900/80 via-gray-700/70 to-white/30 backdrop-blur-xl border-t border-gray-300/30 flex justify-between px-2 py-2 lg:hidden overflow-x-auto shadow-2xl rounded-t-xl">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center flex-1 min-w-[70px] px-0 py-0 mx-1 transition-all duration-200
              ${active
                ? ""
                : "hover:text-gray-900"}
            `}
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg border-2 transition-all duration-200
              ${active
                ? "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-100 border-gray-400 shadow-platinum"
                : "bg-gradient-to-br from-gray-800/80 via-gray-700/80 to-gray-900/80 border-gray-700/60"}
            `} style={{ boxShadow: active ? '0 2px 16px 0 #bfc1c6cc' : undefined }}>
              <Icon className={`w-7 h-7 ${active ? "text-gray-700" : "text-gray-300"}`} />
            </div>
            <span className="text-xs leading-tight font-medium whitespace-nowrap mt-1 text-center text-gray-100" style={{color: active ? '#6b7280' : undefined}}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
} 