import { useState } from "react";
import AuthLayout from "../components/layout/AuthLayout";
import buildingImage from "../assets/building.png";
import { API_BASE_URL } from "../services/apiClient";

const LAST_LOGIN_EMAIL_KEY = "assetguard:last-login-email";

function getLastLoginEmail() {
  try {
    return localStorage.getItem(LAST_LOGIN_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

function LoginEmailPage({ onLoginSuccess, systemMessage = "" }) {
  const [email, setEmail] = useState(getLastLoginEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Login failed.");
      }
      try {
        localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.trim());
      } catch {
        // Ignore storage failures.
      }
      onLoginSuccess(payload?.data ?? payload);
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftContent = (
    <div className="login-hero">
      <div className="hero-brand">
        <span className="hero-brand-icon">&#9670;</span>
        AssetGuard AI
      </div>

      <div className="hero-image-wrapper">
        <img src={buildingImage} alt="Engineering infrastructure" className="hero-image" />
        <div className="hero-image-overlay" />
      </div>

      <div className="hero-text">
        <p className="hero-subtitle">INTELLIGENT ASSET MANAGEMENT</p>
        <h1>
          Precision engineering
          <br />
          meets AI insight.
        </h1>
        <p className="hero-description">
          Advanced oversight for complex infrastructure environments —
          delivered through clarity and intelligent automation.
        </p>
      </div>

      <div className="hero-tags">
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          REAL-TIME MONITORING
        </div>
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          AI-DRIVEN ANALYSIS
        </div>
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          COMPLIANCE ASSURED
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="form-panel">
      <div className="form-header">
        <p className="eyebrow">Welcome back</p>
        <h2 className="form-title">Sign in to your account</h2>
        <p className="form-subtitle">
          Enter your credentials to access the dashboard.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="login-email">Email Address</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {(errorMessage || systemMessage) && (
          <div className="auth-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{errorMessage || systemMessage}</span>
          </div>
        )}

        <button
          type="submit"
          className="primary-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="btn-loading">
              <span className="spinner" />
              Signing in...
            </span>
          ) : (
            <span className="btn-content">
              Sign In
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          )}
        </button>
      </form>

      <p className="small-note">
        Secured access portal. All sign-in attempts are monitored and logged
        in compliance with organizational security policies.
      </p>
    </div>
  );

  return <AuthLayout leftContent={leftContent} rightContent={rightContent} />;
}

export default LoginEmailPage;
