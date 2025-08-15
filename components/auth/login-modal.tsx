
// "use client"
// import type React from "react"
// import { useState } from "react"
// import { useAuth } from "@/lib/contexts/auth-context"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Mail, MessageSquare, ArrowLeft, Shield, CheckCircle, Eye, EyeOff, Lock, User } from 'lucide-react'

// interface LoginModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onWhatsAppRedirect?: () => void
//   title?: string
//   description?: string
// }

// export default function LoginModal({
//   isOpen,
//   onClose,
//   onWhatsAppRedirect,
//   title = "Login Required",
//   description = "Please login to continue with your order/reservation",
// }: LoginModalProps) {
//   const { sendOTP, login, register, loginWithPassword } = useAuth()
//   const [mode, setMode] = useState<"login" | "register">("login")
//   const [step, setStep] = useState<"email" | "otp" | "password">("email")
//   const [email, setEmail] = useState("")
//   const [name, setName] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [otp, setOtp] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [otpSent, setOtpSent] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

//   const resetForm = () => {
//     setStep("email")
//     setEmail("")
//     setName("")
//     setPassword("")
//     setConfirmPassword("")
//     setOtp("")
//     setOtpSent(false)
//     setError("")
//     setShowPassword(false)
//     setShowConfirmPassword(false)
//   }

//   const handleModeChange = (newMode: "login" | "register") => {
//     setMode(newMode)
//     resetForm()
//   }

//   const handlePasswordLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError("")

//     try {
//       await loginWithPassword(email, password)
//       onClose()
//       resetForm()
//     } catch (error: any) {
//       setError(error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSendOTP = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError("")

//     try {
//       const result = await sendOTP(email)
//       setOtpSent(true)
//       setStep("otp")

//       // Show OTP in development
//       if (result.otp) {
//         alert(`Development OTP: ${result.otp}`)
//       }
//     } catch (error: any) {
//       setError(error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleVerifyOTP = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError("")

//     try {
//       if (mode === "register") {
//         if (password !== confirmPassword) {
//           setError("Passwords don't match")
//           setLoading(false)
//           return
//         }
//         if (password.length < 6) {
//           setError("Password must be at least 6 characters")
//           setLoading(false)
//           return
//         }
//         await register(email, otp, name, password)
//       } else {
//         await login(email, otp, name)
//       }
//       onClose()
//       resetForm()
//     } catch (error: any) {
//       setError(error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleWhatsApp = () => {
//     const phoneNumber = "+1234567890" // Replace with actual restaurant WhatsApp number
//     const message = encodeURIComponent("Hi! I'd like to make a reservation/order. Can you help me?")
//     const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
//     window.open(whatsappUrl, "_blank")
//     onWhatsAppRedirect?.()
//     onClose()
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-md border-0 p-0 bg-transparent shadow-2xl">
//         <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
//           {/* Header Section */}
//           <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white">
//             <DialogHeader className="space-y-3">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
//                   <Shield className="w-5 h-5 text-white" />
//                 </div>
//                 <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
//               </div>
//               <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
//             </DialogHeader>
//           </div>

//           <div className="p-8">
//             {step === "email" ? (
//               <div className="space-y-6">
//                 {/* Mode Tabs */}
//                 <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
//                   <TabsList className="grid w-full grid-cols-2 mb-6">
//                     <TabsTrigger value="login">Login</TabsTrigger>
//                     <TabsTrigger value="register">Register</TabsTrigger>
//                   </TabsList>

//                   <TabsContent value="login" className="space-y-6">
                    
//                     <form onSubmit={handlePasswordLogin} className="space-y-5">
//                       <div className="space-y-2">
//                         <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
//                           Email Address
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="login-email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="your@email.com"
//                             required
//                             className="h-12 pl-4 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
//                           Password
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="login-password"
//                             type={showPassword ? "text" : "password"}
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="Enter your password"
//                             required
//                             className="h-12 pl-8 pr-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                           <button
//                             type="button"
//                             onClick={() => setShowPassword(!showPassword)}
//                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                           >
//                             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                           </button>
//                         </div>
//                       </div>

//                       {error && (
//                         <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                           <p className="text-sm text-red-700 font-medium">{error}</p>
//                         </div>
//                       )}

//                       <Button 
//                         type="submit" 
//                         disabled={loading} 
//                         className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
//                       >
//                         {loading ? (
//                           <div className="flex items-center gap-2">
//                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                             Logging in...
//                           </div>
//                         ) : (
//                           <div className="flex items-center gap-2">
//                             <Lock className="w-4 h-4" />
//                             Login
//                           </div>
//                         )}
//                       </Button>
//                     </form>

//                     {/* OTP Login Alternative */}
//                     <div className="text-center">
//                       <button
//                         onClick={() => setStep("email")}
//                         className="text-sm text-slate-600 hover:text-slate-900 underline"
//                       >
//                         Or login with OTP instead
//                       </button>
//                     </div>
//                   </TabsContent>

//                   <TabsContent value="register" className="space-y-6">

//                     <form onSubmit={handleSendOTP} className="space-y-5">
//                       <div className="space-y-2">
//                         <Label htmlFor="register-name" className="text-sm font-medium text-slate-700">
//                           Full Name
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="register-name"
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             placeholder="Your full name"
//                             required
//                             className="h-12 pl-10 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="register-email" className="text-sm font-medium text-slate-700">
//                           Email Address
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="register-email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="your@email.com"
//                             required
//                             className="h-12 pl-10 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">
//                           Password
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="register-password"
//                             type={showPassword ? "text" : "password"}
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="Create a password"
//                             required
//                             minLength={6}
//                             className="h-12 pl-10 pr-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                           <button
//                             type="button"
//                             onClick={() => setShowPassword(!showPassword)}
//                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                           >
//                             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                           </button>
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
//                           Confirm Password
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="confirm-password"
//                             type={showConfirmPassword ? "text" : "password"}
//                             value={confirmPassword}
//                             onChange={(e) => setConfirmPassword(e.target.value)}
//                             placeholder="Confirm your password"
//                             required
//                             minLength={6}
//                             className="h-12 pl-10 pr-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
//                           />
//                           <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                           <button
//                             type="button"
//                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                           >
//                             {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                           </button>
//                         </div>
//                       </div>

//                       {error && (
//                         <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                           <p className="text-sm text-red-700 font-medium">{error}</p>
//                         </div>
//                       )}

//                       <Button 
//                         type="submit" 
//                         disabled={loading} 
//                         className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
//                       >
//                         {loading ? (
//                           <div className="flex items-center gap-2">
//                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                             Sending verification...
//                           </div>
//                         ) : (
//                           <div className="flex items-center gap-2">
//                             <Mail className="w-4 h-4" />
//                             Send verification code
//                           </div>
//                         )}
//                       </Button>
//                     </form>
//                   </TabsContent>
//                 </Tabs>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {/* OTP Step */}
//                 <div className="text-center space-y-3">
//                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//                     <CheckCircle className="w-8 h-8 text-green-600" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-slate-900">Check your email</h3>
//                   <p className="text-sm text-slate-600">
//                     We've sent a 6-digit verification code to<br />
//                     <span className="font-medium text-slate-900">{email}</span>
//                   </p>
//                 </div>

//                 <form onSubmit={handleVerifyOTP} className="space-y-5">
//                   <div className="space-y-2">
//                     <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
//                       Verification Code
//                     </Label>
//                     <Input
//                       id="otp"
//                       value={otp}
//                       onChange={(e) => setOtp(e.target.value)}
//                       placeholder="000000"
//                       maxLength={6}
//                       required
//                       className="h-12 pl-4 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm text-center text-lg font-mono tracking-widest"
//                     />
//                   </div>

//                   {error && (
//                     <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                       <p className="text-sm text-red-700 font-medium">{error}</p>
//                     </div>
//                   )}

//                   <div className="flex gap-3">
//                     <Button 
//                       type="button" 
//                       variant="outline" 
//                       onClick={() => setStep("email")} 
//                       className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
//                     >
//                       <ArrowLeft className="w-4 h-4 mr-2" />
//                       Back
//                     </Button>
//                     <Button 
//                       type="submit" 
//                       disabled={loading} 
//                       className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
//                     >
//                       {loading ? (
//                         <div className="flex items-center gap-2">
//                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                           Verifying...
//                         </div>
//                       ) : (
//                         mode === "register" ? "Create Account" : "Verify & Login"
//                       )}
//                     </Button>
//                   </div>
//                 </form>
//               </div>
//             )}

//             {/* Divider */}
//             <div className="relative my-8">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t border-slate-200" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-white px-4 text-slate-500 font-medium">Or continue with</span>
//               </div>
//             </div>

//             {/* WhatsApp Button */}
//             <Button
//               onClick={handleWhatsApp}
//               variant="outline"
//               className="w-full h-12 border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 bg-green-50/50 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
//             >
//               <MessageSquare className="w-5 h-5 mr-3 text-green-600" />
//               Continue with WhatsApp
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

"use client"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageSquare, ArrowLeft, Shield, CheckCircle, Eye, EyeOff, Lock, User } from "lucide-react"

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
  const { sendOTP, login, register, loginWithPassword } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [step, setStep] = useState<"email" | "otp" | "password">("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const resetForm = () => {
    setStep("email")
    setEmail("")
    setName("")
    setPassword("")
    setConfirmPassword("")
    setOtp("")
    setOtpSent(false)
    setError("")
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeChange = (newMode: "login" | "register") => {
    setMode(newMode)
    resetForm()
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await loginWithPassword(email, password)
      onClose()
      resetForm()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
      if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Passwords don't match")
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters")
          setLoading(false)
          return
        }
        await register(email, otp, name, password)
      } else {
        await login(email, otp, name)
      }
      onClose()
      resetForm()
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
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] border-0 p-0 bg-transparent shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex-shrink-0">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <DialogTitle className="text-lg font-semibold text-white">{title}</DialogTitle>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {step === "email" ? (
              <div className="space-y-5">
                {/* Mode Tabs */}
                <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="h-10 pl-4 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                          />
                          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="h-10 pl-8 pr-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                          <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Logging in...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Login
                          </div>
                        )}
                      </Button>
                    </form>

                    {/* OTP Login Alternative */}
                    <div className="text-center">
                      <button
                        onClick={() => setStep("email")}
                        className="text-sm text-slate-600 hover:text-slate-900 underline"
                      >
                        Or login with OTP instead
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="register-name" className="text-sm font-medium text-slate-700">
                          Full Name
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                            className="h-10 pl-8 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="register-email" className="text-sm font-medium text-slate-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="h-10 pl-8 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create a password"
                              required
                              minLength={6}
                              className="h-10 pl-8 pr-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                            />
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your password"
                              required
                              minLength={6}
                              className="h-10 pl-8 pr-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm"
                            />
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                          <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending verification...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Send verification code
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="space-y-5">
                {/* OTP Step */}
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Check your email</h3>
                  <p className="text-sm text-slate-600">
                    We've sent a 6-digit verification code to
                    <br />
                    <span className="font-medium text-slate-900">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-sm font-medium text-slate-700">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="h-10 pl-4 pr-4 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg text-slate-900 placeholder:text-slate-400 bg-white shadow-sm text-center text-lg font-mono tracking-widest"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("email")}
                      className="flex-1 h-10 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </div>
                      ) : mode === "register" ? (
                        "Create Account"
                      ) : (
                        "Verify & Login"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* WhatsApp Button */}
            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="w-full h-10 border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 bg-green-50/50 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <MessageSquare className="w-5 h-5 mr-3 text-green-600" />
              Continue with WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
