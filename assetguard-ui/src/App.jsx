import { useState } from "react";
import LoginEmailPage from "./pages/LoginEmailPage";
import PasswordSetupPage from "./pages/PasswordSetupPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const storedToken = localStorage.getItem("assetguard_token");
  const storedUserRaw = localStorage.getItem("assetguard_user");
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  const [token, setToken] = useState(storedToken || "");
  const [user, setUser] = useState(storedUser);
  const [currentPage, setCurrentPage] = useState(() => {
    if (!storedToken || !storedUser) return "login";
    return storedUser.isFirstLogin ? "password" : "dashboard";
  });

  const handleLoginSuccess = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("assetguard_token", nextToken);
    localStorage.setItem("assetguard_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setCurrentPage(nextUser.isFirstLogin ? "password" : "dashboard");
  };

  const handlePasswordSetSuccess = () => {
    const nextUser = { ...(user || {}), isFirstLogin: false };
    localStorage.setItem("assetguard_user", JSON.stringify(nextUser));
    setUser(nextUser);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("assetguard_token");
    localStorage.removeItem("assetguard_user");
    setToken("");
    setUser(null);
    setCurrentPage("login");
  };

  return (
    <>
      {currentPage === "login" && (
        <LoginEmailPage onLoginSuccess={handleLoginSuccess} />
      )}
      {currentPage === "password" && (
        <PasswordSetupPage
          token={token}
          onPasswordSetSuccess={handlePasswordSetSuccess}
          onBackToLogin={handleLogout}
        />
      )}
      {currentPage === "dashboard" && <DashboardPage />}
    </>
  );
}

export default App;