import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

export default function CreateCampaign() {
  const { dappApi, wallet } = useWallet();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [joinAddress, setJoinAddress] = useState('');

  // Deploy a new campaign
  const deploy = async () => {
    if (!dappApi) {
      setError('Connect your Lace wallet first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await dappApi.deployNewContract();
      if (result?.contractAddress) {
        setContractAddress(result.contractAddress);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
    }
  };

  const goToCampaign = () => {
    const addr = joinAddress.trim() || contractAddress;
    if (addr) {
      navigate(`/campaign/${addr}`);
    }
  };

  return (
    <div className="container">
      {/* Deploy Section */}
      <div className="card glass">
        <h1>Create Campaign</h1>
        <p className="muted">
          Deploy a new donation campaign. You'll be the only one who can withdraw funds, secured by
          a ZK-verified secret key.
        </p>

        {!wallet && (
          <div className="alert alert-warning">
            <strong>Wallet Required</strong> — Connect your Lace wallet using the button in the
            navigation bar to deploy a campaign.
          </div>
        )}

        <button className="btn btn-primary" onClick={deploy} disabled={loading || !wallet}>
          {loading ? (
            <>
              <span className="spinner" /> Deploying…
            </>
          ) : (
            'Deploy Campaign'
          )}
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>

      {/* Deploy Result */}
      {contractAddress && (
        <div className="card glass success-card">
          <h2>🎉 Campaign Created</h2>
          <p className="muted">Share this address so donors can find your campaign:</p>
          <div className="address-box">
            <code>{contractAddress}</code>
            <button className="btn btn-secondary btn-sm" onClick={copyAddress}>
              Copy
            </button>
          </div>
          <button className="btn btn-primary" onClick={goToCampaign}>
            Open Campaign Dashboard →
          </button>
        </div>
      )}

      {/* Join Existing */}
      <div className="card glass">
        <h2>Join Existing Campaign</h2>
        <p className="muted">Already have a contract address? Enter it below to go to the campaign dashboard.</p>
        <div className="input-group">
          <input
            type="text"
            placeholder="Paste contract address (64-char hex)"
            value={joinAddress}
            onChange={(e) => setJoinAddress(e.target.value)}
            className="input"
          />
          <button
            className="btn btn-secondary"
            onClick={goToCampaign}
            disabled={!joinAddress.trim()}
          >
            Go to Campaign
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/" className="nav-link">
          ← Back to Home
        </Link>
      </p>
    </div>
  );
}
