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
  
  // API data state
  const [assetsData, setAssetsData] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  // Fetch assets from backend API
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getAuthToken();
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setLoading(false);
          return;
        }

        // First, fetch all locations to get their IDs
        const locResponse = await fetch(
          "http://127.0.0.1:5000/api/v1/locations/",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!locResponse.ok) {
          throw new Error("Failed to fetch locations");
        }

        const locResult = await locResponse.json();
        if (!locResult.success || !locResult.data || locResult.data.length === 0) {
          setError("No locations found");
          setLoading(false);
          return;
        }

        // Fetch assets from the first location (Port of Bunbury = id 1)
        const locationId = locResult.data[0].id;
        const response = await fetch(
          `http://127.0.0.1:5000/api/v1/assets/?locationId=${locationId}&page=1&pageSize=100`,
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
        if (result.success && result.data) {
          setAssetsData(result.data.items || []);
          setTotalAssets(result.data.total || 0);
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

    fetchAssets();
  }, []);

  const filteredAssets = assetsData.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.locationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBatchImport = () => {
    console.log("Batch Import clicked");
    // TODO: Implement batch import functionality
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
        const locResponse = await fetch(
          "http://127.0.0.1:5000/api/v1/locations/",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (locResponse.ok) {
          const locResult = await locResponse.json();
          if (locResult.success && locResult.data && locResult.data.length > 0) {
            const locationId = locResult.data[0].id;
            const refreshResponse = await fetch(
              `http://127.0.0.1:5000/api/v1/assets/?locationId=${locationId}&page=1&pageSize=100`,
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
                setAssetsData(refreshResult.data.items || []);
                setTotalAssets(refreshResult.data.total || 0);
              }
            }
          }
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

  const handleAssetAction = (assetId) => {
    console.log("Asset action for:", assetId);
    // TODO: Implement asset actions (edit, delete, view details)
  };

  const getStatusIndicatorColor = (status) => {
    return status === "compliant" ? "#006767" : "#ba1a1a";
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
              <span className="icon">📥</span>
              <span>Batch Import</span>
            </button>
            <button className="btn-primary" onClick={handleCreateAsset}>
              <span className="icon">➕</span>
              <span>Create New Asset</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="search-filter-area">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Filter by asset name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "20px",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef5350",
            borderRadius: "4px",
            color: "#c62828",
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
            color: "#666",
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
                  <th className="table-cell table-header-cell">Asset Name</th>
                  <th className="table-cell table-header-cell">Location</th>
                  <th className="table-cell table-header-cell">Max Point Load</th>
                  <th className="table-cell table-header-cell table-actions-cell">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  // Handle assets from /assets/all endpoint (no loadCapacities)
                  const maxPointLoad = asset.loadCapacities?.find(lc => lc.name === "max point load");
                  
                  return (
                    <tr key={asset.id} className="table-body-row">
                      <td className="table-cell table-data-cell">
                        <div className="asset-name-cell">
                          <div className="status-indicator" style={{ backgroundColor: "#006767" }} />
                          <span className="asset-name">{asset.name}</span>
                        </div>
                      </td>
                      <td className="table-cell table-data-cell">
                        <span className="organization">Port of Bunbury</span>
                      </td>
                      <td className="table-cell table-data-cell">
                        <span className="max-load">
                          {maxPointLoad ? `${maxPointLoad.maxLoad} ${maxPointLoad.metric}` : "N/A"}
                        </span>
                      </td>
                      <td className="table-cell table-data-cell table-actions-cell">
                        <button
                          className="action-button"
                          onClick={() => handleAssetAction(asset.id)}
                          title="More actions"
                        >
                          ⋮
                        </button>
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
    </AppLayout>
  );
}

export default AssetsPage;
