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
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const PAGE_SIZE = 10;

  // Function to fetch users from backend
  const fetchUsers = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const result = await requestJson(`/auth/users?page=${page}&pageSize=${PAGE_SIZE}`);
      
      if (result && result.items) {
        // Map backend data to frontend format
        const mappedUsers = result.items.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
          status: user.isFirstLogin ? "NEW" : "ACTIVE",
          statusColor: user.isFirstLogin ? "#008282" : "#006d73",
          isFirstLogin: user.isFirstLogin,
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

  // Fetch users from backend
  useEffect(() => {
    fetchUsers(currentPage);
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
        await fetchUsers(1);
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

  const handleUserAction = (userRow) => {
    setEditingUser(userRow);
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (formData) => {
    try {
      const result = await requestJson(`/auth/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (result && result.id) {
        alert("User updated successfully!");
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        // Refresh the users list
        await fetchUsers(1);
        setCurrentPage(1);
      }
    } catch (err) {
      alert(err.message || "Failed to update user");
      return Promise.reject(err);
    }
  };

  const handleCancelEditUser = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userRow) => {
    setUserToDelete(userRow);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUserConfirm = async () => {
    try {
      await requestJson(`/auth/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      alert("User deleted successfully!");
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      // Refresh the users list
      await fetchUsers(1);
      setCurrentPage(1);
    } catch (err) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setUserToDelete(null);
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
                    <th className="table-header-cell cell-action">ACTION</th>
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
                          <span
                            className="action-link"
                            onClick={() => handleUserAction(userRow)}
                            title="Edit user"
                          >
                            Edit
                          </span>
                          <span className="action-separator">|</span>
                          <span
                            className="action-link action-link-delete"
                            onClick={() => handleDeleteUser(userRow)}
                            title="Delete user"
                          >
                            Delete
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && !error && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    <span>
                      Showing {usersData.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
                      {Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} users
                    </span>
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-button"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    <span className="pagination-number">{currentPage}</span>
                    <button
                      className="pagination-button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
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

        {/* Edit User Modal */}
        <Modal
          isOpen={isEditUserModalOpen}
          title="Edit User"
          onClose={handleCancelEditUser}
          size="small"
        >
          <CreateUserForm
            initialData={editingUser}
            onSubmit={handleEditUserSubmit}
            onCancel={handleCancelEditUser}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteConfirmOpen}
          title="Confirm Delete"
          onClose={handleCancelDelete}
          size="small"
        >
          <div style={{ padding: "16px 0" }}>
            <p style={{ marginBottom: "12px", color: "#64748b" }}>
              Are you sure you want to delete user <strong>{userToDelete?.email}</strong>?
            </p>
            <div
              style={{
                padding: "12px",
                marginBottom: "16px",
                backgroundColor: "#fef2f2",
                borderLeft: "4px solid #dc2626",
                borderRadius: "4px",
              }}
            >
              <p style={{ margin: "0", color: "#dc2626", fontSize: "14px" }}>
                ⚠️ This action cannot be undone. The user will be permanently deleted.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: "10px 24px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUserConfirm}
                style={{
                  padding: "10px 24px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}

export default AdminUsersPage;
