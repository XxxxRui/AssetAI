import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/modal/Modal";
import CreateLocationForm from "../components/forms/CreateLocationForm";
import { requestJson } from "../services/apiClient";
import "../styles/admin-location.css";

function AdminLocationPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("Admin/Location");
  const [locationsData, setLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);

  // Fetch locations from backend
  useEffect(() => {
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
        const refreshResult = await requestJson(`/locations/`);
        if (refreshResult && Array.isArray(refreshResult)) {
          const mappedLocations = refreshResult.map((location) => ({
            id: location.id,
            name: location.name,
          }));
          setLocationsData(mappedLocations);
        }
      }
    } catch (err) {
      alert(err.message || "Failed to create location");
      return Promise.reject(err);
    }
  };

  const handleCancelCreateLocation = () => {
    setIsCreateLocationModalOpen(false);
  };

  const handleLocationAction = (locationId) => {
    console.log("Action for location:", locationId);
    // TODO: Open context menu or action dialog
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
                    <th className="table-header-cell cell-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {locationsData.length > 0 ? (
                    locationsData.map((location, idx) => (
                      <tr key={idx} className="table-body-row">
                        <td className="table-cell cell-location-id">
                          <span className="location-id">#{location.id}</span>
                        </td>
                        <td className="table-cell cell-location-name">
                          <span className="location-name">{location.name}</span>
                        </td>
                        <td className="table-cell cell-action">
                          <button
                            className="action-button"
                            onClick={() => handleLocationAction(location.id)}
                            title="More options"
                          >
                            ⋮
                          </button>
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
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="pagination-section">
              <div className="pagination-info">
                <span>Total: {locationsData.length} location(s)</span>
              </div>
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
    </AppLayout>
  );
}

export default AdminLocationPage;
