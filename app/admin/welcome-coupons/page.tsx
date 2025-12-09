"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Tag, X, Calendar, Clock, Users, IndianRupee, DollarSign, Percent, Hash } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper function to format date to datetime-local input format
const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

// Helper function to format date to readable string with 12-hour time
const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    
    // Format date
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    
    // Format time in 12-hour format
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${hours}:${minutesStr} ${ampm}`;
    
    return `${dateStr} • ${timeStr}`;
  } catch {
    return "Invalid date";
  }
};

// Helper function to convert datetime-local (24h) to 12h display
const formatInputDateTo12Hour = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const minutesStr = String(minutes).padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  } catch {
    return "";
  }
};

// Helper to check if screen is tablet size
const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 640 && window.innerWidth < 1024;
};

export default function WelcomeCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isTabletView, setIsTabletView] = useState(false);
  
  const isMobile = useIsMobile();

  const emptyForm = {
    code: "",
    title: "",
    description: "",
    discountType: "flat" as "flat" | "percent",
    discountValueInr: "",
    discountValueAed: "",
    maxPurchaseInr: "",
    maxPurchaseAed: "",
    minimumPurchaseInr: "",
    minimumPurchaseAed: "",
    userTypeRestriction: "all" as "all" | "new" | "returning",
    validFrom: "",
    validTo: "",
    isActive: true,
  };

  const [form, setForm] = useState(emptyForm);

  // Check for tablet view on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsTabletView(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadCoupons() {
    try {
      const res = await fetch("/api/admin/welcome-coupons");
      const data = await res.json();
      setCoupons(data || []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      setCoupons([]);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function handleSelect(coupon: any) {
    setSelected(coupon.id);
    setForm({
      code: coupon.code || "",
      title: coupon.title || "",
      description: coupon.description || "",
      discountType: coupon.discount_type || "flat",
      discountValueInr: coupon.discount_value_inr?.toString() || "",
      discountValueAed: coupon.discount_value_aed?.toString() || "",
      maxPurchaseInr: coupon.max_purchase_inr?.toString() || "",
      maxPurchaseAed: coupon.max_purchase_aed?.toString() || "",
      minimumPurchaseInr: coupon.minimum_purchase_inr?.toString() || "",
      minimumPurchaseAed: coupon.minimum_purchase_aed?.toString() || "",
      userTypeRestriction: coupon.user_type_restriction || "all",
      validFrom: formatDateForInput(coupon.valid_from),
      validTo: formatDateForInput(coupon.valid_to),
      isActive: coupon.is_active ?? true,
    });
    setShowForm(true);
  }

  function updateForm(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    // Basic validation
    if (!form.code.trim()) {
      alert("Coupon code is required");
      return;
    }
    
    if (!form.discountType) {
      alert("Discount type is required");
      return;
    }
    
    // Discount validation based on type
    if (form.discountType === "percent") {
      // Validate percentage ranges
      if (form.discountValueInr) {
        const inrValue = Number(form.discountValueInr);
        if (inrValue < 1 || inrValue > 100) {
          alert("INR percentage discount must be between 1 and 100");
          return;
        }
      }
      if (form.discountValueAed) {
        const aedValue = Number(form.discountValueAed);
        if (aedValue < 1 || aedValue > 100) {
          alert("AED percentage discount must be between 1 and 100");
          return;
        }
      }
    } else if (form.discountType === "flat") {
      // Validate flat amounts
      if (form.discountValueInr && Number(form.discountValueInr) <= 0) {
        alert("INR flat discount must be a positive number");
        return;
      }
      if (form.discountValueAed && Number(form.discountValueAed) <= 0) {
        alert("AED flat discount must be a positive number");
        return;
      }
    }
    
    // At least one discount value should be provided
    if (!form.discountValueInr && !form.discountValueAed) {
      alert("Please provide at least one discount value (INR or AED)");
      return;
    }
    
    // Date validation
    if (!form.validFrom || !form.validTo) {
      alert("Please set both start and end dates");
      return;
    }
    
    if (new Date(form.validFrom) >= new Date(form.validTo)) {
      alert("End date must be after start date");
      return;
    }

    setLoading(true);

    // Prepare request body matching backend structure
    const body = {
      code: form.code,
      title: form.title || null,
      description: form.description || null,
      discountType: form.discountType,
      discountValueInr: form.discountValueInr ? Number(form.discountValueInr) : null,
      discountValueAed: form.discountValueAed ? Number(form.discountValueAed) : null,
      maxPurchaseInr: form.maxPurchaseInr ? Number(form.maxPurchaseInr) : null,
      maxPurchaseAed: form.maxPurchaseAed ? Number(form.maxPurchaseAed) : null,
      minimumPurchaseInr: Number(form.minimumPurchaseInr) || 0,
      minimumPurchaseAed: Number(form.minimumPurchaseAed) || 0,
      userTypeRestriction: form.userTypeRestriction,
      validFrom: form.validFrom,
      validTo: form.validTo,
      isActive: form.isActive,
    };

    const url = selected
      ? `/api/admin/welcome-coupons/${selected}`
      : "/api/admin/welcome-coupons";

    const method = selected ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save coupon");
      }

      setSelected(null);
      setForm(emptyForm);
      setShowForm(false);
      loadCoupons();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save coupon";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/welcome-coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      loadCoupons();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  }

  function handleCancel() {
    setSelected(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  // Get grid columns based on screen size
  const getGridCols = () => {
    if (isMobile) return "grid-cols-1";
    if (isTabletView) return "grid-cols-2";
    return "grid-cols-1 md:grid-cols-2";
  };

  // Helper to display discount value
  const getDiscountDisplay = (coupon: any) => {
    if (coupon.discount_type === "flat") {
      const inr = coupon.discount_value_inr ? `₹${coupon.discount_value_inr}` : null;
      const aed = coupon.discount_value_aed ? `AED ${coupon.discount_value_aed}` : null;
      return [inr, aed].filter(Boolean).join(" / ");
    } else {
      const inr = coupon.discount_value_inr ? `${coupon.discount_value_inr}%` : null;
      const aed = coupon.discount_value_aed ? `${coupon.discount_value_aed}%` : null;
      return [inr, aed].filter(Boolean).join(" / ");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome Coupons</h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Manage welcome coupons for new and returning users
          </p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            size={isMobile ? "default" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Coupon
          </Button>
        )}
      </div>

      {/* Form Section */}
      {showForm && (
        <Card className="mb-6 bg-white border-gray-200 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-gray-900 text-lg sm:text-xl">
                  {selected ? "Edit Coupon" : "Create New Coupon"}
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  {selected ? "Update the coupon details" : "Fill in the details to create a new coupon"}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className={`grid ${getGridCols()} gap-4 sm:gap-6`}>
              
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Coupon Code *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., WELCOME50"
                  value={form.code}
                  onChange={(e) => updateForm("code", e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-gray-500">
                  Code will be auto-uppercased, no spaces allowed
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Welcome Discount"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              </div>

              {/* Description */}
              <div className="space-y-2 col-span-full">
                <Label htmlFor="description" className="text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the coupon offer and terms..."
                  value={form.description || ""}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">
                  {(form.description || "").length}/200 characters
                </p>
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <Label htmlFor="discountType" className="text-gray-700 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount Type *
                </Label>
                <Select
                  value={form.discountType}
                  onValueChange={(value: "flat" | "percent") => updateForm("discountType", value)}
                >
                  <SelectTrigger id="discountType" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spacer */}
              <div className="col-span-full">
                <p className="text-sm font-medium text-gray-700 mb-2">Discount Values</p>
                <p className="text-xs text-gray-500 mb-4">
                  Provide at least one value (INR or AED)
                </p>
              </div>

              {/* INR Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discountValueInr" className="text-gray-700 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  {form.discountType === "flat" ? "Flat Discount (INR)" : "Percentage Discount (INR)"}
                </Label>
                <div className="relative">
                  <Input
                    id="discountValueInr"
                    type="number"
                    min={form.discountType === "percent" ? "1" : "0.01"}
                    max={form.discountType === "percent" ? "100" : undefined}
                    step={form.discountType === "percent" ? "0.1" : "1"}
                    placeholder={form.discountType === "flat" ? "50" : "10"}
                    value={form.discountValueInr}
                    onChange={(e) => updateForm("discountValueInr", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 pl-8 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {form.discountType === "flat" ? (
                      <IndianRupee className="h-4 w-4" />
                    ) : (
                      <Percent className="h-4 w-4" />
                    )}
                  </div>
                </div>
                {form.discountType === "percent" && (
                  <p className="text-xs text-gray-500">Must be between 1 and 100</p>
                )}
              </div>

              {/* AED Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discountValueAed" className="text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {form.discountType === "flat" ? "Flat Discount (AED)" : "Percentage Discount (AED)"}
                </Label>
                <div className="relative">
                  <Input
                    id="discountValueAed"
                    type="number"
                    min={form.discountType === "percent" ? "1" : "0.01"}
                    max={form.discountType === "percent" ? "100" : undefined}
                    step={form.discountType === "percent" ? "0.1" : "1"}
                    placeholder={form.discountType === "flat" ? "50" : "10"}
                    value={form.discountValueAed}
                    onChange={(e) => updateForm("discountValueAed", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 pl-8 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {form.discountType === "flat" ? (
                      <DollarSign className="h-4 w-4" />
                    ) : (
                      <Percent className="h-4 w-4" />
                    )}
                  </div>
                </div>
                {form.discountType === "percent" && (
                  <p className="text-xs text-gray-500">Must be between 1 and 100</p>
                )}
              </div>

              {/* Maximum Purchase Amounts */}
              <div className="space-y-2 col-span-full">
                <p className="text-sm font-medium text-gray-700">Maximum Purchase Limits (Optional)</p>
                <p className="text-xs text-gray-500 mb-4">
                  Maximum cart value this coupon can be applied to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPurchaseInr" className="text-gray-700 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Max Purchase (INR)
                </Label>
                <Input
                  id="maxPurchaseInr"
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={form.maxPurchaseInr}
                  onChange={(e) => updateForm("maxPurchaseInr", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPurchaseAed" className="text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Max Purchase (AED)
                </Label>
                <Input
                  id="maxPurchaseAed"
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={form.maxPurchaseAed}
                  onChange={(e) => updateForm("maxPurchaseAed", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Minimum Purchase Amounts */}
              <div className="space-y-2 col-span-full">
                <p className="text-sm font-medium text-gray-700">Minimum Purchase Requirements</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumPurchaseInr" className="text-gray-700 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Min Purchase (INR)
                </Label>
                <Input
                  id="minimumPurchaseInr"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minimumPurchaseInr}
                  onChange={(e) => updateForm("minimumPurchaseInr", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">For India region</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumPurchaseAed" className="text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Min Purchase (AED)
                </Label>
                <Input
                  id="minimumPurchaseAed"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minimumPurchaseAed}
                  onChange={(e) => updateForm("minimumPurchaseAed", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">For UAE/Middle East region</p>
              </div>

              {/* User Type Restriction */}
              <div className="space-y-2 col-span-full">
                <Label htmlFor="userType" className="text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Type Restriction
                </Label>
                <Select
                  value={form.userTypeRestriction}
                  onValueChange={(value: "all" | "new" | "returning") => updateForm("userTypeRestriction", value)}
                >
                  <SelectTrigger id="userType" className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new">New Users Only</SelectItem>
                    <SelectItem value="returning">Returning Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Validity Period */}
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Valid From *
                </Label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="validFrom"
                      type="datetime-local"
                      value={form.validFrom}
                      onChange={(e) => updateForm("validFrom", e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {form.validFrom && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-xs font-medium text-blue-600">Selected:</span>
                      <span className="text-xs text-gray-700">
                        {new Date(form.validFrom).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {formatInputDateTo12Hour(form.validFrom)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo" className="text-gray-700">Valid To *</Label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="validTo"
                      type="datetime-local"
                      value={form.validTo}
                      onChange={(e) => updateForm("validTo", e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {form.validTo && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-xs font-medium text-blue-600">Selected:</span>
                      <span className="text-xs text-gray-700">
                        {new Date(form.validTo).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {formatInputDateTo12Hour(form.validTo)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center space-x-3 col-span-full p-4 rounded-lg bg-gray-50">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => updateForm("isActive", checked)}
                  className="data-[state=checked]:bg-green-500"
                />
                <div className="flex-1">
                  <Label htmlFor="isActive" className="text-gray-900 font-medium">
                    Active Status
                  </Label>
                  <p className="text-sm text-gray-600">
                    {form.isActive 
                      ? "This coupon is currently active and can be used" 
                      : "This coupon is inactive and cannot be used"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 col-span-full pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  size={isMobile ? "default" : "default"}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {selected ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {selected ? "Update Coupon" : "Create Coupon"}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  size={isMobile ? "default" : "default"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      {!showForm && (
        <Card className="bg-white border-gray-200 shadow-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-gray-900 text-lg sm:text-xl">
              All Coupons ({coupons.length})
            </CardTitle>
            <CardDescription className="text-gray-600">
              Manage and monitor all your welcome coupons
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {coupons.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No coupons yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your first welcome coupon to offer discounts to new users
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size={isMobile ? "default" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Coupon
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {coupons.map((c: any) => (
                  <Card 
                    key={c.id} 
                    className={`bg-white border ${
                      c.is_active ? 'border-green-200' : 'border-gray-200'
                    } hover:border-gray-300 transition-colors`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        
                        {/* Left Section */}
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <code className="text-base sm:text-lg font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
                              {c.code}
                            </code>
                            <Badge 
                              variant={c.is_active ? "default" : "secondary"} 
                              className={`${c.is_active 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                : 'bg-gray-200 text-gray-700'} px-3 py-1`}
                            >
                              {c.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {c.user_type_restriction !== "all" && (
                              <Badge 
                                variant="outline" 
                                className="border-purple-200 text-purple-700 bg-purple-50 px-3 py-1"
                              >
                                {c.user_type_restriction === "new" ? "New Users" : "Returning Users"}
                              </Badge>
                            )}
                          </div>

                          {/* Title and Description */}
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{c.title || "Untitled Coupon"}</h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{c.description || "No description"}</p>

                          {/* Details Grid */}
                          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
                            
                            {/* Discount Info */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Discount</p>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-gray-900">
                                  {getDiscountDisplay(c)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({c.discount_type === "flat" ? "Flat" : "Percent"})
                                </span>
                              </div>
                            </div>

                            {/* Purchase Limits */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Purchase Limits</p>
                              <div className="space-y-1">
                                {/* Minimum */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Min:</span>
                                  {(c.minimum_purchase_inr > 0 || c.minimum_purchase_aed > 0) ? (
                                    <>
                                      {c.minimum_purchase_inr > 0 && (
                                        <span className="text-sm text-gray-700">₹{c.minimum_purchase_inr}</span>
                                      )}
                                      {c.minimum_purchase_inr > 0 && c.minimum_purchase_aed > 0 && (
                                        <span className="text-xs text-gray-400 mx-1">•</span>
                                      )}
                                      {c.minimum_purchase_aed > 0 && (
                                        <span className="text-sm text-gray-700">AED {c.minimum_purchase_aed}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-600">No minimum</span>
                                  )}
                                </div>
                                {/* Maximum */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600">Max:</span>
                                  {(c.max_purchase_inr || c.max_purchase_aed) ? (
                                    <>
                                      {c.max_purchase_inr && (
                                        <span className="text-sm text-gray-700">₹{c.max_purchase_inr}</span>
                                      )}
                                      {c.max_purchase_inr && c.max_purchase_aed && (
                                        <span className="text-xs text-gray-400 mx-1">•</span>
                                      )}
                                      {c.max_purchase_aed && (
                                        <span className="text-sm text-gray-700">AED {c.max_purchase_aed}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-600">No limit</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Validity Period */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Valid Period</p>
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <div className="text-gray-700">
                                    {formatDateTime(c.valid_from)}
                                  </div>
                                  <div className="text-gray-500 text-xs">to</div>
                                  <div className="text-gray-700">
                                    {formatDateTime(c.valid_to)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                              <p className="text-sm text-gray-700">
                                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Updated: {
                                c.updated_at ? new Date(c.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'
                              }</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "default"}
                            onClick={() => handleSelect(c)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {isMobile ? "Edit" : "Edit"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size={isMobile ? "sm" : "default"}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isMobile ? "Delete" : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-gray-200 max-w-[95vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <div className="p-3 rounded-full bg-red-50 w-12 h-12 flex items-center justify-center mb-4">
                                  <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <AlertDialogTitle className="text-gray-900 text-lg">
                                  Delete Coupon
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600">
                                  Are you sure you want to delete the coupon <span className="font-semibold text-gray-900">"{c.code}"</span>? This action cannot be undone and will remove the coupon permanently.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="mt-0 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full sm:w-auto">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(c.id)}
                                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 w-full sm:w-auto"
                                >
                                  Delete Coupon
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}