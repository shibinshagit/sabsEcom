"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Clock, CheckCircle, AlertCircle, Package, CreditCard, Smartphone, Link, Trash2, ExternalLink } from "lucide-react"
import Image from "next/image"

// CSS for hiding scrollbars
const scrollbarHideStyle = `
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* WebKit */
  }
`

interface OrderStats {
  statusStats: { [key: string]: number }
  totalOrders: number
  todayOrders: number
  weekOrders: number
  monthOrders: number
  pending: number
  confirmed: number
  packed: number
  dispatched: number
  outForDelivery: number
  delivered: number
  cancelled: number
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updating, setUpdating] = useState<number | null>(null)
  const [trackingUrls, setTrackingUrls] = useState<{[key: number]: string}>({})
  const [trackingIds, setTrackingIds] = useState<{[key: number]: string}>({})
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)


  interface Order {
    id: number
    customer_name: string
    customer_email: string
    customer_phone: string
    order_type: string
    payment_method: string
    payment_status: string
    payment_id?: string
    delivery_address?: string
    customer_address?: string
    total_amount: number
    tax_amount: number
    delivery_fee: number
    final_total: number
    status: string
    special_instructions: string
    currency: string
    coupon_code?: string
    discount_amount: number
    tracking_url?: string
    tracking_id?: string
    created_at: string
    updated_at: string
    items: Array<{
      id: number
      menu_item_name: string
      variant_id?: number
      variant_name?: string
      quantity: number
      unit_price: number
      total_price: number
      special_requests: string
      product_image_url?: string
    }>
  }

  useEffect(() => {
    fetchOrders()
    fetchOrderStats()
  }, [])

  const fetchOrderStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch("/api/admin/orders/stats", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setOrderStats(data)
    } catch (error) {
      console.error("Failed to fetch order stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching orders from /api/admin/orders...")

      const response = await fetch("/api/admin/orders", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Received orders data:", data)

      // Log individual order items for debugging
      if (Array.isArray(data) && data.length > 0) {
        console.log("First order items:", data[0].items)
      }

      if (Array.isArray(data)) {
        setOrders(data)
        console.log(`Loaded ${data.length} orders successfully`)
      } else {
        console.error("Expected array but got:", typeof data, data)
        setError("Invalid data format received from server")
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdating(orderId)
      console.log(`Updating order ${orderId} to status: ${newStatus}`)

      // Find the order to get item details for stock reduction
      const order = orders.find(o => o.id === orderId)
      // Preserve existing tracking info if no new tracking info is entered
      const trackingUrl = trackingUrls[orderId] || order?.tracking_url || ''
      const trackingId = trackingIds[orderId] || order?.tracking_id || ''

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          tracking_url: trackingUrl,
          tracking_id: trackingId,
          reduce_stock: newStatus === 'confirmed', // Reduce stock when order is confirmed
          order_items: order?.items
        }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        console.log("Order updated successfully:", updatedOrder)

        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? {
                ...order,
                ...updatedOrder,
                status: newStatus,
                updated_at: new Date().toISOString()
              }
              : order
          )
        )

        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            ...updatedOrder,
            status: newStatus
          } : null)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      setError(error instanceof Error ? error.message : "Failed to update order status")

      alert(`Failed to update order status: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUpdating(null)
    }
  }

  const handleSaveTracking = async (orderId: number) => {
    try {
      setUpdating(orderId)
      console.log(`Saving tracking info for order ${orderId}`)

      const trackingUrl = trackingUrls[orderId] || ''
      const trackingId = trackingIds[orderId] || ''

      if (!trackingUrl && !trackingId) {
        alert('Please enter tracking URL or tracking ID')
        return
      }

      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_url: trackingUrl,
          tracking_id: trackingId,
          send_notification: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Tracking info saved successfully:", result)

        // Update the order in state with the actual values from API response
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? {
                ...order,
                tracking_url: result.tracking_url,
                tracking_id: result.tracking_id,
                updated_at: new Date().toISOString()
              }
              : order
          )
        )

        // Update selected order if it's the current one
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            tracking_url: result.tracking_url,
            tracking_id: result.tracking_id
          } : null)
        }

        // Clear the temporary state
        setTrackingUrls(prev => {
          const updated = { ...prev }
          delete updated[orderId]
          return updated
        })
        setTrackingIds(prev => {
          const updated = { ...prev }
          delete updated[orderId]
          return updated
        })

        // Show different success message based on order status and existing tracking
        const order = orders.find(o => o.id === orderId)
        const notificationStatuses = ['confirmed', 'dispatched', 'out for delivery', 'delivered']
        const willNotify = order && notificationStatuses.includes(order.status.toLowerCase())
        const hadExistingTracking = order && (order.tracking_url || order.tracking_id)
        
        const action = hadExistingTracking ? 'updated' : 'saved'
        alert(willNotify 
          ? `Tracking information ${action} and customer notified successfully!`
          : `Tracking information ${action}!`
        )
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save tracking information")
      }
    } catch (error) {
      console.error("Failed to save tracking info:", error)
      alert(`Failed to save tracking information: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "packed":
        return <Package className="w-4 h-4" />
      case "dispatched":
        return <Package className="w-4 h-4" />
      case "out for delivery":
        return <Package className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      case "cancel":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "packed":
        return "bg-purple-500"
      case "dispatched":
        return "bg-orange-500"
      case "out for delivery":
        return "bg-indigo-500"
      case "delivered":
        return "bg-green-500"
      case "cancel":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPaymentIcon = (orderType: string) => {
    switch (orderType?.toUpperCase()) {
      case "COD":
        return <CreditCard className="w-4 h-4 text-green-400" />
      case "UPI":
        return <Smartphone className="w-4 h-4 text-blue-400" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-400" />
    }
  }

  const filteredOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
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
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <Card className="bg-red-800/50 border-red-700">
          <CardHeader>
            <CardTitle className="text-red-200">Error Loading Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 mb-4">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={fetchOrders} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <style jsx>{scrollbarHideStyle}</style>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchOrders} className="bg-blue-600 hover:bg-blue-700">
            Refresh ({filteredOrders.length})
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-white">All Orders</SelectItem>
              <SelectItem value="pending" className="text-white">Pending</SelectItem>
              <SelectItem value="confirmed" className="text-white">Confirmed</SelectItem>
              <SelectItem value="packed" className="text-white">Packed</SelectItem>
              <SelectItem value="dispatched" className="text-white">Dispatched</SelectItem>
              <SelectItem value="out for delivery" className="text-white">Out for Delivery</SelectItem>
              <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
              <SelectItem value="cancel" className="text-white">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : orderStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Pending Orders */}
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30 hover:border-yellow-500/50 transition-colors cursor-pointer" 
                onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-400">{orderStats.pending}</div>
              <div className="text-xs text-yellow-300">Pending</div>
            </CardContent>
          </Card>

          {/* Confirmed Orders */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-600/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('confirmed')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">{orderStats.confirmed}</div>
              <div className="text-xs text-blue-300">Confirmed</div>
            </CardContent>
          </Card>

          {/* Packed Orders */}
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30 hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('packed')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">{orderStats.packed}</div>
              <div className="text-xs text-purple-300">Packed</div>
            </CardContent>
          </Card>

          {/* Dispatched Orders */}
          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-orange-600/30 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('dispatched')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">{orderStats.dispatched}</div>
              <div className="text-xs text-orange-300">Dispatched</div>
            </CardContent>
          </Card>

          {/* Out for Delivery */}
          <Card className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 border-indigo-600/30 hover:border-indigo-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('out for delivery')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ExternalLink className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-400">{orderStats.outForDelivery}</div>
              <div className="text-xs text-indigo-300">Out for Delivery</div>
            </CardContent>
          </Card>

          {/* Delivered Orders */}
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30 hover:border-green-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('delivered')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">{orderStats.delivered}</div>
              <div className="text-xs text-green-300">Delivered</div>
            </CardContent>
          </Card>

          {/* Cancelled Orders */}
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30 hover:border-red-500/50 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('cancel')}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{orderStats.cancelled}</div>
              <div className="text-xs text-red-300">Cancelled</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Summary Stats */}
      {!statsLoading && orderStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{orderStats.totalOrders}</div>
              <div className="text-sm text-gray-400">Total Orders</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{orderStats.todayOrders}</div>
              <div className="text-sm text-gray-400">Today's Orders</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{orderStats.weekOrders}</div>
              <div className="text-sm text-gray-400">Last 7 Days</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{orderStats.monthOrders}</div>
              <div className="text-sm text-gray-400">This Month</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Order ID</TableHead>
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Payment</TableHead>
                  <TableHead className="text-gray-300">Total</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-gray-700">
                    <TableCell>
                      <span className="text-white font-mono">#{order.id}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-white font-medium">{order.customer_name}</span>
                        <p className="text-gray-400 text-sm">{order.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          {getPaymentIcon(order.payment_method)}
                          <Badge variant="outline" className="capitalize text-xs text-white">
                            {order.payment_method?.toUpperCase() || 'COD'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            order.payment_status === 'completed' ? 'bg-green-500' : 
                            order.payment_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-xs text-white capitalize text-white">
                            {order.payment_status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">
                        <span className="font-semibold text-lg">{order.currency === 'AED' ? 'AED' : '₹'} {order.final_total?.toFixed(2) || '0.00'}</span>
                        {order.total_amount !== order.final_total && (
                          <p className="text-gray-400 text-xs">
                            Subtotal: {order.currency === 'AED' ? 'AED' : '₹'} {order.total_amount?.toFixed(2) || '0.00'}
                          </p>
                        )}
                        {order.discount_amount > 0 && (
                          <p className="text-green-400 text-xs">
                            Saved: {order.currency === 'AED' ? 'AED' : '₹'} {order.discount_amount?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                        <Badge variant="outline" className="capitalize text-white">
                          {order.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <p className="text-gray-400 text-xs">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                         
                          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[95vh] p-0">
                            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 pb-4 z-10">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    #{order.id}
                                  </div>
                                  <span>Order #{order.id} - {order.customer_name}</span>
                                  <Badge className={`ml-auto ${getStatusColor(order.status)} text-white px-3 py-1 text-sm font-medium`}>
                                    {order.status.toUpperCase()}
                                  </Badge>
                                </DialogTitle>
                                <p className="text-gray-400 mt-2 text-sm">
                                  Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </DialogHeader>
                            </div>
                            {selectedOrder && (
                              <div
                              className="px-6 pb-6 space-y-6 overflow-y-auto scrollbar-hide"
                              style={{
                                maxHeight: 'calc(95vh - 120px)',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                              }}
                            >
                                {/* Customer & Order Overview Card */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="text-lg font-bold text-white mb-4">
                                        Customer Information
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {selectedOrder.customer_name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="font-semibold text-white">{selectedOrder.customer_name}</p>
                                            <p className="text-gray-400 text-sm">{selectedOrder.customer_phone}</p>
                                          </div>
                                        </div>
                                        {selectedOrder.customer_email && (
                                          <p className="text-gray-400 text-sm pl-11">{selectedOrder.customer_email}</p>
                                        )}
                                      </div>

                                      {/* Address Information */}
                                      {selectedOrder.delivery_address && (
                                        <div className="mt-5">
                                          <h5 className="font-semibold text-white mb-2">
                                            Delivery Address
                                          </h5>
                                          <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">
                                            {selectedOrder.delivery_address}
                                          </div>
                                        </div>
                                      )}

                                      {selectedOrder.customer_address && (
                                        <div className="mt-4">
                                          <h5 className="font-semibold text-white mb-2">
                                            Customer Address
                                          </h5>
                                          <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm text-gray-300">
                                            {selectedOrder.customer_address}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <h4 className="text-lg font-bold text-white mb-4">
                                        Order Details
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                          <span className="text-gray-400">Order Date:</span>
                                          <span className="font-medium text-white">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                          <span className="text-gray-400">Order Time:</span>
                                          <span className="font-medium text-white">{new Date(selectedOrder.created_at).toLocaleTimeString()}</span>
                                        </div>
                                      </div>

                                      {/* Tracking Section */}
                                      <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
                                        <Label className="text-sm font-bold text-white mb-3 block">
                                          Package Tracking
                                        </Label>

                                        {/* Tracking URL */}
                                        <div className="space-y-3">
                                          <div>
                                            <Label htmlFor={`tracking-url-${selectedOrder.id}`} className="text-xs text-gray-300 mb-1 block">
                                              Tracking URL
                                            </Label>
                                            <div className="flex gap-2">
                                              <Input
                                                id={`tracking-url-${selectedOrder.id}`}
                                                type="url"
                                                placeholder="https://example.com/track/ORDER123"
                                                value={trackingUrls[selectedOrder.id] || selectedOrder.tracking_url || ''}
                                                onChange={(e) => setTrackingUrls(prev => ({
                                                  ...prev,
                                                  [selectedOrder.id]: e.target.value
                                                }))}
                                                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
                                              />
                                              {(trackingUrls[selectedOrder.id] || selectedOrder.tracking_url) && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="px-3 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                                  onClick={() => {
                                                    const url = trackingUrls[selectedOrder.id] || selectedOrder.tracking_url
                                                    if (url) window.open(url, '_blank')
                                                  }}
                                                >
                                                  <ExternalLink className="w-4 h-4" />
                                                </Button>
                                              )}
                                              {trackingUrls[selectedOrder.id] && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="px-3 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                                  onClick={() => setTrackingUrls(prev => {
                                                    const updated = { ...prev }
                                                    delete updated[selectedOrder.id]
                                                    return updated
                                                  })}
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Tracking ID */}
                                          <div>
                                            <Label htmlFor={`tracking-id-${selectedOrder.id}`} className="text-xs text-gray-300 mb-1 block">
                                              Tracking ID
                                            </Label>
                                            <div className="flex gap-2">
                                              <Input
                                                id={`tracking-id-${selectedOrder.id}`}
                                                type="text"
                                                placeholder="e.g., abdc567"
                                                value={trackingIds[selectedOrder.id] || selectedOrder.tracking_id || ''}
                                                onChange={(e) => setTrackingIds(prev => ({
                                                  ...prev,
                                                  [selectedOrder.id]: e.target.value
                                                }))}
                                                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
                                              />
                                              {trackingIds[selectedOrder.id] && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="px-3 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                                  onClick={() => setTrackingIds(prev => {
                                                    const updated = { ...prev }
                                                    delete updated[selectedOrder.id]
                                                    return updated
                                                  })}
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <p className="text-xs text-gray-400 mt-2">
                                          Tracking details automatically sent in status update emails
                                        </p>
                                        
                                        {/* Submit Button for Tracking */}
                                        {(trackingUrls[selectedOrder.id] || trackingIds[selectedOrder.id]) && (
                                          <div className="mt-4 pt-3 border-t border-gray-600">
                                            <Button
                                              onClick={() => handleSaveTracking(selectedOrder.id)}
                                              disabled={updating === selectedOrder.id}
                                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              {updating === selectedOrder.id ? (
                                                <>
                                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                  Saving Tracking...
                                                </>
                                              ) : (
                                                <>
                                                  <Package className="w-4 h-4 mr-2" />
                                                  {(() => {
                                                    const hasExistingTracking = selectedOrder.tracking_url || selectedOrder.tracking_id
                                                    const willNotify = ['confirmed', 'dispatched', 'out for delivery', 'delivered'].includes(selectedOrder.status.toLowerCase())
                                                    
                                                    if (hasExistingTracking) {
                                                      return willNotify ? 'Update Tracking & Notify Customer' : 'Update Tracking'
                                                    } else {
                                                      return willNotify ? 'Save Tracking & Notify Customer' : 'Save Tracking'
                                                    }
                                                  })()}
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Information Card */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-white mb-4">
                                    Payment Information
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                      <span className="text-gray-400">Method:</span>
                                      <Badge className="bg-green-600 text-white">{selectedOrder.payment_method?.toUpperCase() || 'COD'}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        selectedOrder.payment_status === 'completed' ? 'bg-green-500' :
                                        selectedOrder.payment_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`}></div>
                                      <span className="text-gray-400">Status:</span>
                                      <Badge className={`capitalize ${
                                        selectedOrder.payment_status === 'completed' ? 'bg-green-600 text-white' :
                                        selectedOrder.payment_status === 'failed' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                                      }`}>{selectedOrder.payment_status || 'pending'}</Badge>
                                    </div>
                                  </div>

                                  {/* Razorpay Details for Bank Reconciliation */}
                                  {(selectedOrder.razorpay_order_id || selectedOrder.razorpay_payment_id) && (
                                    <div className="mt-4 pt-4 border-t border-gray-600">
                                      <h6 className="font-bold text-white mb-3">Bank Reconciliation</h6>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {selectedOrder.razorpay_order_id && (
                                          <div className="text-gray-300"><strong>Order ID:</strong> <span className="font-mono text-blue-400">{selectedOrder.razorpay_order_id}</span></div>
                                        )}
                                        {selectedOrder.razorpay_payment_id && (
                                          <div className="text-gray-300"><strong>Payment ID:</strong> <span className="font-mono text-blue-400">{selectedOrder.razorpay_payment_id}</span></div>
                                        )}
                                        {selectedOrder.bank_reference_num && (
                                          <div className="text-gray-300"><strong>Bank Ref:</strong> <span className="font-mono text-orange-400">{selectedOrder.bank_reference_num}</span></div>
                                        )}
                                        {selectedOrder.payment_method_type && (
                                          <div className="text-gray-300"><strong>Type:</strong> <span className="capitalize">{selectedOrder.payment_method_type}</span></div>
                                        )}
                                        {selectedOrder.payment_bank && (
                                          <div className="text-gray-300"><strong>Bank:</strong> {selectedOrder.payment_bank}</div>
                                        )}
                                        {selectedOrder.payment_vpa && (
                                          <div className="text-gray-300"><strong>UPI:</strong> <span className="font-mono">{selectedOrder.payment_vpa}</span></div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items Card */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-white mb-5">
                                    Order Items ({selectedOrder.items?.length || 0})
                                  </h4>
                                  <div className="space-y-4">
                                    {selectedOrder.items?.map((item, index) => {
                                      console.log('Admin Order Item:', item)
                                      return (
                                      <div key={item.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                          {/* Product Image */}
                                          <div className="flex-shrink-0">
                                            {item.product_image_url ? (
                                              <Image
                                                src={item.product_image_url}
                                                alt={item.product_image_url}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-500"
                                              />
                                            ) : (
                                              <div className="w-20 h-20 bg-gray-600 rounded-lg border border-gray-500 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-400" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Item Details */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  
                                                  <h5 className="font-bold text-white text-lg leading-tight">{item.menu_item_name}</h5>
                                                </div>

                                                {item.variant_name && item.variant_name !== 'Default' && (
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-purple-600 text-white text-xs">
                                                      {item.variant_name}
                                                    </Badge>
                                                  </div>
                                                )}

                                                <div className="flex items-center gap-4 mb-2">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-400">Qty:</span>
                                                    <Badge className="bg-blue-600 text-white font-bold">
                                                      {item.quantity}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-400">Unit Price:</span>
                                                    <span className="font-medium text-white">
                                                      {selectedOrder.currency === 'AED' ? 'AED' : '₹'} {item.unit_price?.toFixed(2)}
                                                    </span>
                                                  </div>
                                                </div>

                                                {item.special_requests && (
                                                  <div className="mt-3 p-2 bg-yellow-600/20 border border-yellow-600/40 rounded text-sm">
                                                    <span className="font-semibold text-yellow-400">Special Note:</span>
                                                    <span className="text-yellow-300 ml-2">{item.special_requests}</span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Price Section */}
                                              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                                                <div className="bg-gray-600 border border-gray-500 rounded-lg p-3 text-center">
                                                  <p className="text-xs text-gray-400 mb-1">Total</p>
                                                  <p className="font-bold text-xl text-blue-400">
                                                    {selectedOrder.currency === 'AED' ? 'AED' : '₹'} {item.total_price?.toFixed(2) || '0.00'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Order Summary Card */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-white mb-4">
                                    Order Summary
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                      <span className="text-gray-400">
                                        Subtotal:
                                      </span>
                                      <span className="font-semibold text-white">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedOrder.tax_amount > 0 && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                        <span className="text-gray-400">
                                          Tax:
                                        </span>
                                        <span className="font-semibold text-white">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.tax_amount?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    )}
                                    {selectedOrder.delivery_fee > 0 ? (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                        <span className="text-gray-400">
                                          Delivery Fee:
                                        </span>
                                        <span className="font-semibold text-white">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.delivery_fee?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    ) : selectedOrder.order_type === 'delivery' && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                        <span className="text-gray-400">
                                          Delivery Fee:
                                        </span>
                                        <span className="font-semibold text-green-400">
                                          FREE
                                        </span>
                                      </div>
                                    )}
                                    {selectedOrder.discount_amount > 0 && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                        <span className="text-green-400">
                                          Discount {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}:
                                        </span>
                                        <span className="font-semibold text-green-400">-{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.discount_amount?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center font-bold text-xl pt-4 mt-4 border-t-2 border-gray-600 bg-gray-700 rounded-lg p-4">
                                    <span className="text-white">
                                      Total Amount:
                                    </span>
                                    <span className="text-blue-400">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.final_total?.toFixed(2) || '0.00'}</span>
                                  </div>

                                  {selectedOrder.special_instructions && (
                                    <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-600/40 rounded-lg">
                                      <h5 className="font-semibold text-yellow-400 mb-2">
                                        Special Instructions
                                      </h5>
                                      <p className="text-yellow-300 text-sm leading-relaxed">{selectedOrder.special_instructions}</p>
                                    </div>
                                  )}
                                </div>


                              </div>
                            )}
                          </DialogContent>

                        </Dialog>

                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="pending" className="text-white">Pending</SelectItem>
                            <SelectItem value="confirmed" className="text-white">Confirmed</SelectItem>
                            <SelectItem value="packed" className="text-white">Packed</SelectItem>
                            <SelectItem value="dispatched" className="text-white">Dispatched</SelectItem>
                            <SelectItem value="out for delivery" className="text-white">Out for Delivery</SelectItem>
                            <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                            <SelectItem value="cancel" className="text-white">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                        {updating === order.id && (
                          <div className="text-xs text-blue-400 ml-2">Updating...</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No orders found {statusFilter !== "all" && `with status "${statusFilter}"`}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}
