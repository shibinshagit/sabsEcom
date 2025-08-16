"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ImageIcon, AlertCircle, Search, Star, Store } from "lucide-react"
import Image from "next/image"
import ImageUpload from "@/components/ui/image-upload"

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number
  category_name: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  new_until_date: string
  features: string[]
  specifications_text: string
  warranty_months: number
  brand: string
  model: string
  condition_type: string
  warranty_period: number
  storage_capacity: string
  color: string
  stock_quantity: number
  sku: string
  shop_category: string
  created_at: string
}

interface Category {
  id: number
  name: string
}

interface Shop {
  id: string
  name: string
  label: string
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedShop, setSelectedShop] = useState<string>("all")
  
  // Available shops
  const shops: Shop[] = [
    { id: "A", name: "Shop A", label: "Shop A" },
    { id: "B", name: "Shop B", label: "Shop B" }
  ]

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image_url: "",
    category_id: 0,
    shop_category: "",
    is_available: true,
    is_featured: false,
    is_new: false,
    new_until_date: "",
    features: "",
    specifications_text: "",
    warranty_months: 12,
    brand: "",
    model: "",
    condition_type: "new",
    warranty_period: 12,
    storage_capacity: "",
    color: "",
    stock_quantity: 1,
    sku: "",
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/products")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: Product[] = await response.json()
      setProducts(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch products: ${message}`)
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
      if (response.ok) {
        const data: Category[] = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields before submitting
    if (!formData.name.trim()) {
      alert("Product name is required")
      return
    }

    if (!formData.price || formData.price <= 0) {
      alert("Valid price is required")
      return
    }

    if (!formData.category_id || formData.category_id === 0) {
      alert("Category is required")
      return
    }

    if (!formData.shop_category) {
      alert("Shop selection is required")
      return
    }

    try {
      const url = editingItem ? `/api/admin/products/${editingItem.id}` : "/api/admin/products"
      const method = editingItem ? "PUT" : "POST"

      // Generate SKU if not provided
      const sku = formData.sku || `${formData.shop_category}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

      const payload = {
        ...formData,
        sku,
        features: formData.features
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Request failed")
      }

      await fetchProducts()
      setIsDialogOpen(false)
      resetForm()
      alert(editingItem ? "Product updated successfully!" : "Product added successfully!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to save product: ${message}`)
      console.error("Failed to save product:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Delete failed")
      }

      await fetchProducts()
      alert("Product deleted successfully!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to delete product: ${message}`)
      console.error("Failed to delete product:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      image_url: "",
      category_id: 0,
      shop_category: "",
      is_available: true,
      is_featured: false,
      is_new: false,
      new_until_date: "",
      features: "",
      specifications_text: "",
      warranty_months: 12,
      brand: "",
      model: "",
      condition_type: "new",
      warranty_period: 12,
      storage_capacity: "",
      color: "",
      stock_quantity: 1,
      sku: "",
    })
    setEditingItem(null)
  }

  const openEditDialog = (item: Product) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      image_url: item.image_url || "",
      category_id: item.category_id,
      shop_category: item.shop_category || "",
      is_available: item.is_available,
      is_featured: item.is_featured,
      features: item.features?.join(", ") || "",
      specifications_text: item.specifications_text || "",
      warranty_months: item.warranty_months || 12,
      brand: item.brand || "",
      model: item.model || "",
      condition_type: item.condition_type || "new",
      warranty_period: item.warranty_period || 12,
      storage_capacity: item.storage_capacity || "",
      color: item.color || "",
      stock_quantity: item.stock_quantity || 1,
      sku: item.sku || "",
      is_new: item.is_new || false,
      new_until_date: item.new_until_date || "",
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const filteredItems = products.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || item.category_id?.toString() === selectedCategory
    const matchesShop = selectedShop === "all" || item.shop_category === selectedShop
    return matchesSearch && matchesCategory && matchesShop
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Products Management</h1>
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
          <h1 className="text-3xl font-bold text-white">Products Management</h1>
        </div>
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold">Error Loading Products</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <Button onClick={fetchProducts} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Products Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              {/* Shop Selection - Required field */}
              <div>
                <Label htmlFor="shop_category">Shop *</Label>
                <Select
                  value={formData.shop_category}
                  onValueChange={(value) => setFormData({ ...formData, shop_category: value })}
                  required
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a shop (required)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id} className="text-white">
                        <div className="flex items-center space-x-2">
                          <Store className="w-4 h-4" />
                          <span>{shop.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, category_id: Number(value) })}
                  required
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a category (required)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-white">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Product Image"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Sabs, Faiza, Goree"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Model name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition_type">Condition</Label>
                  <Select
                    value={formData.condition_type}
                    onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="new" className="text-white">New</SelectItem>
                      <SelectItem value="used" className="text-white">Used</SelectItem>
                      <SelectItem value="refurbished" className="text-white">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Black, White, Blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warranty_months">Expiry (months)</Label>
                  <Input
                    id="warranty_months"
                    type="number"
                    min="0"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({ ...formData, warranty_months: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sku">SKU (Leave empty to auto-generate)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <Label htmlFor="features">Features (comma separated)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Feature 1, Feature 2, Feature 3"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="specifications_text">Specifications</Label>
                <Textarea
                  id="specifications_text"
                  value={formData.specifications_text}
                  onChange={(e) => setFormData({ ...formData, specifications_text: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Technical specifications"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                  <Label htmlFor="is_available">Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_new"
                    checked={formData.is_new}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                  />
                  <Label htmlFor="is_new">New Product</Label>
                </div>
              </div>

              {formData.is_new && (
                <div>
                  <Label htmlFor="new_until_date">New Until Date</Label>
                  <Input
                    id="new_until_date"
                    type="date"
                    value={formData.new_until_date}
                    onChange={(e) => setFormData({ ...formData, new_until_date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()} className="text-white">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white">
                    All Shops
                  </SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id} className="text-white">
                      {shop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Items Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Products Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Image</TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Shop</TableHead>
                  <TableHead className="text-gray-300">Category</TableHead>
                  <TableHead className="text-gray-300">Price</TableHead>
                  <TableHead className="text-gray-300">Stock</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <span className="text-white font-medium">{item.name}</span>
                          {item.is_featured && <Star className="w-4 h-4 text-amber-400 inline ml-2" />}
                          {item.description && <p className="text-gray-400 text-sm line-clamp-1">{item.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                        <Store className="w-3 h-3 mr-1" />
                        Shop {item.shop_category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">{item.category_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white font-semibold">${item.price}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">{item.stock_quantity || 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={item.is_available ? "default" : "secondary"}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        {item.is_featured && <Badge className="bg-amber-500 text-black">Featured</Badge>}
                        {item.is_new && <Badge className="bg-green-500 text-white">New</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}