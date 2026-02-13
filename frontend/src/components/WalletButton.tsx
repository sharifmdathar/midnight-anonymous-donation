import { useWallet } from '../hooks/useWallet';

export function WalletButton() {
    const { wallet, address, isConnecting, error, connectLace, disconnect } = useWallet();

    if (isConnecting) {
        return (
            <button className="wallet-btn connecting" disabled>
                <span className="spinner" />
                Connecting…
            </button>
        );
    }

    if (wallet && address) {
        return (
            <div className="wallet-connected">
                <span className="wallet-address" title={address}>
                    {address.slice(0, 8)}…{address.slice(-6)}
                </span>
                <button className="wallet-btn disconnect" onClick={disconnect}>
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-connect-wrap">
            <button className="wallet-btn connect" onClick={connectLace}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor" />
                </svg>
                Connect Lace
            </button>
            {error && <p className="wallet-error">{error}</p>}
        </div>
    );
}
