import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, activeNav, onNavChange, user, menuItems, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar
        activeItem={activeNav}
        onSelectItem={onNavChange}
        menuItems={menuItems}
      />
      <div className="app-main">
        <Topbar user={user} onLogout={onLogout} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
