# 🌌 Galaxy Welcome — Features

> A free, modular Discord welcome bot built with **TypeScript** + **Discord.js v14**
> Uses **SQLite** (via `better-sqlite3`) for persistent multi-server settings — no paid services, no cloud required.

---

## 📋 Table of Contents

- [Slash Commands](#-slash-commands)
- [Events](#-events)
- [Database](#-database)
- [Sharding & Clustering](#-sharding--clustering)
- [System Architecture](#-system-architecture)
- [Developer Features](#-developer-features)
- [Configuration](#-configuration)
- [Tech Stack](#-tech-stack)

---

## ⚡ Slash Commands

### 🛠️ Utilities

| Command | Description | Permission |
|---------|-------------|------------|
| `/ping` | Bot + API latency with color-coded response | Everyone |
| `/serverinfo` | Server stats + welcome/leave configuration from DB | Everyone |

#### `/ping`
- 🟢 Green = under `100ms` · 🟡 Orange = `100–249ms` · 🔴 Red = `250ms+`
- Shows **Bot Latency** and **WebSocket API Latency**

#### `/serverinfo`
- Server name, owner, member count, creation date
- Live welcome/leave status and configured channels pulled from SQLite
- Works per-server — each server sees only its own data

---

### 🎛️ Admin (Requires `Manage Server`)

#### `/welcome` — 8 subcommands

| Subcommand | Description |
|------------|-------------|
| `/welcome setup <channel>` | Set the channel for welcome messages (auto-enables) |
| `/welcome message <text>` | Set the welcome message text |
| `/welcome color <hex>` | Set the embed hex color (e.g. `#5865F2`) |
| `/welcome embed <true/false>` | Toggle embed vs plain text mode |
| `/welcome toggle <true/false>` | Enable or disable welcome messages |
| `/welcome test` | Preview the welcome message in the current channel |
| `/welcome view` | View full current configuration |
| `/welcome reset` | Reset all settings back to defaults |

**Placeholders for welcome message:** `{mention}` `{user}` `{server}` `{count}`

---

#### `/leave` — 8 subcommands

| Subcommand | Description |
|------------|-------------|
| `/leave setup <channel>` | Set the channel for leave messages (auto-enables) |
| `/leave message <text>` | Set the leave message text |
| `/leave color <hex>` | Set the embed hex color (e.g. `#ED4245`) |
| `/leave embed <true/false>` | Toggle embed vs plain text mode |
| `/leave toggle <true/false>` | Enable or disable leave messages |
| `/leave test` | Preview the leave message in the current channel |
| `/leave view` | View full current configuration |
| `/leave reset` | Reset all settings back to defaults |

**Placeholders for leave message:** `{user}` `{server}` `{count}`

---

### 👑 Owner Only

| Command | Description |
|---------|-------------|
| `/owner-servers` | Lists all servers across every cluster with member counts |

- Protected by `OWNER_ID` env var
- Uses `broadcastEval` to query all shards simultaneously
- Displays up to 20 servers + overflow count, shows totals

---

## 📡 Events

| Event | Trigger | What It Does |
|-------|---------|--------------|
| `ClientReady` | Bot comes online | Registers all slash commands globally via REST |
| `InteractionCreate` | Slash command used | Routes to command handler, logs usage, handles errors |
| `GuildMemberAdd` | User joins server | Reads welcome settings from DB → sends configured message |
| `GuildMemberRemove` | User leaves server | Reads leave settings from DB → sends configured message |

### GuildMemberAdd
- Looks up `welcome_settings` row for the guild
- Skips silently if disabled or no channel set
- Resolves placeholders, then sends embed or plain text based on config
- Avatar thumbnail included in embed mode

### GuildMemberRemove
- Handles both full and **partial** members (important for large servers)
- Looks up `leave_settings` row for the guild
- Footer shows updated member count after the user left

---

## 🗄️ Database

**Engine:** SQLite via [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3)
**Location:** `./data/galaxy.db` (auto-created on first start)
**Cost:** 100% free — file-based, no server, no account, no internet connection needed

### Tables

#### `guild_settings`
Parent table — one row per server. All other tables cascade-delete when a guild is removed.

| Column | Type | Description |
|--------|------|-------------|
| `guild_id` | TEXT PK | Discord server ID |
| `created_at` | INTEGER | Unix timestamp |
| `updated_at` | INTEGER | Unix timestamp |

#### `welcome_settings`
Per-guild welcome message configuration.

| Column | Type | Default |
|--------|------|---------|
| `guild_id` | TEXT PK | — |
| `enabled` | INTEGER | `0` (disabled) |
| `channel_id` | TEXT | `NULL` |
| `message` | TEXT | `Welcome {mention} to **{server}**! You are member #{count}.` |
| `embed_enabled` | INTEGER | `1` (enabled) |
| `embed_color` | TEXT | `#5865F2` |

#### `leave_settings`
Per-guild leave message configuration.

| Column | Type | Default |
|--------|------|---------|
| `guild_id` | TEXT PK | — |
| `enabled` | INTEGER | `0` (disabled) |
| `channel_id` | TEXT | `NULL` |
| `message` | TEXT | `**{user}** has left **{server}**. We now have {count} members.` |
| `embed_enabled` | INTEGER | `1` (enabled) |
| `embed_color` | TEXT | `#ED4245` |

### Performance Settings
- **WAL mode** enabled — better concurrent read performance
- **Foreign keys** enforced — cascade deletes keep data clean
- All reads/writes are synchronous (no async overhead for DB calls)
- `INSERT OR IGNORE` / `ON CONFLICT DO UPDATE` (upsert) pattern — no pre-check queries needed

---

## 🔀 Sharding & Clustering

Built with [`discord-hybrid-sharding`](https://www.npmjs.com/package/discord-hybrid-sharding):

| Feature | Detail |
|---------|--------|
| **Auto Sharding** | `totalShards: 'auto'` — Discord decides the right number |
| **Cluster Mode** | `mode: 'process'` — each cluster is a separate process |
| **Shards per Cluster** | 2 shards per cluster |
| **Cross-cluster Eval** | `/owner-servers` uses `broadcastEval` across all clusters |
| **Spawn Timeout** | `-1` (unlimited) |

---

## 🏗️ System Architecture

```
src/
├── index.ts                        # Entry point — ClusterManager
├── bot.ts                          # Bot process — DB init, handlers, login
├── structures/
│   ├── ExtendedClient.ts           # Custom Client with auto-loading handlers
│   ├── Command.ts                  # Command class (typed)
│   └── Event.ts                   # Event class (typed)
├── database/
│   ├── db.ts                       # SQLite connection + initDatabase()
│   ├── tables.ts                   # CREATE TABLE IF NOT EXISTS statements
│   └── repositories/
│       ├── GuildRepo.ts            # guild_settings CRUD
│       ├── WelcomeRepo.ts          # welcome_settings CRUD + placeholder resolver
│       └── LeaveRepo.ts            # leave_settings CRUD + placeholder resolver
├── events/
│   ├── ready.ts                    # ClientReady — slash command registration
│   ├── interactionCreate.ts        # Slash command router
│   ├── guildMemberAdd.ts           # Welcome message trigger
│   └── guildMemberRemove.ts        # Leave message trigger
└── commands/
    ├── admin/
    │   ├── welcome.ts              # /welcome (8 subcommands)
    │   └── leave.ts               # /leave (8 subcommands)
    ├── utilities/
    │   ├── ping.ts                 # /ping
    │   └── serverinfo.ts          # /serverinfo
    └── owner/
        └── servers.ts              # /owner-servers
data/
└── galaxy.db                       # SQLite database (auto-created, gitignored)
```

---

## 🧑‍💻 Developer Features

| Feature | Detail |
|---------|--------|
| **TypeScript strict** | All code fully typed, strict mode on |
| **Auto-loading** | Drop a file in `commands/` or `events/` → auto-discovered |
| **Hot Reload Dev** | `npm run dev` — nodemon watches `.ts` files |
| **Build** | `npm run build` → compiles to `dist/` |
| **One-click Start** | `start.bat` — compiles + runs on Windows |
| **Chalk Logging** | Color-coded logs for all events and errors |
| **Safe error handling** | All events/commands wrapped in try/catch with reply guards |
| **SQLite upsert** | `INSERT OR CONFLICT DO UPDATE` — no duplicate checks needed |
| **Zero paid services** | No MongoDB, Redis, external APIs, or cloud accounts |

---

## ⚙️ Configuration

Only **3 required** environment variables:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
OWNER_ID=your_user_id_here

# Optional: override DB file location
# DB_PATH=./data/galaxy.db
```

| Variable | Where to find it |
|----------|-----------------|
| `BOT_TOKEN` | [discord.com/developers](https://discord.com/developers/applications) → App → Bot → Token |
| `CLIENT_ID` | Same page → General Information → Application ID |
| `OWNER_ID` | Discord → Settings → Advanced → Developer Mode → Right-click name → Copy ID |

---

## 🧰 Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `discord.js` | `^14.15.2` | Core Discord API |
| `discord-hybrid-sharding` | `^2.1.3` | Multi-process clustering |
| `better-sqlite3` | `^9.4.3` | SQLite database (free, file-based) |
| `dotenv` | `^16.4.5` | Env variable loading |
| `chalk` | `^4.1.2` | Terminal color output |
| `typescript` | `^5.4.5` | Type-safe JavaScript |
| `ts-node` | `^10.9.2` | Run TS directly (dev) |
| `nodemon` | `^3.1.0` | Auto-restart on changes (dev) |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
copy .env.example .env
# Fill in BOT_TOKEN, CLIENT_ID, OWNER_ID

# 3a. Development (auto-reload)
npm run dev

# 3b. Production (build + run)
start.bat
```

The `data/galaxy.db` file is created automatically on first start. No setup needed.

---

## 📌 Notes

- **Slash commands are globally registered** — propagation can take up to 1 hour on Discord. For instant dev updates, change `Routes.applicationCommands(clientId)` to `Routes.applicationGuildCommands(clientId, guildId)` in `ready.ts`.
- **DB is per-process** — in a sharded/clustered setup, each cluster shares the same `galaxy.db` file on disk (SQLite WAL mode handles this safely).
- **New commands**: create a `.ts` file anywhere under `src/commands/` — it auto-loads.
- **New events**: create a `.ts` file anywhere under `src/events/` — it auto-loads.

---

*Last updated: July 2026*
