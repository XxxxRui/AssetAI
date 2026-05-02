import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import "../styles/history.css";

function HistoryPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("History");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  // Sample evaluation history data - Matches EvaluationLog database schema
  // Fields: id, asset_id, asset, user_id, user, equipment, equipment_model,
  //         load_parameter_value, load_parameter_metric, matched_capacity_name,
  //         status, overload_percentage, remark, evaluated_at
  const evaluationData = [
    {
      id: 1,
      assetId: 1,
      assetName: "Berth 2",
      locationName: "Port of Bunbury",
      userId: 1,
      userName: "admin",
      userEmail: "admin@example.com",
      equipment: "Crane with outriggers",
      equipmentModel: "Model X-2000",
      loadParameterValue: 800,
      loadParameterMetric: "kN",
      matchedCapacityName: "max point load",
      status: "Compliant",
      overloadPercentage: 0,
      remark: "Equipment load within safe limits",
      evaluatedAt: "2024-04-23T10:30:00Z",
    },
    {
      id: 2,
      assetId: 4,
      assetName: "Berth 8",
      locationName: "Port of Bunbury",
      userId: 2,
      userName: "manager",
      userEmail: "manager@example.com",
      equipment: "Mobile crane",
      equipmentModel: "Liebherr LR1600",
      loadParameterValue: 92,
      loadParameterMetric: "t",
      matchedCapacityName: "max axle load",
      status: "Non-Compliant",
      overloadPercentage: 5.2,
      remark: "Load exceeds maximum axle load capacity",
      evaluatedAt: "2024-04-22T14:15:00Z",
    },
    {
      id: 3,
      assetId: 3,
      assetName: "Berth 5",
      locationName: "Port of Bunbury",
      userId: 1,
      userName: "admin",
      userEmail: "admin@example.com",
      equipment: "Vessel",
      equipmentModel: "Container Ship",
      loadParameterValue: 65000,
      loadParameterMetric: "t",
      matchedCapacityName: "max displacement size",
      status: "Compliant",
      overloadPercentage: 0,
      remark: "Vessel displacement within safe operating range",
      evaluatedAt: "2024-04-21T09:45:00Z",
    },
    {
      id: 4,
      assetId: 6,
      assetName: "Hardstand A",
      locationName: "Port of Bunbury",
      userId: 3,
      userName: "contractor",
      userEmail: "contractor@example.com",
      equipment: "Storage Load",
      equipmentModel: "Pallet Stack",
      loadParameterValue: 35,
      loadParameterMetric: "kPa",
      matchedCapacityName: "max uniform distributor load",
      status: "Compliant",
      overloadPercentage: 0,
      remark: "Storage load distribution acceptable",
      evaluatedAt: "2024-04-20T16:20:00Z",
    },
  ];

  const handleNewEvaluation = () => {
    console.log("Create new evaluation");
    // TODO: Navigate to evaluation creation page or open modal
  };

  const handleAction = (evaluationId) => {
    console.log("Action for:", evaluationId);
    // TODO: Implement action menu
  };

  const uniqueLocations = ["All Locations", "Port of Bunbury"];
  const statuses = ["All Results", "Compliant", "Non-Compliant"];

  const getStatusStyle = (status) => {
    return status === "Compliant"
      ? { bg: "#d1fae5", color: "#047857" }
      : { bg: "#fee2e2", color: "#dc2626" };
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

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      user={user}
      onLogout={onLogout}
    >
      <div className="history-container">
        {/* Page Header */}
        <div className="history-header">
          <div className="header-left">
            <h1 className="header-title">Evaluation History</h1>
            <p className="header-description">
              Complete audit trail of asset integrity checks and compliance reporting across all active operational zones.
            </p>
          </div>
          <button className="btn-new-evaluation" onClick={handleNewEvaluation}>
            <span className="btn-icon">+</span>
            <span>New Evaluation</span>
          </button>
        </div>

        {/* Filters Section */}
        <div className="filters-area">
          <div className="filter-group">
            <label className="filter-label">LOCATION</label>
            <select
              className="filter-select"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              {uniqueLocations.map((location) => (
                <option key={location} value={location.toLowerCase()}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">RESULT STATUS</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Evaluation History Table */}
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell table-cell-id">EVALUATION ID</th>
                <th className="table-header-cell table-cell-evaluator">EVALUATOR</th>
                <th className="table-header-cell table-cell-asset">ASSET</th>
                <th className="table-header-cell table-cell-location">LOCATION</th>
                <th className="table-header-cell table-cell-equipment">EQUIPMENT</th>
                <th className="table-header-cell table-cell-load">LOAD PARAMETER</th>
                <th className="table-header-cell table-cell-capacity">MATCHED CAPACITY</th>
                <th className="table-header-cell table-cell-result">RESULT</th>
                <th className="table-header-cell table-cell-overload">OVERLOAD %</th>
                <th className="table-header-cell table-cell-action">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {evaluationData.map((evaluation, idx) => {
                const statusStyle = getStatusStyle(evaluation.status);
                return (
                  <tr key={idx} className="table-body-row">
                    <td className="table-cell table-cell-id">
                      <span className="eval-id">#{evaluation.id}</span>
                    </td>
                    <td className="table-cell table-cell-evaluator">
                      <div className="evaluator-cell">
                        <div className="evaluator-avatar">
                          {evaluation.userName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="evaluator-name">{evaluation.userName}</span>
                      </div>
                    </td>
                    <td className="table-cell table-cell-asset">
                      <div className="asset-info">
                        <div className="asset-name">{evaluation.assetName}</div>
                      </div>
                    </td>
                    <td className="table-cell table-cell-location">
                      <div className="location-info">{evaluation.locationName}</div>
                    </td>
                    <td className="table-cell table-cell-equipment">
                      <div className="equipment-info">
                        <div className="equipment-name">{evaluation.equipment}</div>
                        <div className="equipment-model">{evaluation.equipmentModel}</div>
                      </div>
                    </td>
                    <td className="table-cell table-cell-load">
                      <div className="load-info">
                        {evaluation.loadParameterValue} {evaluation.loadParameterMetric}
                      </div>
                    </td>
                    <td className="table-cell table-cell-capacity">
                      <div className="capacity-info">{evaluation.matchedCapacityName}</div>
                    </td>
                    <td className="table-cell table-cell-result">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {evaluation.status}
                      </span>
                    </td>
                    <td className="table-cell table-cell-overload">
                      <span className="overload-value">{evaluation.overloadPercentage}%</span>
                    </td>
                    <td className="table-cell table-cell-action">
                      <button
                        className="action-btn"
                        onClick={() => handleAction(evaluation.id)}
                        title="More options"
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
            <span>SHOWING 1 TO 10 OF 1,240 ENTRIES</span>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ←
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <span className="pagination-ellipsis">...</span>
            <button className="pagination-btn">124</button>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default HistoryPage;
