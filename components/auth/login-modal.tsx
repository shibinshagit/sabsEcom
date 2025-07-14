"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, MessageSquare } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onWhatsAppRedirect?: () => void
  title?: string
  description?: string
}

export default function LoginModal({
  isOpen,
  onClose,
  onWhatsAppRedirect,
  title = "Login Required",
  description = "Please login to continue with your order/reservation",
}: LoginModalProps) {
  const { sendOTP, login } = useAuth()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await sendOTP(email)
      setOtpSent(true)
      setStep("otp")

      // Show OTP in development
      if (result.otp) {
        alert(`Development OTP: ${result.otp}`)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, otp, name)
      onClose()
      // Reset form
      setStep("email")
      setEmail("")
      setName("")
      setOtp("")
      setOtpSent(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const phoneNumber = "+1234567890" // Replace with actual restaurant WhatsApp number
    const message = encodeURIComponent("Hi! I'd like to make a reservation/order. Can you help me?")
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, "_blank")
    onWhatsAppRedirect?.()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {step === "email" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Login with Email</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enter OTP</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <Label htmlFor="otp">6-Digit OTP</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">OTP sent to {email}</p>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setStep("email")} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <Button
            onClick={handleWhatsApp}
            variant="outline"
            className="w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Continue with WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
