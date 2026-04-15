"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, Eye, EyeOff, Star, Trash2, XCircle } from "lucide-react"

interface AdminReview {
  id: number
  product_id: number
  product_name: string | null
  order_id: number | null
  customer_name: string | null
  user_email: string | null
  rating: number
  review_text: string
  is_visible: boolean
  is_approved: boolean
  created_at: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/reviews")
      if (!response.ok) throw new Error("Failed to load reviews")
      const data = await response.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch admin reviews:", error)
      alert("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const stats = useMemo(() => {
    const total = reviews.length
    const visible = reviews.filter((r) => r.is_visible).length
    const approved = reviews.filter((r) => r.is_approved).length
    return { total, visible, approved }
  }, [reviews])

  const updateReview = async (id: number, payload: Partial<AdminReview>) => {
    try {
      setSavingId(id)
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to update review")

      setReviews((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload } : item)))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update review"
      alert(message)
    } finally {
      setSavingId(null)
    }
  }

  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return
    try {
      setSavingId(id)
      const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Failed to delete review")

      setReviews((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete review"
      alert(message)
    } finally {
      setSavingId(null)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">Product Reviews</h1>
        <Button
          variant="outline"
          onClick={fetchReviews}
          className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Reviews</p>
            <p className="text-2xl font-semibold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Visible</p>
            <p className="text-2xl font-semibold text-emerald-300">{stats.visible}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Approved</p>
            <p className="text-2xl font-semibold text-cyan-300">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Manage Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading reviews...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Product</TableHead>
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Rating</TableHead>
                    <TableHead className="text-gray-300">Review</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-white text-sm">{review.product_name || `Product #${review.product_id}`}</p>
                          <p className="text-xs text-gray-400">ID: {review.product_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-200">{review.customer_name || "Customer"}</p>
                          <p className="text-xs text-gray-400">{review.user_email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">{renderStars(review.rating)}</div>
                          <span className="text-xs text-gray-400">({review.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-300 line-clamp-3 max-w-sm">{review.review_text || "No text"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge className={review.is_visible ? "bg-emerald-600 text-white" : "bg-gray-600 text-white"}>
                            {review.is_visible ? "Visible" : "Hidden"}
                          </Badge>
                          <Badge className={review.is_approved ? "bg-cyan-600 text-white" : "bg-amber-600 text-white"}>
                            {review.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-2 min-w-[220px]">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === review.id}
                            onClick={() => updateReview(review.id, { is_visible: !review.is_visible })}
                            className="border-gray-600 text-gray-200 hover:bg-gray-700"
                          >
                            {review.is_visible ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            {review.is_visible ? "Hide" : "Show"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === review.id}
                            onClick={() => updateReview(review.id, { is_approved: !review.is_approved })}
                            className="border-gray-600 text-gray-200 hover:bg-gray-700"
                          >
                            {review.is_approved ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Unapprove
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={savingId === review.id}
                            onClick={() => deleteReview(review.id)}
                            className="col-span-2"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviews.length === 0 && (
                    <TableRow className="border-gray-700">
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        No reviews yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
