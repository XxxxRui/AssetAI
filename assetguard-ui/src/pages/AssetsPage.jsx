import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/modal/Modal";
import CreateAssetForm from "../components/forms/CreateAssetForm";
import "../styles/assets.css";

function AssetsPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("Assets");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  // Sample assets data - Matches database structure
  // Asset fields: ID, Location ID, Name
  // Load Capacity fields: ID, Asset ID, Name, Metric, Max Load, Details
  const assetsData = [
    {
      id: 1,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Berth 2",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 1000 },
        { name: "max axle load", metric: "t", maxLoad: 87.4 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 40 },
        { name: "max displacement size", metric: "t", maxLoad: 68100 },
      ],
    },
    {
      id: 2,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Berth 3",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 1200 },
        { name: "max axle load", metric: "t", maxLoad: 90 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 42 },
        { name: "max displacement size", metric: "t", maxLoad: 70000 },
      ],
    },
    {
      id: 3,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Berth 5",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 1000 },
        { name: "max axle load", metric: "t", maxLoad: 87.4 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 40 },
        { name: "max displacement size", metric: "t", maxLoad: 68100 },
      ],
    },
    {
      id: 4,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Berth 8",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 2642 },
        { name: "max axle load", metric: "t", maxLoad: 87.4 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 40 },
        { name: "max displacement size", metric: "t", maxLoad: 72000 },
      ],
    },
    {
      id: 5,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Berth 9",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 1500 },
        { name: "max axle load", metric: "t", maxLoad: 88 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 41 },
        { name: "max displacement size", metric: "t", maxLoad: 69000 },
      ],
    },
    {
      id: 6,
      locationId: 1,
      locationName: "Port of Bunbury",
      name: "Hardstand A",
      loadCapacities: [
        { name: "max point load", metric: "kN", maxLoad: 800 },
        { name: "max axle load", metric: "t", maxLoad: 85 },
        { name: "max uniform distributor load", metric: "kPa", maxLoad: 38 },
        { name: "max displacement size", metric: "t", maxLoad: 65000 },
      ],
    },
  ];

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

  const handleCreateAssetSubmit = (formData) => {
    console.log("Create Asset - Form Data:", formData);
    // TODO: Send data to backend API
    setIsCreateAssetModalOpen(false);
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
              placeholder="Filter by asset name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Assets Table */}
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
                const maxPointLoad = asset.loadCapacities.find(lc => lc.name === "max point load");
                return (
                  <tr key={asset.id} className="table-body-row">
                    <td className="table-cell table-data-cell">
                      <div className="asset-name-cell">
                        <div className="status-indicator" style={{ backgroundColor: "#006767" }} />
                        <span className="asset-name">{asset.name}</span>
                      </div>
                    </td>
                    <td className="table-cell table-data-cell">
                      <span className="organization">{asset.locationName}</span>
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
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>Showing {filteredAssets.length} of {assetsData.length} assets</span>
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
