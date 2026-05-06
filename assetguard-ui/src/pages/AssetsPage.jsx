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
  
  // Location and API data state
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [assetsData, setAssetsData] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
  useEffect(() => {
    if (!selectedLocationId) {
      setAssetsData([]);
      setTotalAssets(0);
      setLoading(false);
      return;
    }

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

        // Fetch assets for selected location
        const response = await fetch(
          `http://127.0.0.1:5000/api/v1/assets/?locationId=${selectedLocationId}&page=1&pageSize=100`,
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
        }
        
        // Refresh assets list
        if (results.createdCount > 0 && selectedLocationId) {
          try {
            const refreshResponse = await fetch(
              `http://127.0.0.1:5000/api/v1/assets/?locationId=${selectedLocationId}&page=1&pageSize=100`,
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
          `http://127.0.0.1:5000/api/v1/assets/?locationId=${selectedLocationId}&page=1&pageSize=100`,
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

  const handleAssetAction = (assetId) => {
    console.log("Asset action for:", assetId);
    // TODO: Implement asset actions (edit, delete, view details)
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

  const getMaxLoadDisplay = (asset) => {
    if (!asset.loadCapacities || asset.loadCapacities.length === 0) {
      return "No capacity data";
    }

    // Show all capacities
    return asset.loadCapacities
      .map((cap) => `${formatCapacityName(cap.name)}: ${cap.maxLoad} ${cap.metric}`)
      .join(" | ");
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

        {/* Location Selector & Search */}
        <div className="filter-search-row">
          <div className="location-selector-area">
            <label htmlFor="location-select" style={{ fontSize: "14px", fontWeight: "600", marginRight: "12px" }}>
              Select Location:
            </label>
            <select
              id="location-select"
              value={selectedLocationId || ""}
              onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #bdc9c8",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="search-filter-area">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Filter by asset name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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
                  <th className="table-cell table-header-cell">Asset Name</th>
                  <th className="table-cell table-header-cell">Max Load</th>
                  <th className="table-cell table-header-cell table-actions-cell">
                    Actions
                  </th>
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
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
