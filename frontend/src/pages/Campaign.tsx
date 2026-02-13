import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { api } from '../api';

export default function Campaign() {
  const { address } = useParams<{ address: string }>();
  const { wallet, dappApi } = useWallet();

  const [donationCount, setDonationCount] = useState<string | null>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [txMsg, setTxMsg] = useState('');
  const [isJoined, setIsJoined] = useState(true);

  // Load campaign state from backend API (fallback)
  const loadCampaign = async () => {
    if (!address) return;
    try {
      const res = await api.getCampaign(address);
      if (res.ok) setDonationCount(res.donationCount ?? null);
    } catch {
      // Backend may not be running — that's okay
    }
  };

  useEffect(() => {
    loadCampaign();
  }, [address]);

  // Join contract via Lace (connect to existing deployed contract)
  const joinContract = async () => {
    if (!dappApi || !address) return;
    setError('');
    setJoining(true);
    try {
      await dappApi.findContract(address);
      setIsJoined(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join contract');
    } finally {
      setJoining(false);
    }
  };

  // Donate via wallet
  const donateWithWallet = async () => {
    if (!dappApi || !donateAmount) return;
    const amount = BigInt(donateAmount);
    if (amount <= 0n) return;

    setError('');
    setTxMsg('');
    setLoading(true);
    try {
      const result = await dappApi.callDonate(amount);
      setTxMsg(`✅ Donation submitted! Tx: ${result.txHash}`);
      setDonateAmount('');
      loadCampaign();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Donation failed');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw via wallet (recipient only)
  const withdrawWithWallet = async () => {
    if (!dappApi) return;
    setError('');
    setTxMsg('');
    setLoading(true);
    try {
      const result = await dappApi.callWithdraw();
      setTxMsg(`✅ Withdrawal submitted! Tx: ${result.txHash}`);
      loadCampaign();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Campaign Header */}
      <div className="card glass">
        <h1>Campaign Dashboard</h1>
        {address && (
          <div className="address-box">
            <code>{address}</code>
          </div>
        )}

        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{donationCount ?? '—'}</span>
            <span className="stat-label">Donations</span>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadCampaign}>
          ↻ Refresh
        </button>

        {error && <p className="error-text">{error}</p>}
        {txMsg && <p className="success-text">{txMsg}</p>}
      </div>

      {/* Connect to Contract */}
      {wallet && !isJoined && (
        <div className="card glass">
          <h2>Connect to Contract</h2>
          <p className="muted">
            Link your wallet to this contract to interact with it. This loads the contract state and
            ZK circuits.
          </p>
          <button className="btn btn-primary" onClick={joinContract} disabled={joining}>
            {joining ? (
              <>
                <span className="spinner" /> Connecting…
              </>
            ) : (
              'Connect to Contract'
            )}
          </button>
        </div>
      )}

      {/* Donate Section */}
      <div className="card glass">
        <h2>💎 Donate</h2>
        <p className="muted">
          Your donation amount is kept private using zero-knowledge proofs. Only the donation count
          is updated publicly.
        </p>

        {!wallet && (
          <div className="alert alert-warning">
            Connect your Lace wallet to donate with ZK privacy.
          </div>
        )}

        {wallet && !isJoined && (
          <div className="alert alert-info">
            Connect to the contract above first, then you can donate.
          </div>
        )}

        <div className="input-group">
          <input
            type="number"
            placeholder="Amount"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            className="input"
            min="1"
          />
          <button
            className="btn btn-primary"
            onClick={donateWithWallet}
            disabled={loading || !wallet || !isJoined || !donateAmount}
          >
            {loading ? (
              <>
                <span className="spinner" /> Processing…
              </>
            ) : (
              'Donate with Wallet'
            )}
          </button>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="card glass">
        <h2>🔓 Withdraw</h2>
        <p className="muted">
          Only the campaign creator can withdraw. Your secret key is verified via ZK proof — no one
          else can access the funds.
        </p>
        <button
          className="btn btn-outline"
          onClick={withdrawWithWallet}
          disabled={loading || !wallet || !isJoined}
        >
          {loading ? 'Processing…' : 'Withdraw Funds'}
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/campaign/create" className="nav-link">
          ← Back to Campaigns
        </Link>
      </p>
    </div>
  );
}
