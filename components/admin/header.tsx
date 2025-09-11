"use client"

import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminHeader() {
  return (
    <header className="bg-gray-900/50 backdrop-blur-md border-b border-cyan-500/20 px-6 py-4">
      <div className="flex items-center justify-between">
<h1 className="text-2xl font-bold text-white"></h1>
        <div className="flex items-center space-x-4">
          {/* PRO Badge */}
          <h1 className="text-2xl font-bold text-white">OpenCoders</h1>
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900 font-semibold text-sm shadow-lg border border-yellow-300 relative overflow-hidden">
            
            <span className="relative z-10">PRO</span>
            {/* shiny highlight effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 blur-sm animate-pulse" />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-800/50"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-800 border-gray-700"
            >
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-gray-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
