const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export interface WalletResponse {
  ok: boolean;
  seed?: string;
  unshieldedAddress?: string;
  message?: string;
  hasDust?: boolean;
  dustBalance?: string;
  error?: string;
}

export interface CampaignResponse {
  ok: boolean;
  contractAddress?: string;
  donationCount?: string | null;
  error?: string;
}

export interface TxResponse {
  ok: boolean;
  txId?: string;
  blockHeight?: string;
  error?: string;
}

export const api = {
  async createWallet(seed?: string): Promise<WalletResponse> {
    return fetchJson('/wallet', { method: 'POST', body: JSON.stringify(seed ? { seed } : {}) });
  },
  async getWallet(): Promise<WalletResponse> {
    return fetchJson('/wallet');
  },
  async deployCampaign(): Promise<CampaignResponse> {
    return fetchJson('/campaign/deploy', { method: 'POST', body: '{}' });
  },
  async joinCampaign(contractAddress: string): Promise<CampaignResponse> {
    return fetchJson('/campaign/join', { method: 'POST', body: JSON.stringify({ contractAddress }) });
  },
  async donate(amount: string, contractAddress?: string): Promise<TxResponse> {
    return fetchJson('/campaign/donate', {
      method: 'POST',
      body: JSON.stringify({ amount, contractAddress }),
    });
  },
  async withdraw(): Promise<TxResponse> {
    return fetchJson('/campaign/withdraw', { method: 'POST', body: '{}' });
  },
  async getCampaign(address: string): Promise<CampaignResponse> {
    return fetchJson(`/campaign/${encodeURIComponent(address)}`);
  },
};
