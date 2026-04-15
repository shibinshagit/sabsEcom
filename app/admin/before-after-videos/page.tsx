"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Edit, MoveDown, MoveUp, Plus, Trash2, Video } from "lucide-react"
import ImageUploadSingle from "@/components/ui/ImageUploadSingle"
import VideoUpload from "@/components/ui/video-upload"

type ContentType = "before" | "after" | "result"
type ShopType = "A" | "B" | "Both"
type MediaType = "image" | "video"

interface BeforeAfterVideo {
  id: number
  title: string
  description: string
  media_type: MediaType
  before_image_url: string
  after_image_url: string
  result_video_url: string
  video_url: string
  thumbnail_url: string
  content_type: ContentType
  shop: ShopType
  display_order: number
  is_active: boolean
  created_at: string
}

const initialForm = {
  title: "",
  description: "",
  media_type: "video" as MediaType,
  before_image_url: "",
  after_image_url: "",
  result_video_url: "",
  thumbnail_url: "",
  shop: "Both" as ShopType,
  display_order: 0,
  is_active: true,
}

export default function BeforeAfterVideosManagement() {
  const [items, setItems] = useState<BeforeAfterVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BeforeAfterVideo | null>(null)
  const [formData, setFormData] = useState(initialForm)

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.display_order - b.display_order || b.id - a.id),
    [items],
  )

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/before-after-videos")
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `HTTP ${response.status}`)
      }
      const data: BeforeAfterVideo[] = await response.json()
      setItems(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to load videos: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      ...initialForm,
      display_order: items.length + 1,
    })
    setFormError(null)
    setEditingItem(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: BeforeAfterVideo) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      media_type: item.media_type || "video",
      before_image_url: item.before_image_url || "",
      after_image_url: item.after_image_url || "",
      result_video_url: item.result_video_url || item.video_url || "",
      thumbnail_url: item.thumbnail_url || "",
      shop: item.shop,
      display_order: item.display_order,
      is_active: item.is_active,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (formData.media_type === "video" && !formData.result_video_url) {
      setFormError("Please upload a video file before saving.")
      return
    }

    if (formData.media_type === "image" && (!formData.before_image_url || !formData.after_image_url)) {
      setFormError("Please upload both before and after images.")
      return
    }

    try {
      const url = editingItem ? `/api/admin/before-after-videos/${editingItem.id}` : "/api/admin/before-after-videos"
      const method = editingItem ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Request failed")
      }

      await fetchItems()
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setFormError(message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this video entry?")) return
    try {
      const response = await fetch(`/api/admin/before-after-videos/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Delete failed")
      }
      await fetchItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      alert(`Failed to delete entry: ${message}`)
    }
  }

  const handleReorder = async (item: BeforeAfterVideo, direction: "up" | "down") => {
    const newOrder = direction === "up" ? item.display_order - 1 : item.display_order + 1
    try {
      const response = await fetch(`/api/admin/before-after-videos/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          media_type: item.media_type || "video",
          before_image_url: item.before_image_url || "",
          after_image_url: item.after_image_url || "",
          result_video_url: item.result_video_url || item.video_url || "",
          thumbnail_url: item.thumbnail_url,
          shop: item.shop,
          display_order: Math.max(0, newOrder),
          is_active: item.is_active,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Reorder failed")
      }
      await fetchItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      alert(`Failed to reorder entry: ${message}`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Before/After/Result Videos</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 mt-1" />
            <div>
              <h3 className="text-red-400 font-semibold">Error loading video entries</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              <Button onClick={fetchItems} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Before/After/Result Videos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Video Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Video Entry" : "Add Video Entry"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="media_type">Media Type</Label>
                <select
                  id="media_type"
                  value={formData.media_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      media_type: e.target.value as MediaType,
                      before_image_url: e.target.value === "image" ? formData.before_image_url : "",
                      after_image_url: e.target.value === "image" ? formData.after_image_url : "",
                      result_video_url: e.target.value === "video" ? formData.result_video_url : "",
                    })
                  }
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-700 px-3 text-white"
                >
                  <option value="video">Video (Result)</option>
                  <option value="image">Image Pair (Before/After)</option>
                </select>
              </div>

              {formData.media_type === "video" ? (
                <>
                  <VideoUpload
                    label="Result Video File *"
                    value={formData.result_video_url}
                    onChange={(url) => setFormData({ ...formData, result_video_url: url })}
                  />
                  <ImageUploadSingle
                    label="Video Thumbnail (optional)"
                    value={formData.thumbnail_url}
                    onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                  />
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadSingle
                    label="Before Image *"
                    value={formData.before_image_url}
                    onChange={(url) => setFormData({ ...formData, before_image_url: url })}
                  />
                  <ImageUploadSingle
                    label="After Image *"
                    value={formData.after_image_url}
                    onChange={(url) => setFormData({ ...formData, after_image_url: url })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shop">Shop</Label>
                  <select
                    id="shop"
                    value={formData.shop}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shop: e.target.value as ShopType,
                      })
                    }
                    className="w-full h-10 rounded-md border border-gray-600 bg-gray-700 px-3 text-white"
                  >
                    <option value="Both">Both Shops</option>
                    <option value="A">Shop A</option>
                    <option value="B">Shop B</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) || 0 })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1 border-gray-600" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Entries ({sortedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Content</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Shop</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Order</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell className="min-w-[280px]">
                      <div className="flex gap-3">
                        <div className="w-20 h-12 rounded-md bg-gray-900 border border-gray-700 overflow-hidden flex items-center justify-center">
                          {item.media_type === "image" && item.before_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.before_image_url} alt={`${item.title} before`} className="w-full h-full object-cover" />
                          ) : item.media_type === "video" && item.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          {item.description && <p className="text-gray-400 text-xs line-clamp-2 max-w-md">{item.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {item.media_type === "image" ? "image pair" : "result video"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-gray-200 border-gray-500">
                        {item.shop}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => handleReorder(item, "up")}>
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-300 w-8 text-center">{item.display_order}</span>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => handleReorder(item, "down")}>
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
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
    </div>
  )
}
