import AuthLayout from "../components/layout/AuthLayout";

function PasswordSetupPage() {
  const leftContent = (
    <div className="setup-left-content">
      <div className="brand">AssetGuard AI</div>

      <div className="setup-copy">
        <p className="eyebrow dark">SECURITY PROTOCOL 01</p>

        <h1>Initialize your secure gateway.</h1>

        <p className="setup-description">
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
            <input type="password" placeholder="••••••••••••" />
            <span className="eye">◉</span>
          </div>
        </div>

        <div className="form-group boxed">
          <label>CONFIRM PASSWORD</label>
          <div className="password-box">
            <input type="password" placeholder="••••••••••••" />
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

        <button type="button" className="primary-btn">
          Initialize Secure Access <span>→</span>
        </button>
      </div>

      <div className="tip-card">
        <div className="tip-title">✧ AI SECURITY TIP</div>
        <p>
          Our GuardNet engine suggests using a unique passphrase of four
          unrelated words for optimal cryptographic strength.
        </p>
      </div>
    </div>
  );

  const footer = (
    <>
      <div>© 2024 ASSETGUARD AI</div>
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