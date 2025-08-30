"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Clock, CheckCircle, AlertCircle, Package, CreditCard, Smartphone } from "lucide-react"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  order_type: string
  payment_method:string
  total_amount: number
  tax_amount: number
  delivery_fee: number
  final_total: number
  status: string
  special_instructions: string
  created_at: string
  updated_at: string
  items: Array<{
    id: number
    menu_item_name: string
    quantity: number
    unit_price: number
    total_price: number
    special_requests: string
  }>
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updating, setUpdating] = useState<number | null>(null)

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
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        console.log("Order updated successfully:", updatedOrder)
        
        // Update the order in the local state immediately
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
              : order
          )
        )
        
        // Also update selectedOrder if it's the one being updated
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
        }
        
        // Show success message
        console.log(`✅ Order #${orderId} status updated to: ${newStatus}`)
      } else {
        const errorData = await response.json()
        console.error("Failed to update order status:", errorData)
        throw new Error(errorData.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      setError(error instanceof Error ? error.message : "Failed to update order status")
      
      // Show error alert
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
      case "preparing":
        return <Package className="w-4 h-4" />
      case "ready":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
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
      case "preparing":
        return "bg-orange-500"
      case "ready":
        return "bg-green-500"
      case "completed":
        return "bg-green-600"
      case "cancelled":
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
              <SelectItem value="preparing" className="text-white">Preparing</SelectItem>
              <SelectItem value="ready" className="text-white">Ready</SelectItem>
              <SelectItem value="completed" className="text-white">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
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
                  <TableHead className="text-gray-300">Payment Type</TableHead>
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
                      <div className="flex items-center space-x-2">
                        {getPaymentIcon(order.payment_method)}
                        <Badge variant="outline" className="capitalize">
                          {order.payment_method?.toUpperCase() || 'COD'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">
                        <span className="font-semibold text-lg">₹{order.final_total?.toFixed(2) || '0.00'}</span>
                        {order.total_amount !== order.final_total && (
                          <p className="text-gray-400 text-xs">
                            Subtotal: ₹{order.total_amount?.toFixed(2) || '0.00'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                        <Badge variant="outline" className="capitalize">
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
                          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order #{order.id} Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                                    {selectedOrder.customer_email && (
                                      <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Order Information</h4>
                                    <p><strong>Payment Type:</strong> {selectedOrder.payment_method ?.toUpperCase() || 'COD'}</p>
                                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                                    <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items?.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                                        <div>
                                          <span className="font-medium">{item.menu_item_name}</span>
                                          <span className="text-gray-400 ml-2">x{item.quantity}</span>
                                          {item.special_requests && (
                                            <p className="text-gray-400 text-sm">{item.special_requests}</p>
                                          )}
                                        </div>
                                        <span>₹{item.total_price?.toFixed(2) || '0.00'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="border-t border-gray-600 pt-4">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
                                  </div>
                                  {selectedOrder.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                      <span>Tax:</span>
                                      <span>₹{selectedOrder.tax_amount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  )}
                                  {selectedOrder.delivery_fee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Delivery Fee:</span>
                                      <span>₹{selectedOrder.delivery_fee?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-2">
                                    <span>Total:</span>
                                    <span>₹{selectedOrder.final_total?.toFixed(2) || '0.00'}</span>
                                  </div>
                                </div>

                                {selectedOrder.special_instructions && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Special Instructions</h4>
                                    <p className="text-gray-300">{selectedOrder.special_instructions}</p>
                                  </div>
                                )}
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
                            <SelectItem value="preparing" className="text-white">Preparing</SelectItem>
                            <SelectItem value="ready" className="text-white">Ready</SelectItem>
                            <SelectItem value="completed" className="text-white">Completed</SelectItem>
                            <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
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
  )
}
