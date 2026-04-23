import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import "../styles/evaluation.css";
import imgIndustrialTurbine from "../assets/building.png";

// Data Structure
const LOCATIONS = [
  { id: 1, name: "Port of Bunbury" },
];

const ASSETS_BY_LOCATION = {
  1: [
    { id: 1, name: "Berth 2" },
    { id: 2, name: "Berth 3" },
    { id: 3, name: "Berth 5" },
    { id: 4, name: "Berth 8" },
    { id: 5, name: "Berth 9" },
    { id: 6, name: "Hardstand A" },
  ],
};

const EQUIPMENT_OPTIONS = [
  "Crane with outriggers",
  "Mobile crane",
  "Heavy vehicle",
  "Elevated Work Platform",
  "Storage Load",
  "Vessel",
];

const LOAD_PARAMETER_MAPPING = {
  "Crane with outriggers": { label: "Max Outrigger Load", metric: "kN" },
  "Mobile crane": { label: "Max Axle Load", metric: "t" },
  "Heavy vehicle": { label: "Max Axle Load", metric: "t" },
  "Elevated Work Platform": { label: "Max Wheel Load", metric: "kN" },
  "Storage Load": { label: "Uniform Distributor Load", metric: "kPa" },
  "Vessel": { label: "Displacement", metric: "t" },
};

function EvaluationPage({ user, onNavChange }) {
  const [activeNav, setActiveNav] = useState("Evaluation");
  const [showResult, setShowResult] = useState(false);

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  const [formData, setFormData] = useState({
    location: "",
    asset: "",
    equipment: "",
    equipmentModel: "",
    loadParameter: "",
    detailedDescription: "",
  });

  const [evaluationResult, setEvaluationResult] = useState({
    status: "Compliant",
    safetyScore: "98/100",
    date: "Oct 24, 2023",
    operationalMargin: "14.2%",
    thermalStability: "Optimal",
    thermalDetail: "Temperature remains within 2% variance of nominal threshold.",
    modelMatch: "The evaluated load parameters perfectly align with Alpha-7's historical peak performance signatures. No structural fatigue detected in digital twin simulation.",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e) => {
    const locationId = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: locationId,
      asset: "", // Reset asset when location changes
    }));
  };

  const handleEquipmentChange = (e) => {
    const equipment = e.target.value;
    setFormData(prev => ({
      ...prev,
      equipment,
      loadParameter: "", // Reset load parameter when equipment changes
    }));
  };

  const handleEvaluate = () => {
    // API call would go here
    console.log("Evaluating with:", formData);
    setShowResult(true);
  };

  // Get available assets based on selected location
  const availableAssets = formData.location 
    ? ASSETS_BY_LOCATION[formData.location] || [] 
    : [];

  // Get load parameter info based on selected equipment
  const loadParameterInfo = formData.equipment 
    ? LOAD_PARAMETER_MAPPING[formData.equipment] 
    : null;

  return (
    <AppLayout activeNav={activeNav} onNavChange={handleNavChange} user={user}>
      <div className="evaluation-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="header-title">New Evaluation</h1>
            <p className="header-description">
              The AI will verify compliance against current engineering standards.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="evaluation-content">
          {/* Input Form Section */}
          <div className="input-form-section">
            <div className="form-grid-layout">
              {/* Row 1: Location & Asset */}
              <div className="form-group form-group-col-1">
                <label className="form-label">LOCATION</label>
                <div className="select-wrapper">
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleLocationChange}
                    className="form-select"
                  >
                    <option value="">Select a Location</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon">▼</span>
                </div>
              </div>

              <div className="form-group form-group-col-2">
                <label className="form-label">ASSET</label>
                <div className="select-wrapper">
                  <select
                    name="asset"
                    value={formData.asset}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={!formData.location}
                  >
                    <option value="">Select an Asset</option>
                    {availableAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon">▼</span>
                </div>
              </div>

              {/* Row 2: Equipment, Equipment Model, Load Parameter */}
              <div className="form-group form-group-col-1">
                <label className="form-label">EQUIPMENT</label>
                <div className="select-wrapper">
                  <select
                    name="equipment"
                    value={formData.equipment}
                    onChange={handleEquipmentChange}
                    className="form-select"
                  >
                    <option value="">Select Equipment</option>
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon">▼</span>
                </div>
              </div>

              <div className="form-group form-group-col-2">
                <label className="form-label">EQUIPMENT MODEL</label>
                <input
                  type="text"
                  name="equipmentModel"
                  value={formData.equipmentModel}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter equipment model details"
                />
              </div>

              {loadParameterInfo && (
                <div className="form-group form-group-col-3">
                  <label className="form-label">
                    {loadParameterInfo.label.toUpperCase()}
                  </label>
                  <div className="load-parameter-input-group">
                    <input
                      type="number"
                      name="loadParameter"
                      value={formData.loadParameter}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter value"
                    />
                    <span className="load-parameter-metric">{loadParameterInfo.metric}</span>
                  </div>
                </div>
              )}

              {/* Row 3: Detailed Description */}
              <div className="form-group form-group-full-width">
                <label className="form-label">DETAILED DESCRIPTION</label>
                <textarea
                  name="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Enter detailed description about the evaluation"
                  rows="4"
                />
              </div>
            </div>

            {/* Evaluate Button */}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleEvaluate}>
                ⚡ Evaluate Asset
              </button>
            </div>
          </div>

          {/* Evaluation Result Section */}
          {showResult && (
          <div className="evaluation-result-section">
            <div className="result-header">
              <h2 className="result-title">Evaluation Result</h2>
              <span className="result-badge">LIVE ANALYSIS</span>
            </div>

            <div className="result-grid">
              {/* Compliance Card */}
              <div className="compliance-card">
                <div className="compliance-badge">
                  <span className="badge-icon">✓</span>
                </div>
                <h3 className="compliance-status">{evaluationResult.status}</h3>
                <p className="safety-score">Safety Score: {evaluationResult.safetyScore}</p>
                <p className="result-date">{evaluationResult.date}</p>
              </div>

              {/* Metrics Cards */}
              <div className="metrics-column">
                {/* Operational Margin */}
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">OPERATIONAL MARGIN</span>
                    <span className="metric-icon">📈</span>
                  </div>
                  <div className="metric-value">{evaluationResult.operationalMargin}</div>
                  <p className="metric-subtitle">Current Load vs Structural Limit</p>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: "14.2%" }}></div>
                  </div>
                </div>

                {/* Thermal Stability */}
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">THERMAL STABILITY</span>
                    <span className="metric-icon">🌡️</span>
                  </div>
                  <h3 className="thermal-status">{evaluationResult.thermalStability}</h3>
                  <p className="thermal-detail">{evaluationResult.thermalDetail}</p>
                </div>
              </div>

              {/* Model Signature Match */}
              <div className="model-signature-card">
                <h3 className="signature-title">Model Signature Match</h3>
                <div className="signature-content">
                  <p className="signature-text">{evaluationResult.modelMatch}</p>
                </div>
                <div className="signature-actions">
                  <button className="btn-link">Download PDF Report</button>
                  <button className="btn-link">Export JSON Data</button>
                </div>
              </div>
            </div>

            {/* Result Footer */}
            <div className="result-footer">
              <div className="system-status">
                <span className="status-indicator">●</span>
                <span className="status-text">All Nodes Operational</span>
              </div>
              <div className="result-actions">
                <button className="btn btn-secondary">← Reset Parameters</button>
                <button className="btn btn-primary">Finalize Evaluation</button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default EvaluationPage;
