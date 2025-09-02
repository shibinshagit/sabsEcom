"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck, ChefHat } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"

function formatMoney(value: unknown) {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value ?? 0))
  return num.toFixed(2)
}

interface OrderItem {
  id: number
  menu_item_name: string
  quantity: number
  unit_price: number | string
  total_price: number | string
}

interface Order {
  id: number
  status: string
  order_type: string
  customer_name: string
  payment_method:string
  total_amount: number | string
  delivery_fee: number | string
  final_total: number | string
  special_instructions: string
  created_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/products")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserOrders()
    }
  }, [isAuthenticated, user])

  const fetchUserOrders = async () => {
    try {
      setError(null)
      const response = await fetch("/api/orders")
      
      if (response.status === 401) {
        router.push("/products")
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch orders")
        setOrders([])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Network error while fetching orders")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-purple-100 text-purple-800"
      case "out-for-delivery":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      case "preparing":
        return <ChefHat className="w-4 h-4" />
      case "out-for-delivery":
        return <Truck className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Your order has been received and is being processed"
      case "confirmed":
        return "Your order has been confirmed and is being prepared"
      case "preparing":
        return "Our chefs are preparing your delicious meal"
      case "ready":
        return "Your order is ready for pickup/delivery"
      case "out-for-delivery":
        return "Your order is on its way to you"
      case "completed":
        return "Your order has been completed. Enjoy your meal!"
      case "cancelled":
        return "This order has been cancelled"
      default:
        return "Order status update"
    }
  }

  // Show loading while checking authentication
  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      {/* <section className="relative h-64 bg-black flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="/placeholder.svg?height=400&width=1200"
            alt="Orders Background"
            fill
            className="object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="font-playfair text-5xl font-bold text-white mb-4">My Orders</h1>
          <p className="text-xl text-gray-200">Track your order history and current status</p>
        </div>
      </section> */}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {user?.name ? `${user.name}'s Orders` : 'Your Orders'}
          </h2>
          <p className="text-gray-600">Real-time updates on your orders</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchUserOrders}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {orders.length === 0 && !error ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
              <button
                onClick={() => router.push("/products")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Shopping
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: <span className="font-medium">{order.customer_name}</span>
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {order.payment_method} • Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-blue-600">{getStatusDescription(order.status)}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-800">Order Items:</h4>
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex-1">
                          <span className="font-medium">{item.menu_item_name}</span>
                          <span className="text-gray-600 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-medium">${formatMoney(item.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${formatMoney(order.total_amount)}</span>
                      </div>
                      {Number(order.delivery_fee) > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Fee</span>
                          <span>${formatMoney(order.delivery_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total</span>
                        <span>${formatMoney(order.final_total)}</span>
                      </div>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        <strong>Special Instructions:</strong> {order.special_instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}