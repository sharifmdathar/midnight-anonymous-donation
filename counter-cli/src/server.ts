// SPDX-License-Identifier: Apache-2.0
// AnonymousDonation REST API server
// Minimal static imports so load-time errors surface in start().catch().

import type { DeployedDonationContract } from './common-types.js';
import type { Request, Response } from 'express';
import util from 'node:util';

const PORT = Number(process.env['PORT']) || 3001;

let api: typeof import('./api.js');
let config: InstanceType<typeof import('./config.js').StandaloneConfig>;
let logger: import('pino').Logger;
let walletCtx: import('./api.js').WalletContext | null = null;
let providers: Awaited<ReturnType<typeof import('./api.js').configureProviders>> | null = null;
let deployedContract: DeployedDonationContract | null = null;

async function start() {
  const [
    expressMod,
    { StandaloneConfig },
    apiMod,
    { toHex },
    { generateRandomSeed },
    { Buffer },
    crypto,
    { createLogger },
  ] = await Promise.all([
    import('express'),
    import('./config.js'),
    import('./api.js'),
    import('@midnight-ntwrk/midnight-js-utils'),
    import('@midnight-ntwrk/wallet-sdk-hd'),
    import('buffer'),
    import('node:crypto'),
    import('./logger-utils.js'),
  ]);
  const express = expressMod.default;
  api = apiMod;
  config = new StandaloneConfig();
  logger = await createLogger(config.logDir);
  api.setLogger(logger);

  const randomBytes = crypto.randomBytes.bind(crypto);

  const app = express();
  const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.options('*', (_req, res) => res.sendStatus(204));
  app.use(express.json());

  app.post('/wallet', async (req: Request, res: Response) => {
    try {
      const seed = (req.body as { seed?: string }).seed;
      const hexSeed = seed
        ? (seed.startsWith('0x') ? seed.slice(2) : seed).trim()
        : toHex(Buffer.from(generateRandomSeed()));
      walletCtx = await api.buildWalletAndWaitForFunds(config, hexSeed);
      providers = await api.configureProviders(walletCtx, config);
      const state = await api.waitForSync(walletCtx.wallet).then((s) => s);
      const unshieldedAddr = walletCtx.unshieldedKeystore.getBech32Address();
      res.json({
        ok: true,
        seed: hexSeed,
        unshieldedAddress: unshieldedAddr,
        message: 'Standalone: wait for sync and DUST from local chain. Poll GET /wallet until hasDust is true.',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get('/wallet', async (_req: Request, res: Response) => {
    if (!walletCtx) {
      return res.status(400).json({ ok: false, error: 'No wallet. POST /wallet with { seed?: string } first.' });
    }
    try {
      const dust = await api.getDustBalance(walletCtx.wallet);
      res.json({
        ok: true,
        unshieldedAddress: walletCtx.unshieldedKeystore.getBech32Address(),
        hasDust: dust.available > 0n,
        dustBalance: dust.available.toString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/campaign/deploy', async (_req: Request, res: Response) => {
    if (!providers || !walletCtx) {
      return res.status(400).json({ ok: false, error: 'Wallet not ready. POST /wallet first.' });
    }
    try {
      const recipientSk = new Uint8Array(randomBytes(32));
      const contract = await api.deploy(providers, {
        recipientSecretKey: recipientSk,
        donationAmount: 0n,
      });
      deployedContract = contract;
      res.json({
        ok: true,
        contractAddress: contract.deployTxData.public.contractAddress,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/campaign/join', async (req: Request, res: Response) => {
    if (!providers) {
      return res.status(400).json({ ok: false, error: 'Wallet not ready. POST /wallet first.' });
    }
    try {
      const { contractAddress } = req.body as { contractAddress: string };
      if (!contractAddress) {
        return res.status(400).json({ ok: false, error: 'Missing contractAddress' });
      }
      deployedContract = await api.joinContract(providers, contractAddress);
      res.json({
        ok: true,
        contractAddress: deployedContract.deployTxData.public.contractAddress,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/campaign/donate', async (req: Request, res: Response) => {
    const bodyAddr = (req.body as { contractAddress?: string }).contractAddress;
    const contract = bodyAddr
      ? await (async () => {
          if (!providers) return null;
          return await api.joinContract(providers, bodyAddr).catch(() => null);
        })()
      : deployedContract;
    if (!contract) {
      return res.status(400).json({ ok: false, error: 'No campaign. Join or deploy first, or send contractAddress in body.' });
    }
    const amount = BigInt((req.body as { amount?: string }).amount ?? 0);
    if (amount <= 0n) {
      return res.status(400).json({ ok: false, error: 'Invalid amount' });
    }
    try {
      const result = await api.donate(contract, amount);
      res.json({ ok: true, txId: result.txHash, blockHeight: result.blockHeight?.toString() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/campaign/withdraw', async (_req: Request, res: Response) => {
    if (!deployedContract) {
      return res.status(400).json({ ok: false, error: 'No campaign. Deploy or join first.' });
    }
    try {
      const result = await api.withdraw(deployedContract);
      res.json({ ok: true, txId: result.txHash, blockHeight: result.blockHeight?.toString() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.get('/campaign/:address', async (req: Request, res: Response) => {
    if (!providers) {
      return res.status(400).json({ ok: false, error: 'Wallet not ready.' });
    }
    const address = req.params['address'];
    if (!address) {
      return res.status(400).json({ ok: false, error: 'Missing address' });
    }
    try {
      const contract = await api.joinContract(providers, address).catch(() => null);
      if (!contract) {
        return res.status(404).json({ ok: false, error: 'Contract not found' });
      }
      const state = await api.displayCampaignState(providers, contract);
      res.json({
        ok: true,
        contractAddress: state.contractAddress,
        donationCount: state.donationCount?.toString() ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.listen(PORT, () => {
    console.log(`AnonymousDonation API on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('Fatal error:', msg);
  if (err instanceof Error && err.stack) console.error(err.stack);
  console.error('Error value:', util.inspect(err, { depth: 5 }));
  process.exit(1);
});
