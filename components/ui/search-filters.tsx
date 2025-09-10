"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal, X, ChevronDown, Filter, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

interface SearchFiltersProps {
  isSearchActive: boolean
  searchQuery: string
  totalResults: number
  sortBy: string
  onSortChange: (sort: string) => void
  onClearSearch: () => void
}

export default function SearchFilters({
  isSearchActive,
  searchQuery,
  totalResults,
  sortBy,
  onSortChange,
  onClearSearch
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: '🎯' },
    { value: 'price_low', label: 'Price: Low to High', icon: '💰' },
    { value: 'price_high', label: 'Price: High to Low', icon: '💸' },
    { value: 'name', label: 'Name A-Z', icon: '🔤' },
    { value: 'newest', label: 'Newest First', icon: '🆕' }
  ]

  const currentSort = sortOptions.find(option => option.value === sortBy) || sortOptions[0]

  if (!isSearchActive) return null

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Search Results Header */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for
              </span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
              "{searchQuery}"
            </Badge>
            <Button
              onClick={onClearSearch}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="hidden md:flex items-center gap-2 border-gray-300 hover:border-gray-400"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm">{currentSort.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-gray-500 font-medium">
                  Sort Results
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`cursor-pointer ${
                      sortBy === option.value 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span>{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                      </div>
                      {sortBy === option.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="md:hidden flex items-center gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`cursor-pointer ${
                      sortBy === option.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <span className="text-sm">{option.label}</span>
                    {sortBy === option.value && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Tips */}
        {totalResults === 0 && (
          <div className="pb-4 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-yellow-600 text-sm">
                <p className="font-medium mb-1">No results found</p>
                <p>Try:</p>
                <ul className="text-xs mt-1 space-y-1 text-left">
                  <li>• Different keywords</li>
                  <li>• Check spelling</li>
                  <li>• Use more general terms</li>
                  <li>• Browse categories instead</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}