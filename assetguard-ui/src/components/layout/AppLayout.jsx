import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, activeNav, onNavChange, user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar activeItem={activeNav} onSelectItem={onNavChange} />
      <div className="app-main">
        <Topbar user={user} onLogout={onLogout} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;