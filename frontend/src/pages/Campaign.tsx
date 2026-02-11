import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function Campaign() {
  const { address } = useParams<{ address: string }>();
  const [donationCount, setDonationCount] = useState<string | null>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [joinAddress, setJoinAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txMsg, setTxMsg] = useState('');

  const loadCampaign = async () => {
    if (!address) return;
    setError('');
    try {
      const res = await api.getCampaign(address);
      if (res.ok) setDonationCount(res.donationCount ?? null);
      else setError(res.error ?? 'Not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  useEffect(() => {
    loadCampaign();
  }, [address]);

  const donate = async () => {
    if (!donateAmount || BigInt(donateAmount) <= 0n) return;
    setError('');
    setTxMsg('');
    setLoading(true);
    try {
      const res = await api.donate(donateAmount, address);
      if (res.ok) {
        setTxMsg(`Donation submitted. Tx: ${res.txId ?? '—'}`);
        setDonateAmount('');
        loadCampaign();
      } else {
        setError(res.error ?? 'Donate failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const joinThenDonate = async () => {
    if (!joinAddress.trim()) return;
    setError('');
    setTxMsg('');
    setLoading(true);
    try {
      await api.joinCampaign(joinAddress.trim());
      const res = await api.donate(donateAmount || '1', joinAddress.trim());
      if (res.ok) {
        setTxMsg('Joined and donated.');
        loadCampaign();
      } else {
        setError(res.error ?? 'Failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    setError('');
    setTxMsg('');
    setLoading(true);
    try {
      const res = await api.withdraw();
      if (res.ok) {
        setTxMsg(`Withdraw submitted. Tx: ${res.txId ?? '—'}`);
        loadCampaign();
      } else {
        setError(res.error ?? 'Withdraw failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Campaign</h1>
        {address && (
          <>
            <p><strong>Contract address:</strong></p>
            <p style={{ wordBreak: 'break-all' }}>{address}</p>
          </>
        )}
        <p>Donation count: {donationCount ?? '—'}</p>
        <button className="secondary" onClick={loadCampaign}>
          Refresh
        </button>
        {error && <p style={{ color: '#f4212e' }}>{error}</p>}
        {txMsg && <p style={{ color: '#00ba7c' }}>{txMsg}</p>}
      </div>
      <div className="card">
        <h2>Donate</h2>
        <p>
          <input
            type="text"
            placeholder="Amount"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          />
          <button onClick={donate} disabled={loading || !address}>
            Donate
          </button>
        </p>
        <p>Or join by contract address and donate:</p>
        <p>
          <input
            type="text"
            placeholder="Contract address"
            value={joinAddress}
            onChange={(e) => setJoinAddress(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <input
            type="text"
            placeholder="Amount"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          />
          <button onClick={joinThenDonate} disabled={loading}>
            Join and donate
          </button>
        </p>
      </div>
      <div className="card">
        <h2>Withdraw (recipient only)</h2>
        <p>Only the campaign creator can withdraw.</p>
        <button onClick={withdraw} disabled={loading}>
          Withdraw
        </button>
      </div>
      <p>
        <Link to="/">Back</Link>
      </p>
    </div>
  );
}
