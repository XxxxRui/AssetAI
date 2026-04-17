import LoginEmailPage from "./pages/LoginEmailPage";
import PasswordSetupPage from "./pages/PasswordSetupPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  // const currentPage = "login";
  // const currentPage = "password";
  const currentPage = "dashboard";

  return (
    <>
      {currentPage === "login" && <LoginEmailPage />}
      {currentPage === "password" && <PasswordSetupPage />}
      {currentPage === "dashboard" && <DashboardPage />}
    </>
  );
}

export default App;