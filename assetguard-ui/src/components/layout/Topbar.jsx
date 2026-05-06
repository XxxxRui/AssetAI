import { useState } from "react";

function Topbar({ user, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const userLabel = user?.email || "Unknown User";

  const handleMouseEnter = () => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
    setDropdownTimeout(timeout);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
    }
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="topbar">
      <div></div>
      <div 
        className="topbar-user-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      <div className="topbar-user">{userLabel} ▾</div>
        {isDropdownOpen && (
          <div className="topbar-dropdown">
            <button className="topbar-dropdown-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
