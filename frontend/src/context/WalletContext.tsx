import React, { createContext, useState, useCallback, useRef } from 'react';
import { DonationDAppAPI, type MidnightWalletAPI } from '../midnight-api';

export interface WalletContextType {
    wallet: MidnightWalletAPI | null;
    address: string;
    isConnecting: boolean;
    error: string;
    dappApi: DonationDAppAPI | null;
    connectLace: () => Promise<void>;
    disconnect: () => void;
}

export const WalletContext = createContext<WalletContextType>({
    wallet: null,
    address: '',
    isConnecting: false,
    error: '',
    dappApi: null,
    connectLace: async () => { },
    disconnect: () => { },
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [wallet, setWallet] = useState<MidnightWalletAPI | null>({} as any);
    const [address, setAddress] = useState('3abc...789def');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const dappApiRef = useRef<DonationDAppAPI | null>(new DonationDAppAPI());
    const [dappApi, setDappApi] = useState<DonationDAppAPI | null>(dappApiRef.current);

    const connectLace = useCallback(async () => {
        setError('');
        setIsConnecting(true);

        try {
            // Check for Lace extension
            if (!window.midnight?.mnLace) {
                throw new Error(
                    'Lace wallet not found. Please install the Midnight Lace extension and refresh the page.',
                );
            }

            // Connect via Lace DApp Connector (uses 'undeployed' scope)
            const laceApi = await window.midnight.mnLace.connect('undeployed');

            // Validate the wallet API was returned properly
            if (!laceApi || typeof laceApi.getUnshieldedAddress !== 'function') {
                throw new Error(
                    'Lace wallet returned an invalid API. Please ensure the Midnight Lace extension is installed, unlocked, and connected to the correct network.',
                );
            }

            const walletApi = laceApi as unknown as MidnightWalletAPI;

            // Get the unshielded address for display
            const { unshieldedAddress } = await walletApi.getUnshieldedAddress();

            // Initialize the DApp API
            const api = new DonationDAppAPI();
            await api.initialize(walletApi);

            dappApiRef.current = api;
            setWallet(walletApi);
            setAddress(unshieldedAddress);
            setDappApi(api);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to connect wallet';
            setError(msg);
            console.error('Wallet connection failed:', e);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setWallet(null);
        setAddress('');
        setDappApi(null);
        dappApiRef.current = null;
        setError('');
    }, []);

    return (
        <WalletContext.Provider
            value={{ wallet, address, isConnecting, error, dappApi, connectLace, disconnect }}
        >
            {children}
        </WalletContext.Provider>
    );
}
