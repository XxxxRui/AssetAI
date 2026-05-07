import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/modal/Modal";
import CreateLocationForm from "../components/forms/CreateLocationForm";
import { requestJson } from "../services/apiClient";
import "../styles/admin-location.css";

function AdminLocationPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("Admin/Location");
  const [locationsData, setLocationsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [totalLocations, setTotalLocations] = useState(0);
  const PAGE_SIZE = 10;

  // Function to fetch locations from backend
  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await requestJson(`/locations/`);
      console.log("Location API Response:", result);
      
      if (result && Array.isArray(result)) {
        // Map backend data to frontend format
        const mappedLocations = result.map((location) => ({
          id: location.id,
          name: location.name,
        }));

        console.log("Mapped Locations:", mappedLocations);
        setLocationsData(mappedLocations);
        setTotalLocations(mappedLocations.length);
      } else {
        console.warn("Unexpected response format:", result);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations from backend
  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  const handleAddNewLocation = () => {
    setIsCreateLocationModalOpen(true);
  };

  const handleCreateLocationSubmit = async (formData) => {
    try {
      const result = await requestJson("/locations/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (result && result.id) {
        alert("Location created successfully!");
        setIsCreateLocationModalOpen(false);
        // Refresh the locations list
        await fetchLocations();
      }
    } catch (err) {
      alert(err.message || "Failed to create location");
      return Promise.reject(err);
    }
  };

  const handleCancelCreateLocation = () => {
    setIsCreateLocationModalOpen(false);
  };

  const handleLocationAction = (location) => {
    setEditingLocation(location);
    setIsEditLocationModalOpen(true);
  };

  const handleEditLocationSubmit = async (formData) => {
    try {
      const result = await requestJson(`/locations/${editingLocation.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (result && result.id) {
        alert("Location updated successfully!");
        setIsEditLocationModalOpen(false);
        setEditingLocation(null);
        // Refresh the locations list
        await fetchLocations();
      }
    } catch (err) {
      alert(err.message || "Failed to update location");
      return Promise.reject(err);
    }
  };

  const handleCancelEditLocation = () => {
    setIsEditLocationModalOpen(false);
    setEditingLocation(null);
  };

  const handleDeleteLocation = (location) => {
    setLocationToDelete(location);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteLocationConfirm = async () => {
    try {
      await requestJson(`/locations/${locationToDelete.id}`, {
        method: "DELETE",
      });

      alert("Location deleted successfully!");
      setIsDeleteConfirmOpen(false);
      setLocationToDelete(null);
      // Refresh the locations list
      await fetchLocations();
    } catch (err) {
      alert(err.message || "Failed to delete location");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setLocationToDelete(null);
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      user={user}
      onLogout={onLogout}
    >
      <div className="admin-location-page">
        {/* Page Content */}
        <div className="admin-locations-content">
          {/* Header Section */}
          <div className="locations-header">
            <h1 className="header-title">Locations</h1>
            <button className="btn-add-location" onClick={handleAddNewLocation}>
              <span className="btn-icon">+</span>
              <span>Add New Location</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading locations...
            </div>
          )}

          {/* Locations Table */}
          {!loading && !error && (
            <div className="locations-table-wrapper">
              <table className="locations-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell cell-location-id">LOCATION ID</th>
                    <th className="table-header-cell cell-location-name">LOCATION NAME</th>
                    <th className="table-header-cell cell-action">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {locationsData.length > 0 ? (
                    locationsData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((location, idx) => (
                      <tr key={idx} className="table-body-row">
                        <td className="table-cell cell-location-id">
                          <span className="location-id">#{location.id}</span>
                        </td>
                        <td className="table-cell cell-location-name">
                          <span className="location-name">{location.name}</span>
                        </td>
                        <td className="table-cell cell-action">
                          <span
                            className="action-link"
                            onClick={() => handleLocationAction(location)}
                            title="Edit location"
                          >
                            Edit
                          </span>
                          <span className="action-separator">|</span>
                          <span
                            className="action-link action-link-delete"
                            onClick={() => handleDeleteLocation(location)}
                            title="Delete location"
                          >
                            Delete
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                        No locations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && !error && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    <span>Showing {locationsData.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(currentPage * PAGE_SIZE, totalLocations)} of {totalLocations} location(s)</span>
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
                      disabled={currentPage * PAGE_SIZE >= totalLocations}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Location Modal */}
      <Modal
        isOpen={isCreateLocationModalOpen}
        title="Add New Location"
        subtitle="Create a new location in the system"
        onClose={handleCancelCreateLocation}
        size="medium"
      >
        <CreateLocationForm
          onSubmit={handleCreateLocationSubmit}
          onCancel={handleCancelCreateLocation}
        />
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={isEditLocationModalOpen}
        title="Edit Location"
        onClose={handleCancelEditLocation}
        size="medium"
      >
        <CreateLocationForm
          initialData={editingLocation}
          onSubmit={handleEditLocationSubmit}
          onCancel={handleCancelEditLocation}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        title="Confirm Delete"
        onClose={handleCancelDelete}
        size="small"
      >
        <div style={{ padding: "16px 0" }}>
          <p style={{ marginBottom: "12px", color: "#64748b" }}>
            Are you sure you want to delete location <strong>{locationToDelete?.name}</strong>?
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
              ⚠️ This action cannot be undone. The location will be permanently deleted.
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
              onClick={handleDeleteLocationConfirm}
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
    </AppLayout>
  );
}

export default AdminLocationPage;
