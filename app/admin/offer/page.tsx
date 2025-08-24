

"use client"
import { useState, useEffect } from "react"
import { X, Plus, Trash2, Calendar, Tag, Percent, DollarSign, AlertCircle } from "lucide-react"

const OfferPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [offers, setOffers] = useState([{ value: "" }])
  const [offerType, setOfferType] = useState("percentage") // Single offer type for all offers
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true) 
  const [error, setError] = useState<string | null>(null) 
  
  
  const [savedOffers, setSavedOffers] = useState<
    {
      id: number
      title: string
      startDate: string
      endDate: string
      offers: { value: string; type: string }[]
      offerType: string
    }[]
  >([])
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null)

  const handleAddOffer = () => {
    if (offers.length < 6) {
      setOffers([...offers, { value: "" }])
    }
  }

  const handleRemoveOffer = (index: number) => {
    if (offers.length > 1) {
      const newOffers = offers.filter((_, i) => i !== index)
      setOffers(newOffers)
    }
  }

  const handleOfferChange = (index: number, value: string) => {
    const newOffers = [...offers]
    newOffers[index].value = value
    setOffers(newOffers)
  }

  const handleOfferTypeChange = (type: string) => {
    setOfferType(type)
    // Reset all offer values when type changes to avoid confusion
    setOffers(offers.map(() => ({ value: "" })))
  }

  const resetForm = () => {
    setTitle("")
    setStartDate("")
    setEndDate("")
    setOffers([{ value: "" }])
    setOfferType("percentage")
  }

  const handleSubmit = async () => {
    if (!title.trim() || !startDate || !endDate) {
      alert("Please fill in all required fields")
      return
    }

    const validOffers = offers.filter((offer) => offer.value && offer.value.trim() !== "")
    if (validOffers.length === 0) {
      alert("Please add at least one offer value")
      return
    }

    // Validate offer values based on type
    const invalidOffers = validOffers.filter((offer) => {
      const value = parseFloat(offer.value)
      if (isNaN(value) || value <= 0) return true
      
      if (offerType === "percentage" && (value < 1 || value > 100)) return true
      
      return false
    })

    if (invalidOffers.length > 0) {
      if (offerType === "percentage") {
        alert("Percentage offers must be between 1 and 100")
      } else {
        alert("Cash offers must be positive values")
      }
      return
    }

    // Convert offers to include type
    const offersWithType = validOffers.map(offer => ({
      value: offer.value,
      type: offerType
    }))

    setLoading(true)
    try {
      const isEditing = editingOfferId !== null
      const url = isEditing ? `/api/admin/offer/${editingOfferId}` : "/api/admin/offer"
      const method = isEditing ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          startDate,
          endDate,
          offers: offersWithType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save offer")
      }

      const data = await response.json()
      const newOffer = {
        id: data.id,
        title: data.title,
        startDate: data.start_date,
        endDate: data.end_date,
        offers: typeof data.offers === "string" ? JSON.parse(data.offers) : data.offers,
        offerType: data.offer_type || offerType,
      }

      if (isEditing) {
        setSavedOffers((prev) => prev.map((offer) => (offer.id === editingOfferId ? newOffer : offer)))
        alert("Offer updated successfully!")
      } else {
        setSavedOffers((prev) => [newOffer, ...prev])
        alert("Offer created successfully!")
      }

      setShowModal(false)
      resetForm()
      setEditingOfferId(null)
    } catch (error) {
      console.error("Error submitting offer:", error)
      alert("Failed to submit offer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (offer: (typeof savedOffers)[0]) => {
    setTitle(offer.title)
    setStartDate(offer.startDate)
    setEndDate(offer.endDate)
    
    // Set the offer type from the first offer or fallback to percentage
    const firstOffer = offer.offers[0]
    const editOfferType = firstOffer?.type || offer.offerType || "percentage"
    setOfferType(editOfferType)
    
    // Extract just the values for the form
    const offerValues = offer.offers.length > 0 
      ? offer.offers.map(o => ({ value: o.value }))
      : [{ value: "" }]
    setOffers(offerValues)
    
    setEditingOfferId(offer.id)
    setShowModal(true)
  }

  const handleAddNew = () => {
    resetForm()
    setEditingOfferId(null)
    setShowModal(true)
  }

  const handleDelete = async (offerId: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        const response = await fetch(`/api/admin/offer/${offerId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete offer")
        }

        setSavedOffers((prev) => prev.filter((offer) => offer.id !== offerId))
        alert("Offer deleted successfully!")
      } catch (error) {
        console.error("Error deleting offer:", error)
        alert("Failed to delete offer. Please try again.")
      }
    }
  }

  const fetchOffers = async () => {
    setInitialLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/offer")
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      if (Array.isArray(data)) {
        const parsedOffers = data.map((offer) => ({
          id: offer.id,
          title: offer.title,
          startDate: offer.start_date,
          endDate: offer.end_date,
          offers: typeof offer.offers === "string" ? JSON.parse(offer.offers) : offer.offers || [],
          offerType: offer.offer_type || "percentage",
        }))
        setSavedOffers(parsedOffers)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to fetch offers: ${message}`)
      console.error("Error loading offers:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  // Show loading state
  if (initialLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-white text-2xl font-bold">Offer Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-white text-2xl font-bold">Offer Management</h1>
        </div>
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Error Loading Offers</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              <button 
                onClick={fetchOffers} 
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white text-2xl font-bold">Offer Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Add New Offer
        </button>
      </div>

      {/* Show all offers */}
      {savedOffers.length > 0 ? (
        <div className="space-y-4 mb-6">
          {savedOffers.map((offer) => (
            <div key={offer.id} className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{offer.title}</h2>
                  <div className="text-gray-300 mb-2">
                    <strong>Type:</strong>{" "}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      offer.offerType === 'cash' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {offer.offerType === 'cash' ? (
                        <>
                          <DollarSign size={14} />
                          Cash (AED)
                        </>
                      ) : (
                        <>
                          <Percent size={14} />
                          Percentage
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300">
                    <strong>Start:</strong> {new Date(offer.startDate).toLocaleDateString()}
                    <span className="mx-2">|</span>
                    <strong>End:</strong> {new Date(offer.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Available Discounts:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {offer.offers.map((offerDiscount, index) => (
                    <div key={index} className={`text-white px-3 py-2 rounded text-center ${
                      offerDiscount.type === 'cash' ? 'bg-orange-600' : 'bg-green-600'
                    }`}>
                      {offerDiscount.type === 'cash' 
                        ? `${offerDiscount.value} AED OFF` 
                        : `${offerDiscount.value}% OFF`
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Only show "No offers" when not loading and no error
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg text-center mb-6">
          <p className="text-gray-300 mb-4">No offers created yet.</p>
        </div>
      )}

      {/* Beautiful Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                  setEditingOfferId(null)
                }}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={loading}
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <Tag size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{editingOfferId ? "Edit Offer" : "Create New Offer"}</h2>
                  <p className="text-blue-100 mt-1">
                    {editingOfferId ? "Update your existing offer details" : "Set up a new promotional offer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-blue-600" />
                  Offer Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter a catchy offer title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={16} className="text-green-600" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={16} className="text-red-600" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* Offer Type Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-purple-600" />
                  Offer Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={offerType === "percentage"}
                      onChange={(e) => handleOfferTypeChange(e.target.value)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="flex items-center gap-1 text-gray-700">
                      <Percent size={16} className="text-green-600" />
                      Percentage Discount
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="cash"
                      checked={offerType === "cash"}
                      onChange={(e) => handleOfferTypeChange(e.target.value)}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="flex items-center gap-1 text-gray-700">
                      <DollarSign size={16} className="text-orange-600" />
                      Cash Discount (AED)
                    </span>
                  </label>
                </div>
              </div>

              {/* Discount Values */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  {offerType === 'cash' ? (
                    <>
                      <DollarSign size={16} className="text-orange-600" />
                      Cash Amounts (AED) *
                    </>
                  ) : (
                    <>
                      <Percent size={16} className="text-green-600" />
                      Discount Percentages *
                    </>
                  )}
                </label>
                <div className="space-y-3">
                  {offers.map((offer, index) => (
                    <div key={index} className="flex gap-3 items-center group">
                      {/* Value Input */}
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder={offerType === 'cash' ? `Amount in AED (e.g., 50)` : `Percentage (1-100)`}
                          value={offer.value}
                          onChange={(e) => handleOfferChange(index, e.target.value)}
                          className={`w-full border-2 border-gray-200 px-4 py-3 pr-16 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                            offerType === 'cash'
                              ? 'focus:border-orange-500 focus:ring-orange-100'
                              : 'focus:border-green-500 focus:ring-green-100'
                          }`}
                          min="1"
                          max={offerType === 'percentage' ? "100" : undefined}
                          step={offerType === 'cash' ? "0.01" : "1"}
                        />
                        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium ${
                          offerType === 'cash' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {offerType === 'cash' ? 'AED' : '%'}
                        </div>
                      </div>
                      
                      {offers.length > 1 && (
                        <button
                          onClick={() => handleRemoveOffer(index)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group-hover:scale-105"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {offers.length < 6 && (
                  <button
                    onClick={handleAddOffer}
                    className={`flex items-center gap-2 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                      offerType === 'cash' ? 'text-orange-600' : 'text-green-600'
                    }`}
                  >
                    <Plus size={16} />
                    Add Another {offerType === 'cash' ? 'Amount' : 'Percentage'}
                  </button>
                )}
              </div>

              {/* Preview Section */}
              {offers.some((offer) => offer.value) && (
                <div className={`p-4 rounded-xl border ${
                  offerType === 'cash'
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                    : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                }`}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview:</h4>
                  <div className="flex flex-wrap gap-2">
                    {offers
                      .filter((offer) => offer.value)
                      .map((offer, index) => (
                        <span
                          key={index}
                          className={`text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                            offerType === 'cash' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                        >
                          {offerType === 'cash' 
                            ? `${offer.value} AED OFF` 
                            : `${offer.value}% OFF`
                          }
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                  setEditingOfferId(null)
                }}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>{editingOfferId ? "Update Offer" : "Create Offer"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfferPage