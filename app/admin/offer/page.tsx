
"use client";

import React, { useState } from "react";

const OfferPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [offers, setOffers] = useState([{ percentage: "" }]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Displayed saved data
  const [savedOffer, setSavedOffer] = useState<null | {
    title: string;
    startDate: string;
    endDate: string;
    offers: { percentage: string }[];
  }>(null);

  const handleAddOffer = () => {
    if (offers.length < 6) {
      setOffers([...offers, { percentage: "" }]);
    }
  };

  const handleOfferChange = (index: number, value: string) => {
    const newOffers = [...offers];
    newOffers[index].percentage = value;
    setOffers(newOffers);
  };

  const handleSubmit = () => {
    // Save offer to display
    setSavedOffer({
      title,
      startDate,
      endDate,
      offers,
    });

    // Close modal
    setShowModal(false);
  };

  const handleEdit = () => {
    // Reopen modal with existing data
    if (savedOffer) {
      setTitle(savedOffer.title);
      setStartDate(savedOffer.startDate);
      setEndDate(savedOffer.endDate);
      setOffers(savedOffer.offers);
    }
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-white text-2xl font-bold">Offer Page</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Offer
        </button>
      </div>

      {/* Show offer details below */}
      {savedOffer && (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-semibold">{savedOffer.title}</h2>
            <button
              onClick={handleEdit}
              className="bg-yellow-500 text-black px-3 py-1 rounded"
            >
              Edit
            </button>
          </div>
          <p className="mb-2">
            <strong>Start:</strong> {savedOffer.startDate} &nbsp;|&nbsp;
            <strong>End:</strong> {savedOffer.endDate}
          </p>
          <ul className="list-disc list-inside">
            {savedOffer.offers.map((offer, index) => (
              <li key={index}>Discount {index + 1}: {offer.percentage}%</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add / Edit Offer</h2>

            <input
              type="text"
              placeholder="Offer Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded"
              />
            </div>

            {offers.map((offer, index) => (
              <div key={index} className="mb-3">
                <input
                  type="number"
                  placeholder={`Offer ${index + 1} - Discount %`}
                  value={offer.percentage}
                  onChange={(e) => handleOfferChange(index, e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded"
                />
              </div>
            ))}

            {offers.length < 6 && (
              <button
                onClick={handleAddOffer}
                className="text-blue-600 underline mb-4"
              >
                + Add Another Offer
              </button>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferPage;
