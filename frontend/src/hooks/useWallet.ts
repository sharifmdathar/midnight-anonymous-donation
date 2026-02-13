import { useContext } from 'react';
import { WalletContext, type WalletContextType } from '../context/WalletContext';

export function useWallet(): WalletContextType {
    const ctx = useContext(WalletContext);
    if (!ctx) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return ctx;
}
