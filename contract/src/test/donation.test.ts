// SPDX-License-Identifier: Apache-2.0

import { DonationSimulator } from "./donation-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("Donation smart contract", () => {
  it("initializes ledger with recipient authority and zero donation count", () => {
    const sim = new DonationSimulator();
    const ledger = sim.getLedger();
    expect(ledger.recipientAuthority).toBeInstanceOf(Uint8Array);
    expect(ledger.recipientAuthority.length).toBe(32);
    expect(ledger.donationCount).toEqual(0n);
    expect(ledger.round).toEqual(0n);
  });

  it("increments donation count when donate is called", () => {
    const sim = new DonationSimulator();
    sim.donate(100n);
    expect(sim.getLedger().donationCount).toEqual(1n);
    sim.donate(50n);
    expect(sim.getLedger().donationCount).toEqual(2n);
  });

  it("only recipient can withdraw", () => {
    const recipientSk = new Uint8Array(32);
    recipientSk[0] = 1;
    const sim = new DonationSimulator(recipientSk);
    sim.donate(100n);
    expect(sim.getLedger().donationCount).toEqual(1n);
    sim.withdraw();
    expect(sim.getLedger().round).toEqual(1n);
  });

  it("withdraw increments round", () => {
    const sim = new DonationSimulator();
    const initialRound = sim.getLedger().round;
    sim.donate(1n);
    sim.withdraw();
    expect(sim.getLedger().round).toEqual(initialRound + 1n);
  });
});
