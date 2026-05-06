import { useState, useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import Modal from "../components/modal/Modal";
import CreateUserForm from "../components/forms/CreateUserForm";
import { requestJson } from "../services/apiClient";
import "../styles/admin-users.css";

function AdminUsersPage({ user, onNavChange, onLogout }) {
  const [activeNav, setActiveNav] = useState("Admin/User");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersData, setUsersData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const PAGE_SIZE = 5;

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await requestJson(`/auth/users?page=${currentPage}&pageSize=${PAGE_SIZE}`);
        
        if (result && result.items) {
          // Map backend data to frontend format
          const mappedUsers = result.items.map((user) => ({
            id: user.id,
            name: user.email,
            role: user.role,
            status: user.isFirstLogin ? "NEW" : "ACTIVE",
            statusColor: user.isFirstLogin ? "#008282" : "#006767",
          }));

          setUsersData(mappedUsers);
          setTotalUsers(result.total || 0);
          setTotalPages(result.pages || 1);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  // Handle nav changes
  const handleNavChange = (newNav) => {
    if (onNavChange) {
      onNavChange(newNav);
    } else {
      setActiveNav(newNav);
    }
  };

  const handleAddNewUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (formData) => {
    try {
      const result = await requestJson("/auth/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (result && result.id) {
        alert("User created successfully!");
        setIsCreateUserModalOpen(false);
        // Refresh the users list
        setCurrentPage(1);
      }
    } catch (err) {
      alert(err.message || "Failed to create user");
      return Promise.reject(err);
    }
  };

  const handleCancelCreateUser = () => {
    setIsCreateUserModalOpen(false);
  };

  const handleUserAction = (userId) => {
    // TODO: Implement action menu or edit user functionality
    console.log("Action for user:", userId);
  };

  const handlePrevPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      user={user}
      onLogout={onLogout}
    >
      <div className="admin-users-page">
        {/* Page Content */}
        <div className="admin-users-content">
          {/* Header Section */}
          <div className="users-header">
            <h1 className="header-title">Users</h1>
            <button className="btn-add-user" onClick={handleAddNewUser}>
              <span className="btn-icon">+</span>
              <span>Add New User</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "16px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
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
                color: "#666",
              }}
            >
              Loading users...
            </div>
          )}

          {/* Users Table */}
          {!loading && !error && (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell cell-user-id">USER ID</th>
                    <th className="table-header-cell cell-name">EMAIL</th>
                    <th className="table-header-cell cell-role">ROLE</th>
                    <th className="table-header-cell cell-status">STATUS</th>
                    <th className="table-header-cell cell-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.length > 0 ? (
                    usersData.map((userRow, idx) => (
                      <tr key={idx} className="table-body-row">
                        <td className="table-cell cell-user-id">
                          <span className="user-id">#{userRow.id}</span>
                        </td>
                        <td className="table-cell cell-name">
                          <span className="user-name">{userRow.name}</span>
                        </td>
                        <td className="table-cell cell-role">
                          <span className="user-role">{userRow.role}</span>
                        </td>
                        <td className="table-cell cell-status">
                          <div className="status-badge">
                            <span
                              className="status-dot"
                              style={{ backgroundColor: userRow.statusColor }}
                            />
                            <span
                              className="status-text"
                              style={{ color: userRow.statusColor }}
                            >
                              {userRow.status}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell cell-action">
                          <button
                            className="action-button"
                            onClick={() => handleUserAction(userRow.id)}
                            title="More options"
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                        No users found
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
                <span>
                  Showing {usersData.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
                  {Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} users
                </span>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn prev-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{ display: i + 1 <= totalPages ? "block" : "none" }}
                  >
                    {i + 1}
                  </button>
                ))}
                {totalPages > 3 && <span className="pagination-ellipsis">...</span>}
                {totalPages > 3 && (
                  <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </button>
                )}
                <button
                  className="pagination-btn next-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        <Modal
          isOpen={isCreateUserModalOpen}
          title="Add New User"
          onClose={handleCancelCreateUser}
          size="small"
        >
          <CreateUserForm
            onSubmit={handleCreateUserSubmit}
            onCancel={handleCancelCreateUser}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}

export default AdminUsersPage;
