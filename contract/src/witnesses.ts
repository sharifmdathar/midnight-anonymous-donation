// SPDX-License-Identifier: Apache-2.0
// Donation contract witnesses: provide recipient key and donation amount from private state.

import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/donation/contract/index.js";

export type DonationPrivateState = {
  recipientSecretKey: Uint8Array;
  donationAmount: bigint;
};

type DonationWitnessContext = WitnessContext<Ledger, DonationPrivateState> & {
  currentPrivateState: DonationPrivateState;
};

export const witnesses = {
  recipientSecretKey(
    context: DonationWitnessContext
  ): [DonationPrivateState, Uint8Array] {
    const ps =
      context.currentPrivateState ??
      (context as unknown as { privateState?: DonationPrivateState })
        .privateState;
    if (!ps)
      throw new Error(
        "recipientSecretKey witness: no private state in context"
      );
    return [ps, ps.recipientSecretKey];
  },
  donationAmount(
    context: DonationWitnessContext
  ): [DonationPrivateState, bigint] {
    const ps =
      context.currentPrivateState ??
      (context as unknown as { privateState?: DonationPrivateState })
        .privateState;
    if (!ps)
      throw new Error("donationAmount witness: no private state in context");
    return [ps, ps.donationAmount];
  }
};
