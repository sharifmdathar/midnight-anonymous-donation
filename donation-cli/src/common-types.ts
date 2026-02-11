// SPDX-License-Identifier: Apache-2.0

import { Donation, type DonationPrivateState } from 'anonymous-donation-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';

export type DonationCircuits = ImpureCircuitId<Donation.Contract<DonationPrivateState>>;

export const DonationPrivateStateId = 'donationPrivateState' as const;

export type DonationProviders = MidnightProviders<
  DonationCircuits,
  typeof DonationPrivateStateId,
  DonationPrivateState
>;

export type DonationContract = Donation.Contract<DonationPrivateState>;

export type DeployedDonationContract =
  | DeployedContract<DonationContract>
  | FoundContract<DonationContract>;
