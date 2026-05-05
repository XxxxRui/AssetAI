import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import "../styles/history.css";
import { getAuthToken } from "../services/authSession";

function HistoryPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("History");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Backend data state
  const [evaluationData, setEvaluationData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  // Fetch evaluation history from backend
  useEffect(() => {
    const fetchEvaluationHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getAuthToken();
        if (!token) {
          setError("No authentication token found. Please log in again.");
          return;
        }

        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("pageSize", "20");

        const response = await fetch(
          `http://127.0.0.1:5000/api/v1/evaluations/history?${params}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch evaluation history: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setEvaluationData(result.data.items || []);
          setTotalPages(result.data.pages || 1);
          setTotalItems(result.data.total || 0);
        } else {
          setError("Invalid response format from server");
        }
      } catch (err) {
        console.error("Error fetching evaluation history:", err);
        setError(err.message || "Failed to load evaluation history");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationHistory();
  }, [currentPage]);

  

  const handleNewEvaluation = () => {
    handleNavChange("Evaluation");
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
          {error && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "#ffebee",
              border: "1px solid #ef5350",
              borderRadius: "4px",
              color: "#c62828",
              fontSize: "14px"
            }}>
              ⚠️ {error}
            </div>
          )}
          {loading && (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#666"
            }}>
              Loading evaluation history...
            </div>
          )}
          {!loading && !error && evaluationData.length === 0 && (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#999"
            }}>
              No evaluation records found.
            </div>
          )}
          {!loading && evaluationData.length > 0 && (
            <table className="history-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell table-cell-id">EVALUATION ID</th>
                  <th className="table-header-cell table-cell-asset">ASSET</th>
                  <th className="table-header-cell table-cell-equipment">EQUIPMENT</th>
                  <th className="table-header-cell table-cell-load">LOAD PARAMETER</th>
                  <th className="table-header-cell table-cell-capacity">MATCHED CAPACITY</th>
                  <th className="table-header-cell table-cell-result">RESULT</th>
                  <th className="table-header-cell table-cell-overload">OVERLOAD %</th>
                  <th className="table-header-cell table-cell-remark">REMARK</th>
                  <th className="table-header-cell table-cell-time">EVALUATED AT</th>
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
                      <td className="table-cell table-cell-asset">
                        <div className="asset-info">
                          <div className="asset-name">{evaluation.assetName}</div>
                        </div>
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
                        <span className="overload-value">{(evaluation.overloadPercentage * 100).toFixed(1)}%</span>
                      </td>
                      <td className="table-cell table-cell-remark">
                        <span className="remark-text">{evaluation.remark || "—"}</span>
                      </td>
                      <td className="table-cell table-cell-time">
                        <span className="time-text">{formatDate(evaluation.evaluatedAt)}</span>
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
          )}
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>SHOWING 1 TO {evaluationData.length} OF {totalItems} ENTRIES</span>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button 
                key={i + 1} 
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
                disabled={loading}
              >
                {i + 1}
              </button>
            ))}
            {totalPages > 5 && <span className="pagination-ellipsis">...</span>}
            {totalPages > 5 && (
              <button 
                className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
                onClick={() => setCurrentPage(totalPages)}
                disabled={loading}
              >
                {totalPages}
              </button>
            )}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
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
