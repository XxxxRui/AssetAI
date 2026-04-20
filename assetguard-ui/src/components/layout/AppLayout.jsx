import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, activeNav, onNavChange }) {
  return (
    <div className="app-shell">
      <Sidebar activeItem={activeNav} onSelectItem={onNavChange} />
      <div className="app-main">
        <Topbar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;