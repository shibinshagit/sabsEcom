"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface SingleImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
  filenamePrefix?: string
}

export default function SingleImageUpload({
  value = "",
  onChange,
  label = "Image",
  className = "",
  filenamePrefix = "banner",
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const filename = `${filenamePrefix}-${Date.now()}-${file.name}`
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: file,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (value) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(value)}`, { method: "DELETE" })
      } catch (err) {
        console.error("Failed to delete image blob:", err)
      }
    }
    onChange("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    setError("")
  }

  return (
    <div className={className}>
      <Label className="text-white font-medium">{label}</Label>

      <div className="mt-3 space-y-2">
        {value ? (
          <div className="relative">
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-600 bg-gray-800">
              <Image src={value} alt="Banner background" fill className="object-cover" unoptimized />
            </div>
            <Button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 w-7 h-7 p-0 rounded-full"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                  <span className="text-sm text-gray-400">Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload background image</span>
                  <span className="text-xs text-gray-500">JPG, PNG, WebP (Max 10MB)</span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-gray-500 text-xs">
          Recommended: wide image ~1200×675px. Shown as a centered popup over the site (not in the header).
        </p>
      </div>
    </div>
  )
}
