"use client"

import type React from "react"
import SingleImageUpload from "@/components/ui/single-image-upload"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, AlertCircle, Eye, Calendar, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Banner {
  id: number
  title: string
  message: string
  banner_type: string
  background_color: string
  text_color: string
  button_text: string
  button_link: string
  button_color: string
  background_image_url: string
  auto_disappear_seconds: number
  redisplay_after_minutes: number
  display_pages: string[]
  is_active: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  is_dismissible: boolean
  created_at: string
}

const stylePresets = [
  {
    value: "promotion",
    label: "Dark Elegant",
    background_color: "#111827",
    text_color: "#ffffff",
    button_color: "#f5d76e",
  },
  {
    value: "announcement",
    label: "Warm Sale",
    background_color: "#7c2d12",
    text_color: "#fff7ed",
    button_color: "#ffffff",
  },
  {
    value: "info",
    label: "Fresh Deal",
    background_color: "#064e3b",
    text_color: "#ecfdf5",
    button_color: "#a7f3d0",
  },
  {
    value: "warning",
    label: "Soft Light",
    background_color: "#f8fafc",
    text_color: "#0f172a",
    button_color: "#0f172a",
  },
]

const pageOptions = [
  { value: "all", label: "All Pages" },
  { value: "home", label: "Home" },
  { value: "products", label: "Products" },
  { value: "product", label: "Product Detail" },
  { value: "order", label: "Checkout / Order" },
  { value: "shop", label: "Shop" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
]

/** Normalize legacy/broken values saved as JSON arrays by the product multi-uploader */
function normalizeImageUrl(raw: string | null | undefined): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0]
    if (typeof parsed === "string") return parsed
  } catch {
    // PostgreSQL array-ish text: {"https://..."}
    const match = trimmed.match(/https?:\/\/[^"}\s]+/)
    if (match) return match[0]
  }
  return ""
}

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    banner_type: "promotion",
    background_color: "#111827",
    text_color: "#ffffff",
    button_text: "Shop Now",
    button_link: "/products",
    button_color: "#f5d76e",
    background_image_url: "",
    auto_disappear_seconds: 0,
    redisplay_after_minutes: 5,
    display_pages: ["all"],
    is_active: true,
    start_date: "",
    end_date: "",
    priority: 0,
    is_dismissible: true,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/banners")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: Banner[] = await response.json()
      setBanners(
        data.map((b) => ({
          ...b,
          background_image_url: normalizeImageUrl(b.background_image_url),
        })),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch banners: ${message}`)
      toast.error("Could not load banners. Please try again.", { position: "top-center" })
      console.error("Failed to fetch banners:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError("Please enter a banner title.")
      toast.error("Please enter a banner title.", { position: "top-center" })
      return
    }
    if (!formData.message.trim()) {
      setFormError("Please enter a banner message.")
      toast.error("Please enter a banner message.", { position: "top-center" })
      return
    }
    if (!formData.display_pages.length) {
      setFormError("Please select at least one page for this banner.")
      toast.error("Please select at least one display page.", { position: "top-center" })
      return
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      setFormError("End date must be on or after the start date.")
      toast.error("End date must be on or after the start date.", { position: "top-center" })
      return
    }

    setSaving(true)
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : "/api/admin/banners"
      const method = editingBanner ? "PUT" : "POST"

      const payload = {
        ...formData,
        title: formData.title.trim(),
        message: formData.message.trim(),
        background_image_url: normalizeImageUrl(formData.background_image_url),
        // Empty dates must be null (not "") for Postgres timestamps
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || "Request failed")
      }

      await fetchBanners()
      setIsDialogOpen(false)
      resetForm()
      toast.success(editingBanner ? "Banner updated successfully!" : "Banner created successfully!", {
        position: "top-center",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      setFormError(message)
      toast.error(`Failed to save banner: ${message}`, { position: "top-center" })
      console.error("Failed to save banner:", error)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/banners/${deleteTarget.id}`, { method: "DELETE" })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Delete failed")
      }

      await fetchBanners()
      toast.success("Banner deleted successfully!", { position: "top-center" })
      setDeleteTarget(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`Failed to delete banner: ${message}`, { position: "top-center" })
      console.error("Failed to delete banner:", error)
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      banner_type: "promotion",
      background_color: "#111827",
      text_color: "#ffffff",
      button_text: "Shop Now",
      button_link: "/products",
      button_color: "#f5d76e",
      background_image_url: "",
      auto_disappear_seconds: 0,
      redisplay_after_minutes: 5,
      display_pages: ["all"],
      is_active: true,
      start_date: "",
      end_date: "",
      priority: 0,
      is_dismissible: true,
    })
    setEditingBanner(null)
    setFormError(null)
  }

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner)
    setFormError(null)
    setFormData({
      title: banner.title,
      message: banner.message,
      banner_type: banner.banner_type,
      background_color: banner.background_color,
      text_color: banner.text_color,
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      button_color: banner.button_color,
      background_image_url: normalizeImageUrl(banner.background_image_url),
      auto_disappear_seconds: banner.auto_disappear_seconds || 0,
      redisplay_after_minutes: Math.min(10, Math.max(1, banner.redisplay_after_minutes || 5)),
      display_pages: banner.display_pages,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split("T")[0] : "",
      end_date: banner.end_date ? banner.end_date.split("T")[0] : "",
      priority: banner.priority,
      is_dismissible: banner.is_dismissible,
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handlePageToggle = (page: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, display_pages: [...formData.display_pages, page] })
    } else {
      setFormData({ ...formData, display_pages: formData.display_pages.filter((p) => p !== page) })
    }
  }

  const applyStylePreset = (value: string) => {
    const preset = stylePresets.find((p) => p.value === value)
    if (!preset) return
    setFormData((prev) => ({
      ...prev,
      banner_type: preset.value,
      background_color: preset.background_color,
      text_color: preset.text_color,
      button_color: preset.button_color,
    }))
  }

  const getBannerTypeLabel = (type: string) => {
    return stylePresets.find((t) => t.value === type)?.label || type
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No limit"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Banner Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Banner Management</h1>
        </div>
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold">Error Loading Banners</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <Button onClick={fetchBanners} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Banner Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Create Promo Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Live preview */}
              <div className="rounded-xl border border-gray-600 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-900/80 text-xs text-gray-400 uppercase tracking-wider">
                  Live preview (site popup)
                </div>
                <div className="bg-black/40 p-4 flex items-center justify-center min-h-[220px]">
                  <div
                    className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
                    style={{
                      backgroundColor: formData.background_color,
                      color: formData.text_color,
                    }}
                  >
                    {formData.background_image_url ? (
                      <div
                        className="w-full h-36 bg-cover bg-center"
                        style={{ backgroundImage: `url(${formData.background_image_url})` }}
                      />
                    ) : (
                      <div className="h-2 w-full bg-white/10" />
                    )}
                    <div className="p-4 space-y-2">
                      {formData.title && (
                        <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {formData.title}
                        </span>
                      )}
                      <p className="text-sm font-semibold leading-snug">
                        {formData.message || "Your promo message appears here"}
                      </p>
                      {formData.button_text && (
                        <span
                          className="inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
                          style={{
                            backgroundColor: formData.button_color,
                            color: "#0f172a",
                          }}
                        >
                          {formData.button_text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Headline / Badge *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g. Free Shipping"
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">Shown as a small pill badge</p>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-gray-400 text-xs mt-1">Higher number wins if multiple are active</p>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Promo Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={2}
                  placeholder="e.g. Orders over AED 200 ship free this week"
                  required
                />
              </div>

              <div>
                <Label>Style Preset</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {stylePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => applyStylePreset(preset.value)}
                      className={`rounded-lg border p-2 text-left transition ${
                        formData.banner_type === preset.value
                          ? "border-cyan-400 ring-1 ring-cyan-400"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      style={{ backgroundColor: preset.background_color, color: preset.text_color }}
                    >
                      <div className="text-xs font-semibold">{preset.label}</div>
                      <div
                        className="mt-2 h-1.5 w-10 rounded-full"
                        style={{ backgroundColor: preset.button_color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Background</Label>
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="bg-gray-700 border-gray-600 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="text_color">Text</Label>
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="bg-gray-700 border-gray-600 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="button_color">CTA Button</Label>
                  <Input
                    id="button_color"
                    type="color"
                    value={formData.button_color}
                    onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                    className="bg-gray-700 border-gray-600 h-10"
                  />
                </div>
              </div>

              <SingleImageUpload
                value={formData.background_image_url}
                onChange={(url) => setFormData({ ...formData, background_image_url: url })}
                label="Background Image (Optional)"
                filenamePrefix="banner"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button_text">CTA Text</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="button_link">CTA Link</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="/products"
                  />
                </div>
              </div>

              <div>
                <Label>Display on Pages</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {pageOptions.map((page) => (
                    <div key={page.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={page.value}
                        checked={formData.display_pages.includes(page.value)}
                        onCheckedChange={(checked) => handlePageToggle(page.value, checked as boolean)}
                      />
                      <Label htmlFor={page.value} className="text-sm">
                        {page.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="auto_disappear_seconds">Auto Hide (sec)</Label>
                  <Input
                    id="auto_disappear_seconds"
                    type="number"
                    min="0"
                    value={formData.auto_disappear_seconds}
                    onChange={(e) => setFormData({ ...formData, auto_disappear_seconds: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0 = never"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_dismissible"
                      checked={formData.is_dismissible}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_dismissible: checked })}
                    />
                    <Label htmlFor="is_dismissible">Dismissible</Label>
                  </div>
                </div>

                {formData.is_dismissible && (
                  <div className="w-full sm:w-56">
                    <Label htmlFor="redisplay_after_minutes">Show again after (minutes)</Label>
                    <select
                      id="redisplay_after_minutes"
                      value={formData.redisplay_after_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          redisplay_after_minutes: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full h-10 rounded-md border border-gray-600 bg-gray-700 px-3 text-sm text-white"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((min) => (
                        <option key={min} value={min}>
                          {min} {min === 1 ? "minute" : "minutes"}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      After close, popup can appear again after this time.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-gray-600"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingBanner ? (
                    "Update Banner"
                  ) : (
                    "Create Banner"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Title</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Pages</TableHead>
                  <TableHead className="text-gray-300">Schedule</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id} className="border-gray-700">
                    <TableCell>
                      <div>
                        <span className="text-white font-medium">{banner.title}</span>
                        <p className="text-gray-400 text-sm line-clamp-1">{banner.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: banner.background_color,
                          color: banner.text_color,
                        }}
                      >
                        {getBannerTypeLabel(banner.banner_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {banner.display_pages.slice(0, 2).map((page) => (
                          <Badge key={page} variant="outline" className="text-xs">
                            {page}
                          </Badge>
                        ))}
                        {banner.display_pages.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{banner.display_pages.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(banner.start_date)}
                        </div>
                        <div className="text-gray-500">to {formatDate(banner.end_date)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={banner.is_active ? "default" : "secondary"}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {banner.is_dismissible && (
                          <Badge variant="outline" className="text-xs">
                            Again in {banner.redisplay_after_minutes || 5}m
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewBanner(banner)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(banner)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(banner)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewBanner && (
        <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Banner Preview</DialogTitle>
            </DialogHeader>
            <div
              className="p-4 rounded-lg text-center relative overflow-hidden"
              style={{
                backgroundColor: previewBanner.background_color,
                color: previewBanner.text_color,
                backgroundImage: previewBanner.background_image_url
                  ? `url(${previewBanner.background_image_url})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {previewBanner.background_image_url && <div className="absolute inset-0 bg-black/30"></div>}
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">{previewBanner.title}</h3>
                <p className="mb-4">{previewBanner.message}</p>
                {previewBanner.button_text && (
                  <Button
                    style={{
                      backgroundColor: previewBanner.button_color,
                      color: previewBanner.background_color,
                    }}
                    className="hover:opacity-80"
                  >
                    {previewBanner.button_text}
                  </Button>
                )}
                {previewBanner.auto_disappear_seconds > 0 && (
                  <p className="text-xs mt-2 opacity-75">
                    Auto-disappears in {previewBanner.auto_disappear_seconds} seconds
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white z-[10060]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will permanently remove
              {deleteTarget ? ` “${deleteTarget.title}”` : " this banner"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
