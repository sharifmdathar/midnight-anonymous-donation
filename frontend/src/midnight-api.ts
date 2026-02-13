/**
 * Midnight DApp API for Anonymous Donations
 *
 * Handles contract deployment, discovery, and circuit calls
 * using the Lace wallet via the DApp connector API.
 */

export interface MidnightWalletAPI {
    getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
    getShieldedAddresses(): Promise<{
        shieldedAddress: string;
        shieldedCoinPublicKey: string;
        shieldedEncryptionPublicKey: string;
    }>;
    submitTransaction(tx: unknown): Promise<any>;
    balanceUnsealedTransaction(tx: unknown): Promise<any>;
    proveTransaction(tx: unknown): Promise<any>;
    getConfiguration(): Promise<any>;
}

export class DonationDAppAPI {
    private donationModule: any = null;
    private donationCompiledContract: any = null;
    private providers: any = null;
    private donationContract: any = null;
    private wallet: MidnightWalletAPI | null = null;
    private config: any = null;
    private nextDonationAmount: bigint = 0n;

    constructor() { }

    /** Initialize the API with the Lace wallet instance */
    async initialize(walletAPI: MidnightWalletAPI) {
        const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
        setNetworkId('undeployed');

        this.wallet = walletAPI;
        this.config = await walletAPI.getConfiguration();

        const { configureProviders } = await import('./providers');

        // Configure providers using the Echo-derived bridge
        this.providers = await configureProviders({
            config: {
                indexer: this.config.indexerUri,
                indexerWS: this.config.indexerWsUri,
                node: this.config.substrateNodeUri,
                // Use the Vite proxy with origin to satisfy new URL() parser
                proofServer: `${window.location.origin}/api/proof-server/`,
            },
            contractName: 'donation',
            wallet: walletAPI,
        });

        // Lazily load the compiled contract module
        if (!this.donationModule) {
            this.donationModule = await import(
                /* webpackIgnore: true */
                '../../contract/dist/managed/donation/contract/index.js'
            );
        }

        const { CompiledContract } = await import('@midnight-ntwrk/compact-js');

        // Build compiled contract with witnesses that inject donationAmount
        const self = this;

        // @ts-ignore
        this.donationCompiledContract = (
            CompiledContract.make('donation', this.donationModule.Contract) as any
        ).pipe(
            (c: any) =>
                (CompiledContract as any).withWitnesses(c, {
                    recipientSecretKey(context: any): [any, Uint8Array] {
                        const ps = context.currentPrivateState ?? context.privateState;
                        if (!ps)
                            throw new Error('recipientSecretKey witness: no private state in context');
                        return [ps, ps.recipientSecretKey];
                    },
                    donationAmount(context: any): [any, bigint] {
                        const ps = context.currentPrivateState ?? context.privateState;
                        if (!ps)
                            throw new Error('donationAmount witness: no private state in context');
                        // Use the injected amount if set, otherwise use stored state
                        const amount = self.nextDonationAmount > 0n ? self.nextDonationAmount : ps.donationAmount;
                        return [{ ...ps, donationAmount: amount }, amount];
                    },
                }),
            (c: any) => (CompiledContract as any).withCompiledFileAssets(c, '/'),
        );
    }

    /** Connect to an existing deployed contract */
    async findContract(contractAddress: string) {
        if (!this.providers) throw new Error('API not initialized');
        const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');

        try {
            this.donationContract = await findDeployedContract(this.providers, {
                compiledContract: this.donationCompiledContract,
                contractAddress: contractAddress.trim(),
                privateStateId: 'donationPrivateState',
                initialPrivateState: {
                    recipientSecretKey: new Uint8Array(32),
                    donationAmount: 0n,
                },
            } as any);
        } catch (e: any) {
            throw e;
        }
    }

    /** Deploy a new contract instance */
    async deployNewContract(recipientSecretKey?: Uint8Array): Promise<any> {
        if (!this.providers) throw new Error('API not initialized');
        const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');

        const sk = recipientSecretKey || crypto.getRandomValues(new Uint8Array(32));

        try {
            const deployed = await deployContract(this.providers, {
                args: [sk],
                privateStateId: 'donationPrivateState',
                compiledContract: this.donationCompiledContract,
                initialPrivateState: {
                    recipientSecretKey: sk,
                    donationAmount: 0n,
                },
            } as any);

            this.donationContract = deployed;

            return {
                contractAddress: deployed.deployTxData.public.contractAddress,
                txHash: deployed.deployTxData.public.txHash,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /** Call the donate circuit on the connected contract */
    async callDonate(amount: bigint): Promise<any> {
        if (!this.donationContract) throw new Error('No contract connected');

        this.nextDonationAmount = amount;
        try {
            // @ts-ignore
            const result = await this.donationContract.callTx.donate();

            const txHash =
                result.public?.txId || result.txHash || 'tx_completed';

            return {
                txHash,
                blockHeight: result.public?.blockHeight,
            };
        } finally {
            this.nextDonationAmount = 0n;
        }
    }

    /** Call the withdraw circuit on the connected contract */
    async callWithdraw(): Promise<any> {
        if (!this.donationContract) throw new Error('No contract connected');

        // @ts-ignore
        const result = await this.donationContract.callTx.withdraw();

        return {
            txHash: result.public?.txId || result.txHash || 'tx_completed',
            blockHeight: result.public?.blockHeight,
        };
    }

    /** Check if the API is initialized and has a connected contract */
    get isReady(): boolean {
        return this.providers !== null && this.donationContract !== null;
    }

    /** Check if the API is initialized (wallet connected) */
    get isInitialized(): boolean {
        return this.providers !== null;
    }
}
