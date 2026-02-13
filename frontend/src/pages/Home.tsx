import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Private Donations
          <br />
          <span className="gradient-text">on Midnight</span>
        </h1>
        <p className="hero-subtitle">
          Send confidential donations powered by zero-knowledge proofs. Amounts, balances, and
          identities stay completely private.
        </p>
        <div className="hero-actions">
          <Link to="/campaign/create" className="btn btn-primary">
            Launch Campaign
          </Link>
          <a
            href="https://docs.midnight.network"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Private Donations</h3>
          <p>Donation amounts are hidden using zero-knowledge proofs. Only the donation count is public.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>ZK Verification</h3>
          <p>Every transaction is cryptographically verified on-chain without revealing sensitive data.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💎</div>
          <h3>Secure Withdrawals</h3>
          <p>Only the campaign creator can withdraw — verified by a secret key proof, not an account check.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="card glass">
        <h2>How it Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <div>
              <strong>Connect Lace</strong>
              <p className="muted">Link your Midnight Lace wallet using the button in the navigation bar.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <div>
              <strong>Create or Join</strong>
              <p className="muted">Deploy a new campaign or enter an existing contract address to join one.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <div>
              <strong>Donate Privately</strong>
              <p className="muted">Submit a donation — the amount stays hidden via ZK proof.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
