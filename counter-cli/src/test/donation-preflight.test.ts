// SPDX-License-Identifier: Apache-2.0
// Fast pre-deploy checks: catch witness and ZK config errors before running deploy.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Donation, witnesses } from '@midnight-ntwrk/donation-contract';
import { contractConfig } from '../config';

const CONTRACT_TAG = 'donation';
const REQUIRED_CIRCUITS = ['donate', 'withdraw'] as const;

describe('Donation contract pre-deploy preflight', () => {
  describe('witnesses shape', () => {
    it('exposes recipientSecretKey as a function', () => {
      expect(witnesses).toBeDefined();
      expect(typeof witnesses.recipientSecretKey).toBe('function');
    });

    it('exposes donationAmount as a function', () => {
      expect(typeof witnesses.donationAmount).toBe('function');
    });

    it('Contract constructor accepts witnesses (no vacant-witness error)', () => {
      expect(() => new Donation.Contract(witnesses)).not.toThrow();
    });

    it('Contract constructor throws if given empty object (vacant)', () => {
      expect(() => new Donation.Contract({})).toThrow(/function-valued field named recipientSecretKey/);
    });
  });

  describe('ZK config and keys', () => {
    const zkDir = contractConfig.zkConfigPath;
    const keysDir = path.join(zkDir, 'keys');

    it('zkConfigPath directory exists', async () => {
      await expect(fs.access(zkDir)).resolves.toBeUndefined();
    });

    it('keys directory exists (run: cd contract && npm run compact && npm run build)', async () => {
      try {
        await fs.access(keysDir);
      } catch (e) {
        throw new Error(
          `ZK keys directory missing: ${keysDir}. Run: cd contract && npm run compact && npm run build (compact generates keys/).`,
        );
      }
    });

    for (const circuit of REQUIRED_CIRCUITS) {
      const circuitId = `${CONTRACT_TAG}#${circuit}`;
      const verifierPath = path.join(keysDir, `${circuitId}.verifier`);
      const altVerifierPath = path.join(keysDir, `${circuit}.verifier`);

      it(`verifier key exists for ${circuitId}`, async () => {
        try {
          await fs.access(verifierPath);
          return;
        } catch {
          // Compiler outputs donate.verifier / withdraw.verifier; runtime expects donation#donate.verifier
          try {
            await fs.access(altVerifierPath);
            await fs.symlink(path.basename(altVerifierPath), verifierPath);
            return;
          } catch (altErr) {
            throw new Error(
              `Verifier key missing for ${circuitId}. Expected ${verifierPath} or ${altVerifierPath}. Run: cd contract && npm run compact (do not use --skip-zk).`,
            );
          }
        }
      }, 5000);
    }
  });
});
