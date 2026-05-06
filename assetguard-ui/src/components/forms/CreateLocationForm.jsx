import React, { useState } from "react";
import "../../styles/create-asset-form.css";

function CreateLocationForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name) {
      setError("Location name is required");
      return;
    }

    // Validate location name length
    if (formData.name.trim().length < 3) {
      setError("Location name must be at least 3 characters");
      return;
    }

    // Call onSubmit callback
    if (onSubmit) {
      setIsSubmitting(true);
      onSubmit(formData).finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  return (
    <form className="create-asset-form" onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef5350",
            borderRadius: "4px",
            color: "#c62828",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Form Fields Container */}
      <div className="form-fields">
        {/* Location Name Field */}
        <div className="form-field">
          <label htmlFor="name" className="form-label">
            Location Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter location name (e.g., Port of Bunbury)"
            className="form-input"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Location"}
        </button>
      </div>
    </form>
  );
}

export default CreateLocationForm;
