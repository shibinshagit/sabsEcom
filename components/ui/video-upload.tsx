"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Video, X } from "lucide-react"

interface VideoUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export default function VideoUpload({ value, onChange, label = "Video", className = "" }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Keep below server route body-size ceiling to avoid truncated/corrupt uploads.
    if (file.size > 9 * 1024 * 1024) {
      setError("Video must be less than 9MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const filename = `video-${Date.now()}-${file.name}`
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: {
          "x-file-size": String(file.size),
          "x-file-type": file.type || "video/*",
        },
        body: file,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await response.json()
      if (value && value !== url) {
        try {
          await fetch(`/api/upload?url=${encodeURIComponent(value)}`, {
            method: "DELETE",
          })
        } catch {
          // Ignore deletion errors to avoid blocking UX.
        }
      }
      onChange(url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (value) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(value)}`, {
          method: "DELETE",
        })
      } catch {
        // Ignore deletion errors to avoid blocking UX.
      }
    }

    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <Label>{label}</Label>

      {value ? (
        <div className="mt-2 space-y-2">
          <div className="relative rounded-lg border border-gray-600 overflow-hidden bg-black">
            <video src={value} className="w-full max-h-64" controls preload="metadata" playsInline>
              Your browser does not support video preview.
            </video>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full p-0"
            >
              <X className="w-4 h-4" />
            </Button>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2 left-2 text-xs text-white/90 underline bg-black/50 px-2 py-1 rounded"
            >
              Open video
            </a>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={handleRemove} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Delete Video
          </Button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                <span className="text-sm text-gray-400">Uploading...</span>
              </>
            ) : (
              <>
                <Video className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Click to upload video</span>
                <span className="text-xs text-gray-500">MP4/WebM/MOV (max 9MB)</span>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Choose Video"}
          </Button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
