import React, { useState } from "react";
import "../../styles/create-asset-form.css";

function CreateUserForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Contractors",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ROLE_OPTIONS = ["System_Admin", "Asset_Manager", "Contractors"];

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
    if (!formData.email || !formData.password || !formData.role) {
      setError("Email, password, and role are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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
        {/* Email Field */}
        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="user@example.com"
            className="form-input"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Password Field */}
        <div className="form-field">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter a secure password"
            className="form-input"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Role Field */}
        <div className="form-field">
          <label htmlFor="role" className="form-label">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="form-select"
            disabled={isSubmitting}
            required
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
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
          {isSubmitting ? "Creating..." : "Create User"}
        </button>
      </div>
    </form>
  );
}

export default CreateUserForm;
