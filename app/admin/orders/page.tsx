"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Clock, CheckCircle, AlertCircle, Package, Truck } from "lucide-react"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  order_type: string
  total_amount: number
  tax_amount: number
  delivery_fee: number
  final_total: number
  status: string
  special_instructions: string
  created_at: string
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchOrders()
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-white">
                All Orders
              </SelectItem>
              <SelectItem value="pending" className="text-white">
                Pending
              </SelectItem>
              <SelectItem value="confirmed" className="text-white">
                Confirmed
              </SelectItem>
              <SelectItem value="preparing" className="text-white">
                Preparing
              </SelectItem>
              <SelectItem value="ready" className="text-white">
                Ready
              </SelectItem>
              <SelectItem value="completed" className="text-white">
                Completed
              </SelectItem>
              <SelectItem value="cancelled" className="text-white">
                Cancelled
              </SelectItem>
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
                  <TableHead className="text-gray-300">Type</TableHead>
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
                        {order.order_type === "delivery" && <Truck className="w-4 h-4 text-blue-400" />}
                        <Badge variant="outline" className="capitalize">
                          {order.order_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white font-semibold">${order.final_total}</span>
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
                      <span className="text-gray-300">{new Date(order.created_at).toLocaleDateString()}</span>
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
                                    <p>
                                      <strong>Name:</strong> {selectedOrder.customer_name}
                                    </p>
                                    <p>
                                      <strong>Phone:</strong> {selectedOrder.customer_phone}
                                    </p>
                                    {selectedOrder.customer_email && (
                                      <p>
                                        <strong>Email:</strong> {selectedOrder.customer_email}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Order Information</h4>
                                    <p>
                                      <strong>Type:</strong> {selectedOrder.order_type}
                                    </p>
                                    <p>
                                      <strong>Status:</strong> {selectedOrder.status}
                                    </p>
                                    <p>
                                      <strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items?.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between items-center p-2 bg-gray-700 rounded"
                                      >
                                        <div>
                                          <span className="font-medium">{item.menu_item_name}</span>
                                          <span className="text-gray-400 ml-2">x{item.quantity}</span>
                                        </div>
                                        <span>${item.total_price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="border-t border-gray-600 pt-4">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${selectedOrder.total_amount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>${selectedOrder.tax_amount}</span>
                                  </div>
                                  {selectedOrder.delivery_fee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Delivery Fee:</span>
                                      <span>${selectedOrder.delivery_fee}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-2">
                                    <span>Total:</span>
                                    <span>${selectedOrder.final_total}</span>
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

                        <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="pending" className="text-white">
                              Pending
                            </SelectItem>
                            <SelectItem value="confirmed" className="text-white">
                              Confirmed
                            </SelectItem>
                            <SelectItem value="preparing" className="text-white">
                              Preparing
                            </SelectItem>
                            <SelectItem value="ready" className="text-white">
                              Ready
                            </SelectItem>
                            <SelectItem value="completed" className="text-white">
                              Completed
                            </SelectItem>
                            <SelectItem value="cancelled" className="text-white">
                              Cancelled
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
