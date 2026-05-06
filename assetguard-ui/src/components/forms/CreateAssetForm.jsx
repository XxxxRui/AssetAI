import React, { useState, useEffect } from "react";
import "../../styles/create-asset-form.css";
import { getAuthToken } from "../../services/authSession";

function CreateAssetForm({ onSubmit, onCancel }) {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    locationName: "",
    assetName: "",
    loadCapacities: [
      { name: "max point load", metric: "kN", maxLoad: "", details: "" },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load capacity name to metric mapping
  const CAPACITY_METRICS = {
    "max point load": "kN",
    "max axle load": "t",
    "max uniform distributor load": "kPa",
    "max displacement size": "t",
  };

  const CAPACITY_OPTIONS = Object.keys(CAPACITY_METRICS);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/v1/locations/", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const result = await response.json();
        if (result.success && result.data) {
          setLocations(result.data);
          // Set first location as default if available
          if (result.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              locationName: result.data[0].name,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err.message || "Failed to load locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCapacityChange = (index, field, value) => {
    const newCapacities = [...formData.loadCapacities];
    if (field === "name") {
      // Auto-update metric when capacity name changes
      newCapacities[index] = {
        ...newCapacities[index],
        name: value,
        metric: CAPACITY_METRICS[value] || "",
      };
    } else {
      newCapacities[index] = {
        ...newCapacities[index],
        [field]: value,
      };
    }
    setFormData((prev) => ({
      ...prev,
      loadCapacities: newCapacities,
    }));
  };

  const handleAddCapacity = () => {
    setFormData((prev) => ({
      ...prev,
      loadCapacities: [
        ...prev.loadCapacities,
        { name: "max point load", metric: "kN", maxLoad: "", details: "" },
      ],
    }));
  };

  const handleRemoveCapacity = (index) => {
    if (formData.loadCapacities.length > 1) {
      setFormData((prev) => ({
        ...prev,
        loadCapacities: prev.loadCapacities.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.locationName || !formData.assetName) {
      setError("Location and Asset Name are required");
      return;
    }

    // Validate load capacities
    if (formData.loadCapacities.length === 0) {
      setError("At least one load capacity is required");
      return;
    }

    for (let i = 0; i < formData.loadCapacities.length; i++) {
      const cap = formData.loadCapacities[i];
      if (!cap.name || !cap.metric || !cap.maxLoad) {
        setError(`Load Capacity ${i + 1}: Name, metric, and max load are required`);
        return;
      }
      if (isNaN(cap.maxLoad) || parseFloat(cap.maxLoad) <= 0) {
        setError(`Load Capacity ${i + 1}: Max load must be a positive number`);
        return;
      }
    }

    // Prepare payload for API
    const payload = {
      locationName: formData.locationName,
      name: formData.assetName,
      loadCapacities: formData.loadCapacities.map((cap) => ({
        name: cap.name,
        metric: cap.metric,
        maxLoad: parseFloat(cap.maxLoad),
        details: cap.details || "",
      })),
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  return (
    <form className="create-asset-form" onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "16px",
          backgroundColor: "#fee2e2",
          border: "1px solid #ef5350",
          borderRadius: "4px",
          color: "#c62828",
          fontSize: "14px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Form Fields Container */}
      <div className="form-fields">
        {/* Location Field */}
        <div className="form-field">
          <label htmlFor="locationName" className="form-label">
            Location
          </label>
          {loading ? (
            <div style={{ color: "#666", fontSize: "14px" }}>Loading locations...</div>
          ) : (
            <select
              id="locationName"
              name="locationName"
              value={formData.locationName}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select a location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Asset Name Field */}
        <div className="form-field">
          <label htmlFor="assetName" className="form-label">
            Asset Name
          </label>
          <input
            type="text"
            id="assetName"
            name="assetName"
            placeholder="e.g. Berth 5 Deck"
            value={formData.assetName}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>

        {/* Load Capacities Section */}
        <div className="form-field">
          <label className="form-label">Load Capacities</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formData.loadCapacities.map((capacity, index) => (
              <div
                key={index}
                style={{
                  padding: "16px",
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Load Capacity {index + 1}
                  </span>
                  {formData.loadCapacities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCapacity(index)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#fee2e2",
                        border: "1px solid #ef5350",
                        color: "#c0604a",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Capacity Name */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Capacity Name
                  </label>
                  <select
                    value={capacity.name}
                    onChange={(e) => handleCapacityChange(index, "name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    {CAPACITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metric (Read-only) */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Metric
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={capacity.metric}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </div>

                {/* Max Load */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Max Load ({capacity.metric})
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={capacity.maxLoad}
                    onChange={(e) => handleCapacityChange(index, "maxLoad", e.target.value)}
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Details */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Max Outrigger Load: 1200 kN"
                    value={capacity.details}
                    onChange={(e) => handleCapacityChange(index, "details", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Add Capacity Button */}
            <button
              type="button"
              onClick={handleAddCapacity}
              style={{
                padding: "8px 16px",
                backgroundColor: "#d1fae5",
                border: "1px solid #16a34a",
                color: "#047857",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              + Add Load Capacity
            </button>
          </div>
        </div>
      </div>

      {/* Form Footer */}
      <div className="form-footer">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-create-asset"
        >
          Create Asset
        </button>
      </div>
    </form>
  );
}

export default CreateAssetForm;
