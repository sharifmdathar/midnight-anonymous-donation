# AnonymousDonation

[![Compact Compiler 0.28.0](https://img.shields.io/badge/Compact%20Compiler-0.28.0-1abc9c.svg)](https://shields.io/)

A Midnight DApp for **private donations**: donors give with confidential amounts; only the campaign recipient can withdraw. Donation amounts and wallet balances stay private on-chain.

## Project structure

```
├── contract/                    # Smart contract (Compact)
│   ├── src/donation.compact     # Donation contract (donate, withdraw)
│   └── src/managed/donation/    # Generated (run npm run compact)
├── counter-cli/                 # CLI and REST API
│   ├── src/cli.ts               # Interactive CLI (deploy, join, donate, withdraw)
│   ├── src/server.ts            # Express API for the frontend
│   └── proof-server.yml         # Proof server Docker (Preprod/Preview)
└── frontend/                    # React + Vite web UI
    └── src/                     # Pages: wallet, create campaign, campaign, donate
```

## Prerequisites

- **Node.js** v22.15+
- **Docker** (for proof server)
- **Compact compiler** v0.28.0 (see below)

### Compact compiler

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.4.0/compact-installer.sh | sh
source $HOME/.local/bin/env
compact update 0.28.0
compact --version   # expect compact 0.4.0
```

## Quick start

### 1. Install and build

```bash
npm install
cd contract && npm run compact && npm run build && npm run test && cd ..
```

(First `compact` run may download ZK parameters and generate ZK keys under `contract/src/managed/donation/keys/`.)

**Before first deploy:** run preflight tests so deploy does not fail with witness or ZK config errors:

```bash
cd counter-cli && npm run preflight
```

If tests report missing verifier keys, run `cd contract && npm run compact` (without `--skip-zk`) and ensure `contract/src/managed/donation/keys/` contains `donation#donate.verifier` and `donation#withdraw.verifier`. If the compiler produced `donate.verifier` / `withdraw.verifier` instead, copy or symlink them with the `donation#` prefix.

### 2. Run the CLI (Preprod)

Start the proof server and CLI:

```bash
cd counter-cli
npm run preprod-ps
```

Then: create or restore a wallet, fund with tNight from the [Preprod faucet](https://faucet.preprod.midnight.network), wait for DUST, then:

- **Deploy campaign** (as recipient) — get a contract address to share.
- **Join campaign** (as donor) — enter a campaign address.
- **Donate** — enter a private amount (only the count is public).
- **Withdraw** — recipient only.

### 3. Run the web app (standalone, local only)

The API server uses **standalone** config (local node, indexer, proof server). Start the full local stack first, then the API and frontend.

**Terminal 1 — local stack (node + indexer + proof server):**

```bash
cd counter-cli
docker compose -f standalone.yml up
```

Wait until containers are healthy.

**Terminal 2 — API server:**

```bash
cd counter-cli
npm run server   # uses Bun; or: npx tsx src/server.ts with Node
```

API runs at `http://localhost:3001`.

**Terminal 3 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Create or restore a wallet; the local chain will sync and DUST will appear. Then create a campaign, or open one by address, and donate or withdraw.

Optional: set `VITE_API_URL=http://localhost:3001` in `frontend/.env` if the API is on another host.

## API (counter-cli server)

| Method | Path | Description |
|--------|------|-------------|
| POST | /wallet | Create or restore wallet (body: `{ seed?: string }`) |
| GET | /wallet | Wallet status, unshielded address, DUST |
| POST | /campaign/deploy | Deploy a campaign (recipient = current wallet) |
| POST | /campaign/join | Join campaign (body: `{ contractAddress }`) |
| POST | /campaign/donate | Donate (body: `{ amount, contractAddress? }`) |
| POST | /campaign/withdraw | Withdraw (recipient only) |
| GET | /campaign/:address | Public state (donation count) |

## Networks

| Network | Command (CLI) |
|---------|----------------|
| **Preprod** | `npm run preprod-ps` (counter-cli) |
| **Preview** | `npm run preview-ps` |
| **Standalone** (local) | `npm run standalone` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server stuck on &quot;Syncing with network&quot; / `Failed to connect ws://127.0.0.1:9944` | You're on standalone config; start the local stack first: **Terminal 1** run `cd counter-cli && docker compose -f standalone.yml up`, wait for healthy, then start the API server. |
| `compact: command not found` | `source $HOME/.local/bin/env` |
| `connect ECONNREFUSED 127.0.0.1:6300` | Start proof server: `cd counter-cli && docker compose -f proof-server.yml up` |
| Port 6300 not bound after 60s (preprod-ps) | Proof server may be slow; wait is now 120s. Or run proof server manually in one terminal (`docker compose -f proof-server.yml up`), then `npm run preprod` (no `-ps`) in another. |
| No DUST / deploy fails | Fund with tNight from faucet, wait for DUST generation (see CLI output). |
| Frontend cannot reach API | Ensure API runs on port 3001; set `VITE_API_URL` if different. |

## Links

- [Preprod Faucet](https://faucet.preprod.midnight.network)
- [Midnight Docs](https://docs.midnight.network/)
- [Compact language](https://docs.midnight.network/develop/reference/compact)
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) — Preprod and SDK notes
