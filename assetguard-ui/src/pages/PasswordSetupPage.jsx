import { useState } from "react";
import AuthLayout from "../components/layout/AuthLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function PasswordSetupPage({ token, onPasswordSetSuccess, onBackToLogin }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetPassword = async () => {
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Session missing. Please sign in again.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/set-initial-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to set password.");
      }
      onPasswordSetSuccess();
    } catch (error) {
      setErrorMessage(error.message || "Unable to set password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftContent = (
    <div className="setup-left-content">
      <div className="hero-brand">
        <span className="hero-brand-icon">&#9670;</span>
        AssetGuard AI
      </div>

      <div className="setup-copy">
        <p className="hero-subtitle">SECURITY PROTOCOL</p>

        <h1>Initialize your secure gateway.</h1>

        <p className="hero-description" style={{ color: "rgba(255,255,255,0.5)", maxWidth: 520 }}>
          First-time authentication requires a robust password to anchor your
          account&apos;s cryptographic identity within the AssetGuard network.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-dot"></span>
            <div>
              <strong>End-to-End Encryption</strong>
              <p>
                Passwords are hashed locally before transmission to ensure
                zero-knowledge architecture.
              </p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-dot"></span>
            <div>
              <strong>Multi-Layer Validation</strong>
              <p>
                Real-time entropy analysis checks for common patterns and
                dictionary vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="setup-right-content">
      <div className="password-card">
        <div className="form-group boxed">
          <label>NEW PASSWORD</label>
          <div className="password-box">
            <input
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <span className="eye">&#9673;</span>
          </div>
        </div>

        <div className="form-group boxed">
          <label>CONFIRM PASSWORD</label>
          <div className="password-box">
            <input
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="requirements-box">
          <p className="requirements-title">REQUIREMENTS</p>

          <ul>
            <li className="active">Minimum 12 characters</li>
            <li>Uppercase & lowercase letters</li>
            <li>Numbers & special symbols</li>
            <li>No personal information</li>
          </ul>
        </div>

        {errorMessage && (
          <div className="auth-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          className="primary-btn"
          onClick={handleSetPassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Initialize Secure Access"}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={onBackToLogin}
          style={{ marginTop: 12 }}
        >
          Back to Login
        </button>
      </div>

      <div className="tip-card">
        <div className="tip-title">AI Security Tip</div>
        <p>
          Our GuardNet engine suggests using a unique passphrase of four
          unrelated words for optimal cryptographic strength.
        </p>
      </div>
    </div>
  );

  const footer = (
    <>
      <div>&copy; 2024 AssetGuard AI</div>
      <div className="footer-links">
        <span>PRIVACY PROTOCOL</span>
        <span>SUPPORT</span>
      </div>
    </>
  );

  return (
    <AuthLayout
      leftContent={leftContent}
      rightContent={rightContent}
      footer={footer}
    />
  );
}

export default PasswordSetupPage;
