import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1>AnonymousDonation</h1>
        <p>Send private donations on Midnight. Amounts and balances stay confidential.</p>
      </div>
      <div className="card">
        <h2>Get started</h2>
        <p>
          <Link to="/wallet">Set up wallet</Link> — create or restore a wallet, then fund it with tNight from the
          Preprod faucet.
        </p>
        <p>
          <Link to="/campaign/create">Create a campaign</Link> — deploy a campaign as the recipient; only you can
          withdraw.
        </p>
        <p>Share your campaign address so others can donate. Donors use &quot;Join campaign&quot; then donate with a private amount.</p>
      </div>
    </div>
  );
}
