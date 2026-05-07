import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatCard from "../components/dashboard/StatCard";
import SectionHeader from "../components/dashboard/SectionHeader";
import DataTable from "../components/dashboard/DataTable";
import EvaluationPage from "./EvaluationPage";
import AssetsPage from "./AssetsPage";
import HistoryPage from "./HistoryPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminLocationPage from "./AdminLocationPage";
import AlertsPage from "./AlertsPage";

const NAV_STORAGE_KEY = "assetguard:active-nav";

const recentEvaluations = [
  ["Main Turbine G7", "Siemens SGT-800", "Compliant", "14:22 PM"],
  ["Hydraulic Lift B4", "Terex HC 110", "Non-Compliant", "12:05 PM"],
  ["Conveyor System Alpha", "Intralox S2400", "Compliant", "09:48 AM"],
];

const assetList = [
  ["North Wing HVAC", "Global Logistics Hub", "450 kN", "Just now"],
  ["Pressure Tank 09", "Arcturus Energy", "2,100 PSI", "2h ago"],
  ["Solar Array Matrix", "GreenPulse Systems", "1.2 MW", "6h ago"],
  ["Data Center Rack A1-12", "CloudHorizon", "32 kW", "Yesterday"],
];

const navDescriptions = {
  Evaluation: "Create and review load evaluations for selected assets.",
  Assets: "Browse and manage registered assets and their load capacities.",
  History: "Review previous evaluation records and outcomes.",
  Alerts: "Monitor warning signals and non-compliance notifications.",
  Admin: "Manage users, roles, and system-level settings.",
};

function DashboardPage({ user, onLogout }) {
  // Restore navigation state from localStorage, default to Dashboard or Evaluation for Contractors
  const [activeNav, setActiveNav] = useState(() => {
    // For Contractors, default to Evaluation page
    if (user?.role === "Contractors") {
      return "Evaluation";
    }
    try {
      return localStorage.getItem(NAV_STORAGE_KEY) || "Dashboard";
    } catch {
      return "Dashboard";
    }
  });

  // State for API data
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalEvaluations, setTotalEvaluations] = useState(0);
  const [recentEvaluationsData, setRecentEvaluationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Save navigation state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(NAV_STORAGE_KEY, activeNav);
    } catch {
      // Ignore storage failures
    }
  }, [activeNav]);

  // Fetch asset and evaluation data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use correct auth token key from authSession
        const token = localStorage.getItem("assetguard:auth-token");
        console.log("Token from localStorage:", token);
        
        if (!token) {
          console.warn("No token found in localStorage. Using keys:", Object.keys(localStorage));
          return;
        }

        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        console.log("Request headers:", headers);

        // Fetch total assets
        const assetsResponse = await fetch(
          "/api/v1/assets/all?pageSize=1",
          { headers }
        );
        console.log("Assets response status:", assetsResponse.status);
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          console.log("Assets response:", assetsData);
          const total = assetsData.data?.total || assetsData.total || 0;
          setTotalAssets(total);
        } else {
          const errorData = await assetsResponse.json();
          console.error("Assets error response:", errorData);
        }

        // Fetch total evaluations and recent evaluations data
        const evaluationsResponse = await fetch(
          "/api/v1/evaluations/history?pageSize=20",
          { headers }
        );
        console.log("Evaluations response status:", evaluationsResponse.status);
        if (evaluationsResponse.ok) {
          const evaluationsData = await evaluationsResponse.json();
          console.log("Evaluations response:", evaluationsData);
          const total = evaluationsData.data?.total || evaluationsData.total || 0;
          setTotalEvaluations(total);

          // Format recent evaluations data
          const items = evaluationsData.data?.items || [];
          const formattedEvaluations = items.slice(0, 3).map((item) => {
            // Format time with date - convert ISO 8601 to "May 6, 2026, 10:49 PM" format
            const date = new Date(item.evaluatedAt);
            const dateTimeStr = date.toLocaleString("en-US", { 
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit", 
              minute: "2-digit",
              hour12: true 
            });
            
            return [
              item.assetName || "N/A",
              item.equipment || "N/A",
              item.status || "N/A",
              dateTimeStr
            ];
          });
          setRecentEvaluationsData(formattedEvaluations);
        } else {
          const errorData = await evaluationsResponse.json();
          console.error("Evaluations error response:", errorData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // For Contractors, only allow Evaluation page
  const isContractor = user?.role === "Contractors";
  if (isContractor && activeNav !== "Evaluation") {
    // Redirect contractors to Evaluation page
    setTimeout(() => setActiveNav("Evaluation"), 0);
    return <EvaluationPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
  }

  if (activeNav === "Evaluation") {
    return <EvaluationPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
  }

  if (activeNav === "Assets") {
    return <AssetsPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
  }

  if (activeNav === "History") {
    return <HistoryPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
  }

  // Admin pages - Check user role and protect access
  if (activeNav === "Admin/User" || activeNav === "Admin/Location") {
    // If user is not System_Admin, redirect to Dashboard
    if (user?.role !== "System_Admin") {
      // Reset activeNav to Dashboard to prevent access
      setTimeout(() => setActiveNav("Dashboard"), 0);
      return (
        <AppLayout activeNav="Dashboard" onNavChange={setActiveNav} user={user} onLogout={onLogout}>
          <section className="module-placeholder">
            <h1>Access Denied</h1>
            <p>You do not have permission to access the Admin section. Only System Administrators can access this area.</p>
            <button className="btn-primary" onClick={() => setActiveNav("Dashboard")}
              style={{ marginTop: "16px", padding: "12px 24px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Return to Dashboard
            </button>
          </section>
        </AppLayout>
      );
    }

    if (activeNav === "Admin/User") {
      return <AdminUsersPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
    }

    if (activeNav === "Admin/Location") {
      return <AdminLocationPage user={user} onNavChange={setActiveNav} onLogout={onLogout} />;
    }
  }

  if (activeNav === "Alerts") {
  return (
    <AppLayout activeNav={activeNav} onNavChange={setActiveNav} user={user} onLogout={onLogout}>
      <AlertsPage />
    </AppLayout>
  );
}

  if (activeNav !== "Dashboard") {
    return (
      <AppLayout activeNav={activeNav} onNavChange={setActiveNav} user={user} onLogout={onLogout}>
        <section className="module-placeholder">
          <h1>{activeNav}</h1>
          <p>{navDescriptions[activeNav]}</p>
          <p className="muted-note">
            This module is now selectable from the sidebar. Detailed screens can be
            implemented next.
          </p>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav={activeNav} onNavChange={setActiveNav} user={user} onLogout={onLogout}>
      <DashboardHeader onNavigate={setActiveNav} />

      <section className="stats-grid">
        <StatCard
          label="TOTAL ASSETS"
          value={totalAssets.toLocaleString()}
          description="Verified infrastructure components across all regions."
        />
        <StatCard
          label="TOTAL EVALUATIONS"
          value={totalEvaluations.toLocaleString()}
          description="Real-time safety and performance audits completed."
        />
      </section>

      <section className="dashboard-section">
        <SectionHeader title="Recent Evaluations" action="VIEW HISTORY" />
        <DataTable
          columns={["ASSET", "EQUIPMENT", "RESULT", "TIME"]}
          rows={recentEvaluationsData.length > 0 ? recentEvaluationsData : recentEvaluations}
          resultColumnIndex={2}
        />
      </section>

      <section className="dashboard-section">
        <SectionHeader title="Asset List" action="MANAGE ALL" />
        <DataTable
          columns={["ASSET", "ORGANISATION", "MAX LOAD", "UPDATE TIME"]}
          rows={assetList}
        />
      </section>
    </AppLayout>
  );
}

export default DashboardPage;