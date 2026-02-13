/// <reference types="vite/client" />
/// <reference types="react" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Lace extension DApp Connector API type declarations
interface MidnightLaceAPI {
  connect(scope: string): Promise<MidnightDAppConnector>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
}

interface MidnightDAppConnector {
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  getShieldedAddresses(): Promise<{
    shieldedAddress: string;
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  }>;
  submitTransaction(tx: unknown): Promise<unknown>;
  balanceUnsealedTransaction(tx: unknown): Promise<unknown>;
  proveTransaction(tx: unknown): Promise<unknown>;
  getConfiguration(): Promise<{
    indexerUri: string;
    indexerWsUri: string;
    substrateNodeUri: string;
    proofServerUri: string;
    networkId: string;
  }>;
}

interface MidnightNamespace {
  mnLace?: MidnightLaceAPI;
}

declare global {
  interface Window {
    midnight?: MidnightNamespace;
  }
}
