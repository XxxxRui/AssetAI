import AuthLayout from "../components/layout/AuthLayout";
import buildingImage from "../assets/building.png";

function LoginEmailPage() {
  const leftContent = (
    <div className="login-hero">
      <div className="brand">AssetGuard AI</div>

      <div className="hero-image-wrapper">
        <img src={buildingImage} alt="Building" className="hero-image" />
      </div>

      <div className="hero-text">
        <h1>Ethereal Precision in Asset Intelligence.</h1>
        <p>
          Advanced engineering oversight for complex infrastructure environments,
          delivered through minimalistic clarity.
        </p>
      </div>

      <div className="hero-tags">
        <span>ENGINEERING EXCELLENCE</span>
        <span>AI DRIVEN INSIGHTS</span>
      </div>
    </div>
  );

  const rightContent = (
    <div className="form-panel">
      <p className="eyebrow">WELCOME BACK</p>
      <h2 className="form-title">Sign in to your dashboard</h2>

      <form className="auth-form">
        <div className="form-group">
          <label>CORPORATE EMAIL</label>
          <input type="email" placeholder="john.doe@company.com" />
        </div>

        <div className="form-group">
          <label>SECURE PASSWORD</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <button type="button" className="primary-btn">
          Sign In <span>→</span>
        </button>
      </form>

      <p className="small-note">
        Authorized personnel only. Access to this system is monitored and logged
        in accordance with corporate security policies.
      </p>

      <div className="status-card">
        <div className="status-title">
          <span className="dot"></span>
          SYSTEM HEALTH
        </div>
        <p>All monitoring nodes are active. Latency is optimized at 12ms.</p>
      </div>
    </div>
  );

  return <AuthLayout leftContent={leftContent} rightContent={rightContent} />;
}

export default LoginEmailPage;