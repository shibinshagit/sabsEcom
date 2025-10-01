"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, SettingsIcon, Store, MapPin, CreditCard, Zap, Timer, ToggleLeft } from "lucide-react"
import { useShop } from "@/lib/contexts/shop-context"
import ImageUploadSingle from "@/components/ui/ImageUploadSingle"

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

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { shop, setShop } = useShop()
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: "5:00 PM - 10:00 PM",
    tuesday: "5:00 PM - 10:00 PM",
    wednesday: "5:00 PM - 10:00 PM",
    thursday: "5:00 PM - 10:00 PM",
    friday: "5:00 PM - 11:00 PM",
    saturday: "5:00 PM - 11:00 PM",
    sunday: "4:00 PM - 9:00 PM",
  })
  const [shopFeaturesSettings, setShopFeaturesSettings] = useState({
    popup_enabled: 'true',
    popup_initial_delay: '10',
    popup_interval: '15',
    popup_max_shows: '2',
    floating_ad_enabled: 'true',
    floating_ad_scroll_trigger: '400',
    floating_ad_duration: '2',
    floating_ad_cooldown: '4',
    floating_ad_max_shows: '3'
  })

  useEffect(() => {
    fetchSettings()
    fetchShopFeaturesSettings()
  }, [])

  const fetchShopFeaturesSettings = async () => {
    try {
      const response = await fetch('/api/admin/shop-features')
      if (response.ok) {
        const data = await response.json()
        setShopFeaturesSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch shop features settings:', error)
    }
  }

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

  const updateShopFeaturesSetting = (key: string, value: string) => {
    setShopFeaturesSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getShopFeaturesSetting = (key: string): string => {
    return shopFeaturesSettings[key as keyof typeof shopFeaturesSettings] || ""
  }

  const saveShopFeaturesSettings = async () => {
    setSaving(true)
    try {
      // Save each setting individually
      const promises = Object.entries(shopFeaturesSettings).map(([key, value]) =>
        fetch('/api/admin/shop-features', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        })
      )

      await Promise.all(promises)
      
      // Show success message
      setError(null)
      // You could add a success toast here
      
    } catch (error) {
      console.error('Failed to save shop features settings:', error)
      setError('Failed to save shop features settings')
    } finally {
      setSaving(false)
    }
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
    <div className="max-w-2xl mx-auto bg-transparent p-2 sm:p-4 md:p-6 rounded-none sm:rounded-lg shadow-lg overflow-y-auto max-h-[95vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
      <div className="sticky top-0 z-20 bg-gray-900/95 shadow-lg px-4 py-2">
  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
    <TabsList className="flex gap-3 min-w-max">
      <TabsTrigger
        value="general"
        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
      >
        <Store className="w-4 h-4" />
        General
      </TabsTrigger>

      <TabsTrigger
        value="contact"
        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
      >
        <MapPin className="w-4 h-4" />
        Contact
      </TabsTrigger>

      <TabsTrigger
        value="payment"
        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
      >
        <CreditCard className="w-4 h-4" />
        Payment
      </TabsTrigger>

      <TabsTrigger
        value="appearance"
        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
      >
        <SettingsIcon className="w-4 h-4" />
        Appearance
      </TabsTrigger>

      <TabsTrigger
        value="shop-features"
        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
      >
        <Zap className="w-4 h-4" />
        Shop Features
      </TabsTrigger>
    </TabsList>
  </div>
</div>


        <TabsContent value="general">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="restaurant_name">Company Name</Label>
                <Input
                  id="restaurant_name"
                  value={getSetting("restaurant_name")}
                  onChange={(e) => updateSetting("restaurant_name", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white h-12"
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
                        className="bg-gray-700 border-gray-600 text-white h-12"
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
                    className="bg-gray-700 border-gray-600 text-white h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={getSetting("email")}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white h-12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={getSetting("website")}
                  onChange={(e) => updateSetting("website", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white h-12"
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
                      className="bg-gray-700 border-gray-600 text-white h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={getSetting("address_line2")}
                      onChange={(e) => updateSetting("address_line2", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={getSetting("city")}
                      onChange={(e) => updateSetting("city", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={getSetting("state")}
                      onChange={(e) => updateSetting("state", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={getSetting("postal_code")}
                      onChange={(e) => updateSetting("postal_code", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={getSetting("country")}
                      onChange={(e) => updateSetting("country", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
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
                      className="bg-gray-700 border-gray-600 text-white h-12"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_instagram">Instagram URL</Label>
                    <Input
                      id="social_instagram"
                      value={getSetting("social_instagram")}
                      onChange={(e) => updateSetting("social_instagram", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social_twitter">Twitter URL</Label>
                    <Input
                      id="social_twitter"
                      value={getSetting("social_twitter")}
                      onChange={(e) => updateSetting("social_twitter", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-12"
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
                    className="bg-gray-700 border-gray-600 text-white h-12"
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
                    className="bg-gray-700 border-gray-600 text-white h-12"
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
            <CardContent className="space-y-6 text-white">
              <ImageUploadSingle
                value={getSetting("restaurant_logo")}
                onChange={(url) => updateSetting("restaurant_logo", url)}
                label="Logo"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop-features">
          <div className="space-y-6">
            {/* Shop Switch Popup Settings */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5" />
                  Shop Switch Popup Settings
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Control when and how often the shop switch popup appears to encourage users to explore both shops
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="popup_enabled" className="text-white">Enable Shop Switch Popup</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="popup_enabled"
                        checked={getShopFeaturesSetting("popup_enabled") === "true"}
                        onChange={(e) => updateShopFeaturesSetting("popup_enabled", e.target.checked.toString())}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <span className="text-gray-300 text-sm">Show popup to encourage shop switching</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="popup_initial_delay" className="text-white">Initial Delay (minutes)</Label>
                    <Input
                      id="popup_initial_delay"
                      type="number"
                      min="1"
                      max="60"
                      value={getShopFeaturesSetting("popup_initial_delay") || "10"}
                      onChange={(e) => updateShopFeaturesSetting("popup_initial_delay", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="10"
                    />
                    <p className="text-gray-400 text-xs mt-1">Wait time before showing first popup</p>
                  </div>

                  <div>
                    <Label htmlFor="popup_interval" className="text-white">Show Interval (minutes)</Label>
                    <Input
                      id="popup_interval"
                      type="number"
                      min="5"
                      max="120"
                      value={getShopFeaturesSetting("popup_interval") || "15"}
                      onChange={(e) => updateShopFeaturesSetting("popup_interval", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="15"
                    />
                    <p className="text-gray-400 text-xs mt-1">Time between popup appearances</p>
                  </div>

                  <div>
                    <Label htmlFor="popup_max_shows" className="text-white">Max Shows Per Session</Label>
                    <Input
                      id="popup_max_shows"
                      type="number"
                      min="1"
                      max="10"
                      value={getShopFeaturesSetting("popup_max_shows") || "2"}
                      onChange={(e) => updateShopFeaturesSetting("popup_max_shows", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="2"
                    />
                    <p className="text-gray-400 text-xs mt-1">Maximum times to show per user session</p>
                  </div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Current Settings Preview
                  </h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>• Popup will appear after <strong>{getShopFeaturesSetting("popup_initial_delay") || "10"} minutes</strong> of browsing</p>
                    <p>• Then every <strong>{getShopFeaturesSetting("popup_interval") || "15"} minutes</strong> thereafter</p>
                    <p>• Maximum <strong>{getShopFeaturesSetting("popup_max_shows") || "2"} times</strong> per session</p>
                    <p>• Status: <span className={getShopFeaturesSetting("popup_enabled") === "true" ? "text-green-400" : "text-red-400"}>
                      {getShopFeaturesSetting("popup_enabled") === "true" ? "Enabled" : "Disabled"}
                    </span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Shop Ad Settings */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Floating Shop Ad Settings
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Configure the floating advertisement that promotes the other shop while users browse
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="floating_ad_enabled" className="text-white">Enable Floating Shop Ad</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="floating_ad_enabled"
                        checked={getShopFeaturesSetting("floating_ad_enabled") === "true"}
                        onChange={(e) => updateShopFeaturesSetting("floating_ad_enabled", e.target.checked.toString())}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <span className="text-gray-300 text-sm">Show floating ad to promote other shop</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="floating_ad_scroll_trigger" className="text-white">Scroll Trigger (pixels)</Label>
                    <Input
                      id="floating_ad_scroll_trigger"
                      type="number"
                      min="100"
                      max="1000"
                      value={getShopFeaturesSetting("floating_ad_scroll_trigger") || "400"}
                      onChange={(e) => updateShopFeaturesSetting("floating_ad_scroll_trigger", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="400"
                    />
                    <p className="text-gray-400 text-xs mt-1">Show ad after scrolling this many pixels</p>
                  </div>

                  <div>
                    <Label htmlFor="floating_ad_duration" className="text-white">Display Duration (minutes)</Label>
                    <Input
                      id="floating_ad_duration"
                      type="number"
                      min="1"
                      max="10"
                      value={getShopFeaturesSetting("floating_ad_duration") || "2"}
                      onChange={(e) => updateShopFeaturesSetting("floating_ad_duration", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="2"
                    />
                    <p className="text-gray-400 text-xs mt-1">How long to show the ad</p>
                  </div>

                  <div>
                    <Label htmlFor="floating_ad_cooldown" className="text-white">Cooldown Period (minutes)</Label>
                    <Input
                      id="floating_ad_cooldown"
                      type="number"
                      min="1"
                      max="30"
                      value={getShopFeaturesSetting("floating_ad_cooldown") || "4"}
                      onChange={(e) => updateShopFeaturesSetting("floating_ad_cooldown", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="4"
                    />
                    <p className="text-gray-400 text-xs mt-1">Wait time before showing ad again</p>
                  </div>

                  <div>
                    <Label htmlFor="floating_ad_max_shows" className="text-white">Max Shows Per Session</Label>
                    <Input
                      id="floating_ad_max_shows"
                      type="number"
                      min="1"
                      max="10"
                      value={getShopFeaturesSetting("floating_ad_max_shows") || "3"}
                      onChange={(e) => updateShopFeaturesSetting("floating_ad_max_shows", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white h-10 mt-2"
                      placeholder="3"
                    />
                    <p className="text-gray-400 text-xs mt-1">Maximum times to show per user session</p>
                  </div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Current Settings Preview
                  </h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>• Ad appears after scrolling <strong>{getShopFeaturesSetting("floating_ad_scroll_trigger") || "400"} pixels</strong></p>
                    <p>• Displays for <strong>{getShopFeaturesSetting("floating_ad_duration") || "2"} minutes</strong></p>
                    <p>• Cooldown of <strong>{getShopFeaturesSetting("floating_ad_cooldown") || "4"} minutes</strong> between shows</p>
                    <p>• Maximum <strong>{getShopFeaturesSetting("floating_ad_max_shows") || "3"} times</strong> per session</p>
                    <p>• Status: <span className={getShopFeaturesSetting("floating_ad_enabled") === "true" ? "text-green-400" : "text-red-400"}>
                      {getShopFeaturesSetting("floating_ad_enabled") === "true" ? "Enabled" : "Disabled"}
                    </span></p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-700">
                  <Button
                    onClick={saveShopFeaturesSettings}
                    disabled={saving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
                  >
                    {saving ? "Saving..." : "Save Shop Features Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>


          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
