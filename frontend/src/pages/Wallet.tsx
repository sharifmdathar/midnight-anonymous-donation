import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const FAUCET_URL = 'https://faucet.preprod.midnight.network';

export default function Wallet() {
  const [seed, setSeed] = useState('');
  const [restore, setRestore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [hasDust, setHasDust] = useState(false);

  const createOrRestore = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.createWallet(restore ? seed.trim() : undefined);
      if (res.ok && res.unshieldedAddress) {
        setAddress(res.unshieldedAddress);
        setHasDust(res.hasDust ?? false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const checkWallet = async () => {
    setError('');
    try {
      const res = await api.getWallet();
      if (res.ok) {
        setAddress(res.unshieldedAddress ?? '');
        setHasDust(res.hasDust ?? false);
      } else {
        setError(res.error ?? 'No wallet');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Wallet</h1>
        <p className="muted">
          This app does <strong>not</strong> connect to Lace or other browser wallets. &quot;Create wallet&quot; gives a new
          address every time (server-generated). To use the same address as your Lace Midnight wallet, use
          &quot;Restore from seed&quot; and paste the wallet seed (hex) — only if Lace lets you export it and you accept
          the risk. Otherwise you use this app with its own wallet only.
        </p>
        <p>
          <label>
            <input type="checkbox" checked={restore} onChange={(e) => setRestore(e.target.checked)} /> Restore from
            seed
          </label>
        </p>
        {restore && (
          <p>
            <textarea
              placeholder="Paste wallet seed (hex) — e.g. from Lace if you have it"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              rows={2}
              style={{ width: '100%' }}
            />
          </p>
        )}
        <button onClick={createOrRestore} disabled={loading}>
          {loading ? '…' : restore ? 'Restore wallet' : 'Create wallet'}
        </button>
        {address && (
          <button className="secondary" onClick={checkWallet} style={{ marginLeft: '0.5rem' }}>
            Refresh status
          </button>
        )}
        {error && <p style={{ color: '#f4212e' }}>{error}</p>}
      </div>
      {address && (
        <div className="card">
          <h2>Unshielded address</h2>
          <p style={{ wordBreak: 'break-all' }}>{address}</p>
          <p>
            Standalone (local): the chain must be running (Terminal 1: <code>docker compose -f standalone.yml up</code>).
            No faucet — use &quot;Restore from seed&quot; with the genesis seed{' '}
            <code>0000000000000000000000000000000000000000000000000000000000000001</code> for a pre-funded wallet.
          </p>
          <p>
            Preprod: <a href={FAUCET_URL} target="_blank" rel="noreferrer">Preprod faucet</a> for tNight.
          </p>
          <p>{hasDust ? 'DUST available — you can deploy and donate.' : 'Waiting for DUST (start local stack first, then Refresh status).'}</p>
          <p>
            <Link to="/campaign/create">Create campaign</Link>
          </p>
        </div>
      )}
      <p>
        <Link to="/">Back</Link>
      </p>
    </div>
  );
}
