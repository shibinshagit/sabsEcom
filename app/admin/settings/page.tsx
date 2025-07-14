"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, SettingsIcon, Store, MapPin, CreditCard } from "lucide-react"
import ImageUpload from "@/components/ui/image-upload"

interface Setting {
  id: number
  key: string
  value: string
  type: string
  category: string
  label: string
  description: string
}

interface OpeningHours {
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: "5:00 PM - 10:00 PM",
    tuesday: "5:00 PM - 10:00 PM",
    wednesday: "5:00 PM - 10:00 PM",
    thursday: "5:00 PM - 10:00 PM",
    friday: "5:00 PM - 11:00 PM",
    saturday: "5:00 PM - 11:00 PM",
    sunday: "4:00 PM - 9:00 PM",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/settings")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: Setting[] = await response.json()
      setSettings(data)

      // Parse opening hours
      const hoursSettings = data.find((s) => s.key === "opening_hours")
      if (hoursSettings?.value) {
        try {
          const hours = JSON.parse(hoursSettings.value)
          setOpeningHours(hours)
        } catch (e) {
          console.error("Failed to parse opening hours:", e)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch settings: ${message}`)
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => {
      const existingIndex = prev.findIndex((setting) => setting.key === key)
      if (existingIndex >= 0) {
        // Update existing setting
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], value }
        return updated
      } else {
        // Add new setting if it doesn't exist
        const newSetting: Setting = {
          id: Date.now(), // temporary ID
          key,
          value,
          type: "text",
          category: "general",
          label: key,
          description: "",
        }
        return [...prev, newSetting]
      }
    })
  }

  const getSetting = (key: string): string => {
    return settings.find((s) => s.key === key)?.value || ""
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update opening hours in settings
      const updatedSettings = settings.map((setting) =>
        setting.key === "opening_hours" ? { ...setting, value: JSON.stringify(openingHours) } : setting,
      )

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedSettings }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      alert("Settings saved successfully!")
      // Refresh settings to get any server-side updates
      await fetchSettings()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to save settings: ${message}`)
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold">Error Loading Settings</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <Button onClick={fetchSettings} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            <Store className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            <MapPin className="w-4 h-4 mr-2" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="restaurant_name">Restaurant Name</Label>
                <Input
                  id="restaurant_name"
                  value={getSetting("restaurant_name")}
                  onChange={(e) => updateSetting("restaurant_name", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label>Opening Hours</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div key={day}>
                      <Label htmlFor={day} className="capitalize">
                        {day}
                      </Label>
                      <Input
                        id={day}
                        value={hours}
                        onChange={(e) => setOpeningHours({ ...openingHours, [day]: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="5:00 PM - 10:00 PM"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={getSetting("phone")}
                    onChange={(e) => updateSetting("phone", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={getSetting("email")}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={getSetting("website")}
                  onChange={(e) => updateSetting("website", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-4">
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={getSetting("address_line1")}
                      onChange={(e) => updateSetting("address_line1", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={getSetting("address_line2")}
                      onChange={(e) => updateSetting("address_line2", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={getSetting("city")}
                      onChange={(e) => updateSetting("city", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={getSetting("state")}
                      onChange={(e) => updateSetting("state", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={getSetting("postal_code")}
                      onChange={(e) => updateSetting("postal_code", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={getSetting("country")}
                      onChange={(e) => updateSetting("country", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Media</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="social_facebook">Facebook URL</Label>
                    <Input
                      id="social_facebook"
                      value={getSetting("social_facebook")}
                      onChange={(e) => updateSetting("social_facebook", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_instagram">Instagram URL</Label>
                    <Input
                      id="social_instagram"
                      value={getSetting("social_instagram")}
                      onChange={(e) => updateSetting("social_instagram", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_twitter">Twitter URL</Label>
                    <Input
                      id="social_twitter"
                      value={getSetting("social_twitter")}
                      onChange={(e) => updateSetting("social_twitter", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://twitter.com/yourprofile"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency_code">Currency Code</Label>
                  <Input
                    id="currency_code"
                    value={getSetting("currency_code")}
                    onChange={(e) => updateSetting("currency_code", e.target.value.toUpperCase())}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="USD"
                  />
                  <p className="text-gray-400 text-sm mt-1">ISO currency code (USD, EUR, GBP, etc.)</p>
                </div>
                <div>
                  <Label htmlFor="currency_symbol">Currency Symbol</Label>
                  <Input
                    id="currency_symbol"
                    value={getSetting("currency_symbol")}
                    onChange={(e) => updateSetting("currency_symbol", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="$"
                  />
                  <p className="text-gray-400 text-sm mt-1">Symbol to display with prices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                value={getSetting("restaurant_logo")}
                onChange={(url) => updateSetting("restaurant_logo", url)}
                label="Restaurant Logo"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
