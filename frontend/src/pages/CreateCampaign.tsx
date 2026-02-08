import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function CreateCampaign() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const deploy = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.deployCampaign();
      if (res.ok && res.contractAddress) {
        setContractAddress(res.contractAddress);
      } else {
        setError(res.error ?? 'Deploy failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (contractAddress) navigator.clipboard.writeText(contractAddress);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Create campaign</h1>
        <p>Deploy a campaign as the recipient. Only you can withdraw. Share the campaign address so others can donate.</p>
        <button onClick={deploy} disabled={loading}>
          {loading ? 'Deploying…' : 'Deploy campaign'}
        </button>
        {error && <p style={{ color: '#f4212e' }}>{error}</p>}
      </div>
      {contractAddress && (
        <div className="card">
          <h2>Campaign created</h2>
          <p style={{ wordBreak: 'break-all' }}>{contractAddress}</p>
          <button className="secondary" onClick={copyAddress}>
            Copy address
          </button>
          <p>
            <Link to={`/campaign/${contractAddress}`}>Open campaign page</Link>
          </p>
        </div>
      )}
      <p>
        <Link to="/">Back</Link>
      </p>
    </div>
  );
}
