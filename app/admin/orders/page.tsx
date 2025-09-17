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

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updating, setUpdating] = useState<number | null>(null)
  const [trackingUrls, setTrackingUrls] = useState<{[key: number]: string}>({})


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
  }, [])

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
      const trackingUrl = trackingUrls[orderId] || ''

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          tracking_url: trackingUrl,
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
                         
                          <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[95vh] p-0">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    #{order.id}
                                  </div>
                                  <span>Order #{order.id} - {order.customer_name}</span>
                                  <Badge className={`ml-auto ${getStatusColor(order.status)} text-white px-3 py-1 text-sm font-medium`}>
                                    {order.status.toUpperCase()}
                                  </Badge>
                                </DialogTitle>
                                <p className="text-gray-600 mt-2 text-sm">
                                  📅 Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        👤 Customer Information
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {selectedOrder.customer_name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                                            <p className="text-gray-600 text-sm">{selectedOrder.customer_phone}</p>
                                          </div>
                                        </div>
                                        {selectedOrder.customer_email && (
                                          <p className="text-gray-600 text-sm pl-11">📧 {selectedOrder.customer_email}</p>
                                        )}
                                      </div>

                                      {/* Address Information */}
                                      {selectedOrder.delivery_address && (
                                        <div className="mt-5">
                                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            🏠 Delivery Address
                                          </h5>
                                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                                            {selectedOrder.delivery_address}
                                          </div>
                                        </div>
                                      )}

                                      {selectedOrder.customer_address && (
                                        <div className="mt-4">
                                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            📍 Customer Address
                                          </h5>
                                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                                            {selectedOrder.customer_address}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        📋 Order Details
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                          <span className="text-gray-600">Order Type:</span>
                                          <Badge className="bg-green-100 text-green-800 capitalize">{selectedOrder.order_type}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                          <span className="text-gray-600">Currency:</span>
                                          <Badge className="bg-yellow-100 text-yellow-800">{selectedOrder.currency || 'INR'}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                          <span className="text-gray-600">Status:</span>
                                          <Badge className={`${getStatusColor(selectedOrder.status).replace('bg-', 'bg-').replace('-500', '-100')} text-gray-800 capitalize`}>
                                            {selectedOrder.status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                          <span className="text-gray-600">Order Date:</span>
                                          <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                          <span className="text-gray-600">Order Time:</span>
                                          <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleTimeString()}</span>
                                        </div>
                                      </div>

                                      {/* Tracking URL Section */}
                                      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                                        <Label htmlFor={`tracking-${selectedOrder.id}`} className="text-sm font-bold text-gray-900 mb-3 block flex items-center gap-2">
                                          📦 Package Tracking
                                        </Label>
                                        <div className="flex gap-2">
                                          <Input
                                            id={`tracking-${selectedOrder.id}`}
                                            type="url"
                                            placeholder="https://example.com/track/ORDER123"
                                            value={trackingUrls[selectedOrder.id] || selectedOrder.tracking_url || ''}
                                            onChange={(e) => setTrackingUrls(prev => ({
                                              ...prev,
                                              [selectedOrder.id]: e.target.value
                                            }))}
                                            className="flex-1 border-gray-300 text-gray-900 placeholder-gray-500 text-sm"
                                          />
                                          {(trackingUrls[selectedOrder.id] || selectedOrder.tracking_url) && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="px-3 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
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
                                              className="px-3 border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
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
                                        <p className="text-xs text-gray-600 mt-2">
                                          Customer tracking URL (automatically sent in status update emails)
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Information Card */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    💳 Payment Information
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                      <span className="text-gray-600">Method:</span>
                                      <Badge className="bg-green-100 text-green-800">{selectedOrder.payment_method?.toUpperCase() || 'COD'}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        selectedOrder.payment_status === 'completed' ? 'bg-green-500' :
                                        selectedOrder.payment_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                      }`}></div>
                                      <span className="text-gray-600">Status:</span>
                                      <Badge className={`capitalize ${
                                        selectedOrder.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                                        selectedOrder.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>{selectedOrder.payment_status || 'pending'}</Badge>
                                    </div>
                                  </div>

                                  {/* Razorpay Details for Bank Reconciliation */}
                                  {(selectedOrder.razorpay_order_id || selectedOrder.razorpay_payment_id) && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <h6 className="font-bold text-gray-900 mb-3 flex items-center gap-2">🏦 Bank Reconciliation</h6>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {selectedOrder.razorpay_order_id && (
                                          <div><strong>Order ID:</strong> <span className="font-mono text-blue-600">{selectedOrder.razorpay_order_id}</span></div>
                                        )}
                                        {selectedOrder.razorpay_payment_id && (
                                          <div><strong>Payment ID:</strong> <span className="font-mono text-blue-600">{selectedOrder.razorpay_payment_id}</span></div>
                                        )}
                                        {selectedOrder.bank_reference_num && (
                                          <div><strong>Bank Ref:</strong> <span className="font-mono text-orange-600">{selectedOrder.bank_reference_num}</span></div>
                                        )}
                                        {selectedOrder.payment_method_type && (
                                          <div><strong>Type:</strong> <span className="capitalize">{selectedOrder.payment_method_type}</span></div>
                                        )}
                                        {selectedOrder.payment_bank && (
                                          <div><strong>Bank:</strong> {selectedOrder.payment_bank}</div>
                                        )}
                                        {selectedOrder.payment_vpa && (
                                          <div><strong>UPI:</strong> <span className="font-mono">{selectedOrder.payment_vpa}</span></div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items Card */}
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    🍽️ Order Items ({selectedOrder.items?.length || 0})
                                  </h4>
                                  <div className="space-y-4">
                                    {selectedOrder.items?.map((item, index) => (
                                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                          {/* Product Image */}
                                          <div className="flex-shrink-0">
                                            {console.log(item)}
                                            {item.product_image_url ? (
                                              <Image
                                                src={item.product_image_urls[0]}
                                                alt={item.menu_item_name}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                                              />
                                            ) : (
                                              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-orange-600" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Item Details */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                                                    {index + 1}
                                                  </span>
                                                  <h5 className="font-bold text-gray-900 text-lg leading-tight">{item.menu_item_name}</h5>
                                                </div>

                                                {item.variant_name && item.variant_name !== 'Default' && (
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                      {item.variant_name}
                                                    </Badge>
                                                  </div>
                                                )}

                                                <div className="flex items-center gap-4 mb-2">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-600">Qty:</span>
                                                    <Badge className="bg-blue-100 text-blue-800 font-bold">
                                                      {item.quantity} {item.quantity > 1 ? 'pcs' : 'pc'}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-600">Unit Price:</span>
                                                    <span className="font-medium text-gray-900">
                                                      {selectedOrder.currency === 'AED' ? 'AED' : '₹'} {item.unit_price?.toFixed(2)}
                                                    </span>
                                                  </div>
                                                </div>

                                                {item.special_requests && (
                                                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                                    <span className="font-semibold text-yellow-800">📝 Special Note:</span>
                                                    <span className="text-yellow-700 ml-2">{item.special_requests}</span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Price Section */}
                                              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                                                  <p className="text-xs text-gray-600 mb-1">Total</p>
                                                  <p className="font-bold text-xl text-orange-600">
                                                    {selectedOrder.currency === 'AED' ? 'AED' : '₹'} {item.total_price?.toFixed(2) || '0.00'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Summary Card */}
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    📋 Order Summary
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                      <span className="text-gray-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Subtotal:
                                      </span>
                                      <span className="font-semibold text-gray-900">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedOrder.tax_amount > 0 && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 flex items-center gap-2">
                                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                          Tax:
                                        </span>
                                        <span className="font-semibold text-gray-900">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.tax_amount?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    )}
                                    {selectedOrder.delivery_fee > 0 ? (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 flex items-center gap-2">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                          Delivery Fee:
                                        </span>
                                        <span className="font-semibold text-gray-900">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.delivery_fee?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    ) : selectedOrder.order_type === 'delivery' && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Delivery Fee:
                                        </span>
                                        <span className="font-semibold text-green-600 flex items-center gap-1">
                                          FREE! 🎉
                                        </span>
                                      </div>
                                    )}
                                    {selectedOrder.discount_amount > 0 && (
                                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-green-600 flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Discount {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}:
                                        </span>
                                        <span className="font-semibold text-green-600">-{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.discount_amount?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center font-bold text-xl pt-4 mt-4 border-t-2 border-gray-300 bg-white rounded-lg p-4 shadow-sm">
                                    <span className="text-gray-900 flex items-center gap-2">
                                      💰 Total Amount:
                                    </span>
                                    <span className="text-orange-600">{selectedOrder.currency === 'AED' ? 'AED' : '₹'} {selectedOrder.final_total?.toFixed(2) || '0.00'}</span>
                                  </div>

                                  {selectedOrder.special_instructions && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                      <h5 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                                        📝 Special Instructions
                                      </h5>
                                      <p className="text-yellow-700 text-sm leading-relaxed">{selectedOrder.special_instructions}</p>
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
