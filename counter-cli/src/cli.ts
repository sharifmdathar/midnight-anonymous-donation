// SPDX-License-Identifier: Apache-2.0
// AnonymousDonation CLI

import { type WalletContext } from './api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type StartedDockerComposeEnvironment, type DockerComposeEnvironment } from 'testcontainers';
import { type DonationProviders, type DeployedDonationContract } from './common-types';
import { type Config, StandaloneConfig } from './config';
import * as api from './api';
import { randomBytes } from 'node:crypto';

let logger: Logger;

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              AnonymousDonation                               ║
║              ─────────────────                               ║
║              Private donations on Midnight                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

const DIVIDER = '──────────────────────────────────────────────────────────────';

const WALLET_MENU = `
${DIVIDER}
  Wallet Setup
${DIVIDER}
  [1] Create a new wallet
  [2] Restore wallet from seed
  [3] Exit
${'─'.repeat(62)}
> `;

const contractMenu = (dustBalance: string) => `
${DIVIDER}
  Campaign Actions${dustBalance ? `                    DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Deploy a new campaign (as recipient)
  [2] Join an existing campaign (as donor)
  [3] Monitor DUST balance
  [4] Exit
${'─'.repeat(62)}
> `;

const campaignMenu = (dustBalance: string) => `
${DIVIDER}
  Campaign${dustBalance ? `                             DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Donate (private amount)
  [2] Withdraw (recipient only)
  [3] Show donation count
  [4] Exit
${'─'.repeat(62)}
> `;

const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<WalletContext> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await api.buildWalletAndWaitForFunds(config, seed);
};

const buildWallet = async (config: Config, rli: Interface): Promise<WalletContext | null> => {
  if (config instanceof StandaloneConfig) {
    return await api.buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED);
  }
  while (true) {
    const choice = await rli.question(WALLET_MENU);
    switch (choice.trim()) {
      case '1':
        return await api.buildFreshWallet(config);
      case '2':
        return await buildWalletFromSeed(config, rli);
      case '3':
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const getDustLabel = async (wallet: api.WalletContext['wallet']): Promise<string> => {
  try {
    const dust = await api.getDustBalance(wallet);
    return dust.available.toLocaleString();
  } catch {
    return '';
  }
};

const joinCampaign = async (providers: DonationProviders, rli: Interface): Promise<DeployedDonationContract> => {
  const contractAddress = await rli.question('Enter the campaign contract address (hex): ');
  return await api.joinContract(providers, contractAddress);
};

const startDustMonitor = async (wallet: api.WalletContext['wallet'], rli: Interface): Promise<void> => {
  console.log('');
  const stopPromise = rli.question('  Press Enter to return to menu...\n').then(() => {});
  await api.monitorDustBalance(wallet, stopPromise);
  console.log('');
};

const deployOrJoin = async (
  providers: DonationProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<DeployedDonationContract | null> => {
  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(contractMenu(dustLabel));
    switch (choice.trim()) {
      case '1': {
        try {
          const recipientSk = new Uint8Array(randomBytes(32));
          const contract = await api.withStatus('Deploying campaign', () =>
            api.deploy(providers, { recipientSecretKey: recipientSk, donationAmount: 0n }),
          );
          console.log(`  Campaign deployed at: ${contract.deployTxData.public.contractAddress}`);
          console.log('  Save this address to share with donors. Only you (recipient) can withdraw.\n');
          return contract;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`\n  ✗ Deploy failed: ${msg}`);
          if (e instanceof Error && e.cause) {
            let cause: unknown = e.cause;
            let depth = 0;
            while (cause && depth < 5) {
              const causeMsg =
                cause instanceof Error
                  ? `${cause.message}\n      ${cause.stack?.split('\n').slice(1, 3).join('\n      ') ?? ''}`
                  : String(cause);
              console.log(`    cause: ${causeMsg}`);
              cause = cause instanceof Error ? cause.cause : undefined;
              depth++;
            }
          }
          if (msg.toLowerCase().includes('dust') || msg.toLowerCase().includes('no dust')) {
            console.log('    Insufficient DUST. Use option [3] to monitor your balance.');
          }
          console.log('');
        }
        break;
      }
      case '2':
        try {
          return await joinCampaign(providers, rli);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Failed to join campaign: ${msg}\n`);
        }
        break;
      case '3':
        await startDustMonitor(walletCtx.wallet, rli);
        break;
      case '4':
        return null;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

const mainLoop = async (providers: DonationProviders, walletCtx: api.WalletContext, rli: Interface): Promise<void> => {
  const donationContract = await deployOrJoin(providers, walletCtx, rli);
  if (donationContract === null) {
    return;
  }

  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(campaignMenu(dustLabel));
    switch (choice.trim()) {
      case '1': {
        try {
          const amountStr = await rli.question('Donation amount (e.g. 100): ');
          const amount = BigInt(amountStr.trim() || '0');
          if (amount <= 0n) {
            console.log('  Enter a positive amount.\n');
            break;
          }
          await api.withStatus('Donating', () => api.donate(donationContract, amount));
          console.log('  Donation submitted.\n');
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Donate failed: ${msg}\n`);
        }
        break;
      }
      case '2':
        try {
          await api.withStatus('Withdrawing', () => api.withdraw(donationContract));
          console.log('  Withdraw submitted.\n');
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Withdraw failed: ${msg}\n`);
        }
        break;
      case '3':
        await api.displayCampaignState(providers, donationContract);
        break;
      case '4':
        return;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = getComposeContainer(env, containerName);
  mappedUrl.port = String(container.getFirstMappedPort());
  return mappedUrl.toString().replace(/\/+$/, '');
};

/** Resolve compose container by service name; testcontainers keys are often "service_1". */
function getComposeContainer(env: StartedDockerComposeEnvironment, serviceName: string): ReturnType<StartedDockerComposeEnvironment['getContainer']> {
  for (const name of [serviceName, `${serviceName}_1`, `${serviceName}-1`]) {
    try {
      return env.getContainer(name);
    } catch {
      continue;
    }
  }
  throw new Error(`Cannot get container for service "${serviceName}"`);
}

export const run = async (config: Config, _logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  logger = _logger;
  api.setLogger(_logger);

  console.log(BANNER);

  const rli = createInterface({ input, output, terminal: true });
  let env: StartedDockerComposeEnvironment | undefined;

  try {
    if (dockerEnv !== undefined) {
      env = await dockerEnv.up();
      if (config instanceof StandaloneConfig) {
        config.indexer = mapContainerPort(env, config.indexer, 'counter-indexer');
        config.indexerWS = mapContainerPort(env, config.indexerWS, 'counter-indexer');
        config.node = mapContainerPort(env, config.node, 'counter-node');
        config.proofServer = mapContainerPort(env, config.proofServer, 'counter-proof-server');
      } else {
        // proof-server-only compose (preprod-ps) uses service name 'proof-server'
        (config as { proofServer: string }).proofServer = mapContainerPort(env, config.proofServer, 'proof-server');
      }
    }

    const walletCtx = await buildWallet(config, rli);
    if (walletCtx === null) {
      return;
    }

    try {
      const providers = await api.withStatus('Configuring providers', () => api.configureProviders(walletCtx, config));
      console.log('');
      await mainLoop(providers, walletCtx, rli);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Error: ${e.message}`);
        logger.debug(`${e.stack}`);
      } else {
        throw e;
      }
    } finally {
      try {
        await walletCtx.wallet.stop();
      } catch (e) {
        logger.error(`Error stopping wallet: ${e}`);
      }
    }
  } finally {
    rli.close();
    rli.removeAllListeners();
    if (env !== undefined) {
      try {
        await env.down();
      } catch (e) {
        logger.error(`Error shutting down docker environment: ${e}`);
      }
    }
    logger.info('Goodbye.');
  }
};
