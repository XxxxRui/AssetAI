import { useEffect, useState } from "react";
import LoginEmailPage from "./pages/LoginEmailPage";
import PasswordSetupPage from "./pages/PasswordSetupPage";
import DashboardPage from "./pages/DashboardPage";
import {
  setAuthToken,
  clearAuthToken,
  restoreAuthToken,
  setUnauthorizedHandler,
} from "./services/authSession";

const LAST_LOGIN_EMAIL_KEY = "assetguard:last-login-email";
const USER_DATA_KEY = "assetguard:user-data";

function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [systemMessage, setSystemMessage] = useState("");

  const handleLogout = (message = "") => {
    try {
      localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } catch {
      // Ignore storage failures (e.g. private mode restrictions).
    }
    clearAuthToken(); // Clear stored token from localStorage
    setToken("");
    setAuthToken(""); // Also clear from memory
    setUser(null);
    setCurrentPage("login");
    setSystemMessage(message);
  };

  useEffect(() => {
    // On app startup, try to restore token and user data from localStorage
    const restoredToken = restoreAuthToken();
    if (restoredToken) {
      setToken(restoredToken);
      setAuthToken(restoredToken);
      
      // Try to restore user data from localStorage
      try {
        const storedUserData = localStorage.getItem(USER_DATA_KEY);
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          // Only restore safe fields
          const safeUser = {
            email: userData?.email || "",
            role: userData?.role || "",
            isFirstLogin: userData?.isFirstLogin || false,
          };
          setUser(safeUser);
        }
      } catch (e) {
        // Ignore parsing errors, proceed without user data
        console.error("Failed to restore user data:", e);
      }
      
      setCurrentPage("dashboard");
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleLogout("Your session has expired. Please sign in again.");
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const handleLoginSuccess = (loginPayload = {}) => {
    const nextToken = loginPayload?.token || "";
    const nextUser = loginPayload?.user || {};

    if (!nextToken) {
      setSystemMessage("Login response is missing token. Please verify backend response shape.");
      setCurrentPage("login");
      return;
    }

    setToken(nextToken);
    setAuthToken(nextToken);
    setUser(nextUser);
    
    // Save only essential user data to localStorage
    try {
      const safeUserData = {
        email: nextUser?.email || "",
        role: nextUser?.role || "",
        isFirstLogin: nextUser?.isFirstLogin || false,
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(safeUserData));
    } catch (e) {
      // Ignore storage failures
      console.error("Failed to save user data:", e);
    }
    
    setSystemMessage("");
    setCurrentPage(nextUser?.isFirstLogin ? "password" : "dashboard");
  };

  const handlePasswordSetSuccess = () => {
    const nextUser = { ...(user || {}), isFirstLogin: false };
    setUser(nextUser);
    
    // Update user data in localStorage
    try {
      const safeUserData = {
        email: nextUser?.email || "",
        role: nextUser?.role || "",
        isFirstLogin: nextUser?.isFirstLogin || false,
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(safeUserData));
    } catch (e) {
      // Ignore storage failures
      console.error("Failed to update user data:", e);
    }
    
    setCurrentPage("dashboard");
  };

  return (
    <>
      {currentPage === "login" && (
        <LoginEmailPage
          onLoginSuccess={handleLoginSuccess}
          systemMessage={systemMessage}
        />
      )}
      {currentPage === "password" && (
        <PasswordSetupPage
          token={token}
          onPasswordSetSuccess={handlePasswordSetSuccess}
          onBackToLogin={handleLogout}
        />
      )}
      {currentPage === "dashboard" && (
        <DashboardPage user={user} onLogout={() => handleLogout("")} />
      )}
    </>
  );
}

export default App;