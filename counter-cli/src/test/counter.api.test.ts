// SPDX-License-Identifier: Apache-2.0

import { type WalletContext } from '../api';
import path from 'path';
import * as api from '../api';
import { type DonationProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomBytes } from 'node:crypto';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('Donation API', () => {
  let testEnvironment: TestEnvironment;
  let walletCtx: WalletContext;
  let providers: DonationProviders;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      walletCtx = await testEnvironment.getWallet();
      providers = await api.configureProviders(walletCtx, testConfiguration.dappConfig);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  it('should deploy campaign, donate, and show count [@slow]', async () => {
    const recipientSk = new Uint8Array(randomBytes(32));
    const donationContract = await api.deploy(providers, {
      recipientSecretKey: recipientSk,
      donationAmount: 0n,
    });
    expect(donationContract).not.toBeNull();

    const state = await api.displayCampaignState(providers, donationContract);
    expect(state.donationCount).toEqual(BigInt(0));

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await api.donate(donationContract, 1n);
    expect(response.txHash).toMatch(/[0-9a-f]{64}/);
    expect(response.blockHeight).toBeGreaterThan(BigInt(0));

    const stateAfter = await api.displayCampaignState(providers, donationContract);
    expect(stateAfter.donationCount).toEqual(BigInt(1));
    expect(stateAfter.contractAddress).toEqual(state.contractAddress);
  });
});
