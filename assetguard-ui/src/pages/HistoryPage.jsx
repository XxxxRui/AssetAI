import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import "../styles/history.css";
import { getAuthToken } from "../services/authSession";

function HistoryPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("History");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
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
        params.append("pageSize", "10");
        
        // Add filter parameters
        if (statusFilter) {
          params.append("status", statusFilter);
        }
        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }

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
  }, [currentPage, statusFilter, startDate, endDate]);

  const handleNewEvaluation = () => {
    handleNavChange("Evaluation");
  };

  const handleFilterChange = () => {
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    handleFilterChange();
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    handleFilterChange();
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    handleFilterChange();
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleAction = (evaluationId) => {
    console.log("Action for:", evaluationId);
    // TODO: Implement action menu
  };

  const getStatusStyle = (status) => {
    return status === "Compliant"
      ? { bg: "rgba(125, 154, 122, 0.12)", color: "#047857" }
      : { bg: "rgba(192, 96, 74, 0.12)", color: "#dc2626" };
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

  const formatNumber = (value) => {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
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

        {/* Filter Bar */}
        <div className="history-filter-row history-filter-row-flex">
          <div className="history-filter-fields">
            <label className="history-field">
              <span className="history-label">STATUS</span>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="">All Status</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            </label>

            <label className="history-field">
              <span className="history-label">START DATE</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
              />
            </label>

            <label className="history-field">
              <span className="history-label">END DATE</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </label>
          </div>
          <button
            className="history-filter-clear-link"
            onClick={handleResetFilters}
            title="Reset all filters"
          >
            Clear Filters
          </button>
        </div>

        {/* Evaluation History Table */}
        <div className="history-table-wrapper">
          <div className="history-table-container">
          {error && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "#fef2f2",
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
                  <th className="table-header-cell table-cell-capacity">MATCHED CAPACITY</th>
                  <th className="table-header-cell table-cell-load">MAX / PLANNED</th>
                  <th className="table-header-cell table-cell-result">RESULT</th>
                  <th className="table-header-cell table-cell-overload">OVER-CAP %</th>
                  <th className="table-header-cell table-cell-remark">REMARK</th>
                  <th className="table-header-cell table-cell-evaluated-by">EVALUATED BY</th>
                  <th className="table-header-cell table-cell-time">EVALUATED AT</th>
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
                      <td className="table-cell table-cell-capacity">
                        <div className="capacity-info">{evaluation.matchedCapacityName}</div>
                      </td>
                      <td className="table-cell table-cell-load">
                        <div className="load-info">
                          {evaluation.capacityMaxLoadDisplay || `${evaluation.loadParameterValue}${evaluation.loadParameterMetric} / —`}
                        </div>
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
                        <span className="overload-value">{formatNumber(evaluation.overloadPercentage * 100)}%</span>
                      </td>
                      <td className="table-cell table-cell-remark">
                        <span className="remark-text">{evaluation.remark || "—"}</span>
                      </td>
                      <td className="table-cell table-cell-evaluated-by">
                        <span className="user-email">{evaluation.userEmail || "—"}</span>
                      </td>
                      <td className="table-cell table-cell-time">
                        <span className="time-text">{formatDate(evaluation.evaluatedAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>

          {/* Pagination */}
          {!loading && evaluationData.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span>Showing {evaluationData.length} of {totalItems} evaluations</span>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ←
                </button>
                <span className="pagination-number">{currentPage}</span>
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default HistoryPage;
