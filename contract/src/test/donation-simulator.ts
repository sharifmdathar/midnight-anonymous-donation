// SPDX-License-Identifier: Apache-2.0

import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/donation/contract/index.js";
import { type DonationPrivateState, witnesses } from "../witnesses.js";

function randomBytes32(): Uint8Array {
  const arr = new Uint8Array(32);
  for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

export class DonationSimulator {
  readonly contract: Contract<DonationPrivateState>;
  circuitContext: CircuitContext<DonationPrivateState>;
  readonly recipientSk: Uint8Array;

  constructor(recipientSk?: Uint8Array) {
    this.recipientSk = recipientSk ?? randomBytes32();
    this.contract = new Contract<DonationPrivateState>(witnesses);
    const initialPrivateState: DonationPrivateState = {
      recipientSecretKey: this.recipientSk,
      donationAmount: 0n,
    };
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(initialPrivateState, "0".repeat(64)),
      this.recipientSk,
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): DonationPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public donate(amount: bigint): Ledger {
    this.circuitContext.currentPrivateState = {
      ...this.circuitContext.currentPrivateState,
      donationAmount: amount,
    };
    this.circuitContext = this.contract.impureCircuits.donate(this.circuitContext).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public withdraw(): Ledger {
    this.circuitContext = this.contract.impureCircuits.withdraw(this.circuitContext).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
