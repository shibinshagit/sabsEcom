"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, CheckCircle, XCircle, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

interface Reservation {
  id: number
  status: string
  party_size: number
  reservation_date: string
  reservation_time: string
  special_requests: string
  table_preference: string
  occasion: string
  dietary_restrictions: string
  confirmation_code: string
  created_at: string
}

export default function UserReservationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    if (isAuthenticated) {
      fetchReservations()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/user/reservations")
      if (response.ok) {
        const data = await response.json()
        setReservations(data)
      }
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
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
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reservations</h1>
          <p className="text-gray-600">View and manage your restaurant reservations</p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No reservations yet</h3>
              <p className="text-gray-600 mb-6">Book a table for your next dining experience</p>
              <Link href="/reservations">
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">Make Reservation</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Reservation #{reservation.id}</CardTitle>
                    <Badge className={getStatusColor(reservation.status)}>
                      {getStatusIcon(reservation.status)}
                      <span className="ml-1 capitalize">{reservation.status}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      Confirmation Code: <strong>{reservation.confirmation_code}</strong>
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Reservation Details */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <CalendarDays className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Date & Time</p>
                          <p className="text-gray-600">
                            {new Date(reservation.reservation_date).toLocaleDateString()} at{" "}
                            {new Date(`2000-01-01T${reservation.reservation_time}`).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Party Size</p>
                          <p className="text-gray-600">
                            {reservation.party_size} {reservation.party_size === 1 ? "guest" : "guests"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Requested</p>
                          <p className="text-gray-600">
                            {new Date(reservation.created_at).toLocaleDateString()} at{" "}
                            {new Date(reservation.created_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      {reservation.occasion && reservation.occasion !== "none" && (
                        <div>
                          <p className="font-medium text-gray-800">Occasion</p>
                          <p className="text-gray-600 capitalize">{reservation.occasion}</p>
                        </div>
                      )}

                      {reservation.table_preference && reservation.table_preference !== "none" && (
                        <div>
                          <p className="font-medium text-gray-800">Table Preference</p>
                          <p className="text-gray-600 capitalize">{reservation.table_preference}</p>
                        </div>
                      )}

                      {reservation.dietary_restrictions && (
                        <div>
                          <p className="font-medium text-gray-800">Dietary Restrictions</p>
                          <p className="text-gray-600">{reservation.dietary_restrictions}</p>
                        </div>
                      )}

                      {reservation.special_requests && (
                        <div>
                          <p className="font-medium text-gray-800">Special Requests</p>
                          <p className="text-gray-600">{reservation.special_requests}</p>
                        </div>
                      )}
                    </div>
                  </div>
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
