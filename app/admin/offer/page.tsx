
"use client";

import React, { useState, useEffect } from "react";

const OfferPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [offers, setOffers] = useState([{ percentage: "" }]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Displayed saved data - now an array of offers
  const [savedOffers, setSavedOffers] = useState<{
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    offers: { percentage: string }[];
  }[]>([]);

  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);

  const handleAddOffer = () => {
    if (offers.length < 6) {
      setOffers([...offers, { percentage: "" }]);
    }
  };

  const handleRemoveOffer = (index: number) => {
    if (offers.length > 1) {
      const newOffers = offers.filter((_, i) => i !== index);
      setOffers(newOffers);
    }
  };

  const handleOfferChange = (index: number, value: string) => {
    const newOffers = [...offers];
    newOffers[index].percentage = value;
    setOffers(newOffers);
  };

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setOffers([{ percentage: "" }]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim() || !startDate || !endDate) {
      alert("Please fill in all required fields");
      return;
    }

    const validOffers = offers.filter(offer => offer.percentage && offer.percentage.trim() !== "");
    if (validOffers.length === 0) {
      alert("Please add at least one offer percentage");
      return;
    }

    setLoading(true);
    try {
      const isEditing = editingOfferId !== null;
      const url = isEditing ? `/api/admin/offer/${editingOfferId}` : "/api/admin/offer";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          startDate,
          endDate,
          offers: validOffers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save offer");
      }

      const data = await response.json();
      const newOffer = {
        id: data.id,
        title: data.title,
        startDate: data.start_date,
        endDate: data.end_date,
        offers: typeof data.offers === 'string' ? JSON.parse(data.offers) : data.offers,
      };

      if (isEditing) {
        // Update existing offer in the list
        setSavedOffers(prev => prev.map(offer => 
          offer.id === editingOfferId ? newOffer : offer
        ));
        alert("Offer updated successfully!");
      } else {
        // Add new offer to the list
        setSavedOffers(prev => [newOffer, ...prev]);
        alert("Offer created successfully!");
      }
      
      setShowModal(false);
      resetForm();
      setEditingOfferId(null);
    } catch (error) {
      console.error("Error submitting offer:", error);
      alert("Failed to submit offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: typeof savedOffers[0]) => {
    setTitle(offer.title);
    setStartDate(offer.startDate);
    setEndDate(offer.endDate);
    setOffers(offer.offers.length > 0 ? offer.offers : [{ percentage: "" }]);
    setEditingOfferId(offer.id);
    setShowModal(true);
  };

  const handleAddNew = () => {
    resetForm();
    setEditingOfferId(null);
    setShowModal(true);
  };

  const handleDelete = async (offerId: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        const response = await fetch(`/api/admin/offer/${offerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete offer");
        }

        setSavedOffers(prev => prev.filter(offer => offer.id !== offerId));
        alert("Offer deleted successfully!");
      } catch (error) {
        console.error("Error deleting offer:", error);
        alert("Failed to delete offer. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch("/api/admin/offer");
        if (!res.ok) throw new Error("Failed to fetch offers");
        
        const data = await res.json();
        if (Array.isArray(data)) {
          const parsedOffers = data.map(offer => ({
            id: offer.id,
            title: offer.title,
            startDate: offer.start_date,
            endDate: offer.end_date,
            offers: typeof offer.offers === 'string' ? JSON.parse(offer.offers) : offer.offers || [],
          }));
          setSavedOffers(parsedOffers);
        }
      } catch (error) {
        console.error("Error loading offers:", error);
      }
    };

    fetchOffers();
  }, []);

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
                    <div key={index} className="bg-green-600 text-white px-3 py-2 rounded text-center">
                      {offerDiscount.percentage}% OFF
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg text-center mb-6">
          <p className="text-gray-300 mb-4">No offers created yet.</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition-colors"
          >
            Create Your First Offer
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg mx-4 my-10">
            <h2 className="text-xl font-bold mb-4">
              {editingOfferId ? "Edit Offer" : "Add New Offer"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Offer Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount Percentages *</label>
                {offers.map((offer, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder={`Discount ${index + 1} (%)`}
                      value={offer.percentage}
                      onChange={(e) => handleOfferChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                    {offers.length > 1 && (
                      <button
                        onClick={() => handleRemoveOffer(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                {offers.length < 6 && (
                  <button
                    onClick={handleAddOffer}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    + Add Another Discount
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setEditingOfferId(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : editingOfferId ? "Update Offer" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferPage;