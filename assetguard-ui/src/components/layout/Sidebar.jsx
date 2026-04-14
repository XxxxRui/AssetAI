const menuItems = [
    "Dashboard",
    "Evaluation",
    "Assets",
    "History",
    "Alerts",
    "Admin",
  ];
  
  function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">AssetGuard AI</div>
          <div className="brand-subtitle">ETHEREAL PRECISION</div>
        </div>
  
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item}
              className={`sidebar-link ${item === "Dashboard" ? "active" : ""}`}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
    );
  }
  
  export default Sidebar;