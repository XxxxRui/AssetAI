import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/modal/Modal";
import CreateAssetForm from "../components/forms/CreateAssetForm";
import { getAuthToken } from "../services/authSession";
import "../styles/assets.css";

function AssetsPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("Assets");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Location and API data state
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [assetsData, setAssetsData] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit and delete state
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", locationName: "" });
  const [isEditCapacityModalOpen, setIsEditCapacityModalOpen] = useState(false);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [capacityEditForm, setCapacityEditForm] = useState({ maxLoad: "", details: "" });
  
  // Batch import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError("No authentication token found. Please log in again.");
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:5000/api/v1/locations/",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Locations API response:", result);
        
        if (result.success && Array.isArray(result.data)) {
          setLocations(result.data);
          // Auto-select first location
          if (result.data.length > 0) {
            setSelectedLocationId(result.data[0].id);
          }
        } else {
          setError("Invalid locations response format");
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err.message || "Failed to load locations");
      }
    };

    fetchLocations();
  }, []);

  // Fetch assets when selected location changes
  const fetchAssets = async (locationId = selectedLocationId, page = currentPage) => {
    if (!locationId) {
      setAssetsData([]);
      setTotalAssets(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // Fetch assets for selected location
      const response = await fetch(
        `http://127.0.0.1:5000/api/v1/assets/?locationId=${locationId}&page=${page}&pageSize=10`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Assets API response:", result);
      
      if (result.success && result.data) {
        const assetsList = result.data.items || [];
        const totalCount = result.data.total || assetsList.length;
        
        setAssetsData(assetsList);
        setTotalAssets(totalCount);
      } else {
        setError("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError(err.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedLocationId]);

  const filteredAssets = assetsData.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBatchImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.multiple = true;
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      setImporting(true);
      setError("");
      const results = { items: [], rejected: [], createdCount: 0, rejectedCount: 0 };
      
      try {
        const token = getAuthToken();
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setImporting(false);
          return;
        }
        
        // Process each file
        for (const file of files) {
          try {
            const fileContent = await file.text();
            const assetData = JSON.parse(fileContent);
            
            // Call create asset API
            const response = await fetch("http://127.0.0.1:5000/api/v1/assets/", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(assetData),
            });
            
            if (response.ok) {
              const result = await response.json();
              results.items.push({
                file: file.name,
                asset: result.data
              });
              results.createdCount++;
            } else {
              const errorData = await response.json();
              results.rejected.push({
                file: file.name,
                reason: "Failed to create",
                message: errorData.message || response.statusText
              });
              results.rejectedCount++;
            }
          } catch (parseErr) {
            results.rejected.push({
              file: file.name,
              reason: "Invalid JSON",
              message: parseErr.message
            });
            results.rejectedCount++;
          }
        }
        
        results.filesScanned = files.length;
        setImportResult(results);
        
        // Show success message
        if (results.createdCount > 0) {
          setSuccessMessage(`✅ Successfully imported ${results.createdCount} asset(s)!`);
          setTimeout(() => setSuccessMessage(""), 4000);
          
          // Refresh assets list after import
          // Always refresh the current location's assets
          try {
            if (selectedLocationId) {
              const refreshResponse = await fetch(
                `http://127.0.0.1:5000/api/v1/assets/?locationId=${selectedLocationId}&page=1&pageSize=10`,
                {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              
              if (refreshResponse.ok) {
                const refreshResult = await refreshResponse.json();
                if (refreshResult.success && refreshResult.data) {
                  const assetsList = refreshResult.data.items || [];
                  const totalCount = refreshResult.data.total || assetsList.length;
                  setAssetsData(assetsList);
                  setTotalAssets(totalCount);
                  // Reset to first page after refresh
                  setCurrentPage(1);
                }
              }
            }
          } catch (refreshErr) {
            console.error("Error refreshing assets:", refreshErr);
          }
        }
      } catch (err) {
        console.error("Error importing assets:", err);
        setError(err.message || "Failed to import assets");
      } finally {
        setImporting(false);
      }
    };
    fileInput.click();
  };

  const handleCreateAsset = () => {
    setIsCreateAssetModalOpen(true);
  };

  const handleCreateAssetSubmit = async (formData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/api/v1/assets/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create asset: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Asset created successfully:", result.data);
      alert("Asset created successfully!");
      setIsCreateAssetModalOpen(false);
      
      // Refresh the assets list
      try {
        console.log("Refreshing assets list...");
        
        const refreshResponse = await fetch(
          `http://127.0.0.1:5000/api/v1/assets/?locationId=${selectedLocationId}&page=1&pageSize=10`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          console.log("Assets refresh response:", refreshResult);
          
          if (refreshResult.success && refreshResult.data) {
            const assetsList = refreshResult.data.items || [];
            const totalCount = refreshResult.data.total || assetsList.length;
            
            console.log("Updating assets list with", assetsList.length, "items");
            setAssetsData(assetsList);
            setTotalAssets(totalCount);
          } else {
            console.warn("Invalid refresh response format");
          }
        } else {
          console.warn("Failed to refresh assets:", refreshResponse.status);
        }
      } catch (refreshErr) {
        console.error("Error refreshing assets list:", refreshErr);
      }
    } catch (err) {
      console.error("Error creating asset:", err);
      alert(`Error creating asset: ${err.message}`);
    }
  };

  const handleCloseCreateAssetModal = () => {
    setIsCreateAssetModalOpen(false);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setEditFormData({
      name: asset.name,
      locationName: locations.find(loc => loc.id === selectedLocationId)?.name || "",
    });
    setIsEditAssetModalOpen(true);
  };

  const handleCancelEditAsset = () => {
    setIsEditAssetModalOpen(false);
    setEditingAsset(null);
    setEditFormData({ name: "", locationName: "" });
  };

  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setIsDeleteConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setAssetToDelete(null);
  };

  const handleEditAssetSubmit = async (e) => {
    e.preventDefault();
    if (!editingAsset) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      // Prepare update payload (only changed fields)
      const updateData = {};
      if (editFormData.name !== editingAsset.name) {
        updateData.name = editFormData.name;
      }
      if (editFormData.locationName !== locations.find(loc => loc.id === selectedLocationId)?.name) {
        updateData.locationName = editFormData.locationName;
      }

      if (Object.keys(updateData).length === 0) {
        alert("No changes made.");
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/v1/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update asset: ${response.statusText}`);
      }

      alert("Asset updated successfully!");
      setIsEditAssetModalOpen(false);
      setEditingAsset(null);
      await fetchAssets();
    } catch (err) {
      console.error("Error updating asset:", err);
      alert(`Error updating asset: ${err.message}`);
    }
  };

  const handleDeleteAssetConfirm = async () => {
    if (!assetToDelete) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/v1/assets/${assetToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete asset: ${response.statusText}`);
      }

      alert("Asset deleted successfully!");
      setIsDeleteConfirmOpen(false);
      setAssetToDelete(null);
      await fetchAssets();
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert(`Error deleting asset: ${err.message}`);
    }
  };

  const handleAssetAction = (assetId) => {
    console.log("Asset action for:", assetId);
    // TODO: Implement asset actions (edit, delete, view details)
  };

  const handleEditCapacityClick = (asset) => {
    setEditingAsset(asset);
    setIsEditCapacityModalOpen(true);
  };

  const handleSelectCapacityForEdit = (capacity) => {
    setSelectedCapacity(capacity);
    setCapacityEditForm({
      maxLoad: capacity.maxLoad.toString(),
      details: capacity.details || "",
    });
  };

  const handleCancelCapacityEdit = () => {
    setIsEditCapacityModalOpen(false);
    setEditingAsset(null);
    setSelectedCapacity(null);
    setCapacityEditForm({ maxLoad: "", details: "" });
  };

  const handleEditCapacitySubmit = async (e) => {
    e.preventDefault();
    if (!editingAsset || !selectedCapacity) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      const updateData = {};
      if (capacityEditForm.maxLoad !== selectedCapacity.maxLoad.toString()) {
        updateData.maxLoad = parseFloat(capacityEditForm.maxLoad);
      }
      if (capacityEditForm.details !== (selectedCapacity.details || "")) {
        updateData.details = capacityEditForm.details;
      }

      if (Object.keys(updateData).length === 0) {
        alert("No changes made.");
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/v1/assets/${editingAsset.id}/load-capacities/${selectedCapacity.id}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update capacity: ${response.statusText}`
        );
      }

      alert("Capacity updated successfully!");
      setIsEditCapacityModalOpen(false);
      setEditingAsset(null);
      setSelectedCapacity(null);
      await fetchAssets();
    } catch (err) {
      console.error("Error updating capacity:", err);
      alert(`Error updating capacity: ${err.message}`);
    }
  };

  const getStatusIndicatorColor = (status) => {
    return status === "compliant" ? "#006d73" : "#ba1a1a";
  };

  const formatCapacityName = (name) => {
    // Convert "max point load" to "Max Point Load"
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMaxLoadDisplay = (asset) => {
    if (!asset.loadCapacities || asset.loadCapacities.length === 0) {
      return "No capacity data";
    }

    // Show all capacities as separate lines
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {asset.loadCapacities.map((cap, idx) => (
          <div key={idx} style={{ fontSize: "14px", color: "#334155" }}>
            {formatCapacityName(cap.name)}: {cap.maxLoad} {cap.metric}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      user={user}
      onLogout={onLogout}
    >
      <div className="assets-container">
        {/* Page Header */}
        <div className="assets-header">
          <div className="header-left">
            <h1 className="header-title">Assets</h1>
            <p className="header-description">
              Manage and monitor your industrial assets with surgical precision
              and AI-driven insights.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleBatchImport}>
              <span>Batch Import</span>
            </button>
            <button className="btn-primary" onClick={handleCreateAsset}>
              <span>Create New Asset</span>
            </button>
          </div>
        </div>

        {/* Location Selector & Search */}
        <div className="assets-filter-row assets-filter-row-wide">
          <label className="assets-field">
            <span className="assets-label">LOCATION</span>
            <select
              value={selectedLocationId || ""}
              onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>

          <label className="assets-field assets-field-search">
            <span className="assets-label">SEARCH</span>
            <input
              type="text"
              placeholder="Filter by asset name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "20px",
            backgroundColor: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: "4px",
            color: "#006d73",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "20px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            color: "#dc2626",
            fontSize: "14px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: "20px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px"
          }}>
            Loading assets...
          </div>
        )}

        {/* Assets Table */}
        {!loading && (
          <div className="assets-table-container">
            <table className="assets-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell table-cell-asset">ASSET NAME</th>
                  <th className="table-header-cell table-cell-max-load">MAX LOAD</th>
                  <th className="table-header-cell table-cell-time">UPDATED TIME</th>
                  <th className="table-header-cell table-cell-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  return (
                    <tr key={asset.id} className="table-body-row">
                      <td className="table-cell table-data-cell">
                        <div className="asset-name-cell">
                          <div className="status-indicator" style={{ backgroundColor: "#006d73" }} />
                          <span className="asset-name">{asset.name}</span>
                        </div>
                      </td>
                      <td className="table-cell table-data-cell">
                        <span className="max-load">
                          {getMaxLoadDisplay(asset)}
                        </span>
                      </td>
                      <td className="table-cell table-cell-time">
                        <span className="time-text">
                          {asset.updatedAt ? formatDate(asset.updatedAt) : "—"}
                        </span>
                      </td>
                      <td className="table-cell table-data-cell table-actions-cell">
                        <span
                          className="action-link"
                          onClick={() => handleEditAsset(asset)}
                          title="Edit asset name and location"
                        >
                          Edit Name
                        </span>
                        <span className="action-separator">|</span>
                        <span
                          className="action-link"
                          onClick={() => handleEditCapacityClick(asset)}
                          title="Edit load capacities"
                        >
                          Edit Capacity
                        </span>
                        <span className="action-separator">|</span>
                        <span
                          className="action-link action-link-delete"
                          onClick={() => handleDeleteAsset(asset)}
                          title="Delete asset"
                        >
                          Delete
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                <span>Showing {filteredAssets.length} of {totalAssets} assets</span>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                <span className="pagination-number">{currentPage}</span>
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={filteredAssets.length < 10}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={isCreateAssetModalOpen}
        title="Create New Asset"
        subtitle="Enter the technical specifications to register a new industrial asset to the monitoring matrix."
        onClose={handleCloseCreateAssetModal}
        size="medium"
      >
        <CreateAssetForm
          onSubmit={handleCreateAssetSubmit}
          onCancel={handleCloseCreateAssetModal}
        />
      </Modal>

      {/* Edit Asset Modal */}
      <Modal
        isOpen={isEditAssetModalOpen}
        title="Edit Asset"
        onClose={handleCancelEditAsset}
        size="medium"
      >
        <form className="create-asset-form" onSubmit={handleEditAssetSubmit}>
          <div className="form-fields">
            {/* Asset Name Field */}
            <div className="form-field">
              <label htmlFor="edit-asset-name" className="form-label">
                Asset Name
              </label>
              <input
                id="edit-asset-name"
                type="text"
                name="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter asset name"
                className="form-input"
                required
              />
            </div>

            {/* Location Field */}
            <div className="form-field">
              <label htmlFor="edit-asset-location" className="form-label">
                Location
              </label>
              <select
                id="edit-asset-location"
                name="locationName"
                value={editFormData.locationName}
                onChange={(e) => setEditFormData({ ...editFormData, locationName: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select a location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
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
              onClick={handleCancelEditAsset}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Asset Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        title="Confirm Delete"
        onClose={handleCancelDelete}
        size="small"
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ marginBottom: "12px", color: "#64748b" }}>
            Are you sure you want to delete asset <strong>{assetToDelete?.name}</strong>?
          </p>
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#fef2f2",
              borderLeft: "4px solid #dc2626",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: "0", color: "#dc2626", fontSize: "14px" }}>
              ⚠️ This action cannot be undone. The asset will be permanently deleted.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={handleCancelDelete}
              style={{
                padding: "10px 24px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAssetConfirm}
              style={{
                padding: "10px 24px",
                border: "none",
                borderRadius: "4px",
                background: "#dc2626",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Capacity Modal */}
      <Modal
        isOpen={isEditCapacityModalOpen}
        title="Edit Load Capacity"
        onClose={handleCancelCapacityEdit}
        size="medium"
      >
        <div style={{ padding: "16px 0" }}>
          {!selectedCapacity ? (
            <div>
              <p style={{ marginBottom: "16px", color: "#64748b" }}>
                Select a capacity to edit:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {editingAsset?.loadCapacities?.map((capacity) => (
                  <button
                    key={capacity.id}
                    onClick={() => handleSelectCapacityForEdit(capacity)}
                    style={{
                      padding: "12px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      background: "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "var(--color-brand)";
                      e.target.style.backgroundColor = "#f0f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#cbd5e1";
                      e.target.style.backgroundColor = "#ffffff";
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#0f172a" }}>
                      {capacity.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {capacity.maxLoad} {capacity.metric}
                      {capacity.details && ` • ${capacity.details}`}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleCancelCapacityEdit}
                  style={{
                    padding: "10px 24px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEditCapacitySubmit}>
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>
                  {selectedCapacity.name}
                </h4>
              </div>

              <div className="form-fields">
                {/* Max Load Field */}
                <div className="form-field">
                  <label htmlFor="capacity-maxload" className="form-label">
                    Max Load ({selectedCapacity.metric})
                  </label>
                  <input
                    id="capacity-maxload"
                    type="number"
                    name="maxLoad"
                    value={capacityEditForm.maxLoad}
                    onChange={(e) =>
                      setCapacityEditForm({
                        ...capacityEditForm,
                        maxLoad: e.target.value,
                      })
                    }
                    placeholder="Enter max load value"
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>

                {/* Details Field */}
                <div className="form-field">
                  <label htmlFor="capacity-details" className="form-label">
                    Details (optional)
                  </label>
                  <input
                    id="capacity-details"
                    type="text"
                    name="details"
                    value={capacityEditForm.details}
                    onChange={(e) =>
                      setCapacityEditForm({
                        ...capacityEditForm,
                        details: e.target.value,
                      })
                    }
                    placeholder="Enter additional details"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCapacity(null)}
                  style={{
                    padding: "10px 24px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Back
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={handleCancelCapacityEdit}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Capacity
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Import Results Modal */}
      {importResult && (
        <Modal
          title="Batch Import Results"
          subtitle="Import summary and details"
          onClose={() => setImportResult(null)}
          size="medium"
        >
          <div style={{ padding: "16px 0" }}>
            <div style={{
              marginBottom: "20px",
              padding: "12px 16px",
              backgroundColor: "#f0f4f8",
              borderRadius: "4px",
              borderLeft: "4px solid #006d73"
            }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#006d73" }}>Import Summary</h3>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                <p><strong>Files Scanned:</strong> {importResult.filesScanned}</p>
                <p><strong>Created:</strong> <span style={{ color: "#006d73" }}>{importResult.createdCount}</span></p>
                <p><strong>Rejected:</strong> <span style={{ color: importResult.rejectedCount > 0 ? "#dc2626" : "#006d73" }}>{importResult.rejectedCount}</span></p>
              </div>
            </div>

            {importResult.items && importResult.items.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "12px", color: "#0f172a", fontSize: "13px" }}>Created Assets:</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "12px" }}>
                  {importResult.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: idx < importResult.items.length - 1 ? "1px solid #eee" : "none", fontSize: "13px" }}>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>{item.asset.name}</p>
                      <p style={{ margin: "0", color: "#64748b", fontSize: "12px" }}>File: {item.file}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.rejected && importResult.rejected.length > 0 && (
              <div>
                <h4 style={{ marginBottom: "12px", color: "#dc2626", fontSize: "13px" }}>Rejected Files:</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #fecaca", borderRadius: "4px", padding: "12px", backgroundColor: "#fef2f2" }}>
                  {importResult.rejected.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: idx < importResult.rejected.length - 1 ? "1px solid #fecaca" : "none", fontSize: "12px" }}>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "500", color: "#dc2626" }}>{item.file}</p>
                      <p style={{ margin: "0", color: "#dc2626" }}>Reason: {item.reason}</p>
                      <p style={{ margin: "0", color: "#007178", fontSize: "11px" }}>{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <button
              className="btn-secondary"
              onClick={() => {
                // Close modal and refresh current location
                setImportResult(null);
                if (selectedLocationId) {
                  fetchAssets(selectedLocationId, 1);
                }
              }}
              style={{ margin: 0 }}
            >
              View in Current Location
            </button>
            <button
              className="btn-primary"
              onClick={() => setImportResult(null)}
              style={{ margin: 0 }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

export default AssetsPage;
