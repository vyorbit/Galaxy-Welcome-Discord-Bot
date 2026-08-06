<!--
  Developed & Maintained by VY ORBIT (https://vyorbit.com)
  Internal ID: VYORBIT-DISCORD-WELCOMEPRO-V1
-->

<div align="center">

# 🚀 WelcomePro — Enterprise Discord Welcome & Utility Bot
*Powered by VY ORBIT*

[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg?logo=discord&logoColor=white)](https://discord.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**WelcomePro** is a production-grade, highly scalable public Discord bot designed to serve 10,000+ Discord servers simultaneously. Built with TypeScript, Discord.js v14, MongoDB Atlas, and a cluster/sharding architecture for maximum performance and zero downtime.

---

</div>

## 🌟 Key Features

- 🏠 **Discord-Based Dashboard (`/dashboard`)**: 100% configurable directly within Discord using interactive embeds, buttons, select menus, and modals — **No external website needed**.
- 👋 **Welcome System**: Custom messages, embed generator, variables support (`{user}`, `{server}`, `{membercount}`, etc.), and dynamic high-quality PNG welcome card generator.
- 🚪 **Leave System**: Configurable leave notifications and leave card rendering.
- 🎭 **Auto Roles**: Single, multiple, join roles, and delayed role assignment.
- 📢 **Announcement System**: Channel target, custom embeds, images, footers, buttons, and role mentions.
- 📊 **Poll System**: Single/Multiple choice, anonymous voting, timed auto-end, and real-time results.
- 🎉 **Giveaway System**: Multiple winners, bonus entries, role requirements, account age checks, and automatic rerolling.
- 📝 **Logging System**: Full audit logging for Member, Message, and Bot Admin actions.
- 👑 **Owner Control Panel**: Remote server configuration, global broadcast system, live performance stats, emergency controls, and user/server blacklisting.
- 💾 **Backup & Restore System**: Save and restore all server settings (`/backup create`, `/backup restore`).

---

## 🛠 Tech Stack & Architecture

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Core Library**: [Discord.js v14](https://discord.js.org/)
- **Clustering & Sharding**: [`discord-hybrid-sharding`](https://www.npmjs.com/package/discord-hybrid-sharding) for multi-process clustering
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Deployment Support**: Docker, PM2, Windows Batch, Linux VPS

---

## 📁 Repository Structure

```
Galaxy Welcome/
├── dist/                   # Compiled JavaScript files
├── src/
│   ├── commands/           # Modular Slash Commands
│   │   ├── owner/          # Owner-only administrative commands
│   │   └── utilities/      # General utility slash commands
│   ├── database/           # MongoDB connection handlers
│   ├── events/             # Discord event listeners (ready, interactionCreate, etc.)
│   ├── models/             # Mongoose schemas (GuildSettings, WelcomeSettings, etc.)
│   ├── structures/         # Extended Client & Command interfaces
│   ├── bot.ts              # Cluster worker entry point
│   └── index.ts            # Sharding & Cluster Manager entry point
├── .env.example            # Environment variables template
├── package.json            # Dependencies & scripts
├── start.bat               # One-click Windows startup script
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Quick Start & Installation

### Prerequisites

- [Node.js v18+](https://nodejs.org/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI
- A Discord Application with a Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/WelcomePro.git
   cd WelcomePro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your secret keys:
   ```env
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   OWNER_ID=your_discord_user_id
   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/welcomepro
   ```

4. **Build & Run the Bot**

   - **Windows (One-Click)**:
     Double-click `start.bat` or run:
     ```cmd
     start.bat
     ```

   - **Manual (Development)**:
     ```bash
     npm run dev
     ```

   - **Manual (Production Build)**:
     ```bash
     npm run build
     npm run start
     ```

---

## 📜 Commands Overview

| Command | Category | Permission | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Settings | Administrator | Interactive panel to manage all server settings |
| `/welcome setup` | Welcome | Administrator | Configure welcome channel, messages, and cards |
| `/leave setup` | Leave | Administrator | Configure leave notifications |
| `/autorole add` | AutoRole | Administrator | Set up automatic role assignment for new members |
| `/poll create` | Polls | Administrator | Start a new single/multiple choice poll |
| `/giveaway create` | Giveaways | Administrator | Launch a giveaway with custom entry rules |
| `/announce` | Announcements | Administrator | Create and schedule custom embed announcements |
| `/backup create` | Backup | Administrator | Create a restore point of all server settings |
| `/ping` | Utility | Everyone | Check bot and Discord API latency |
| `/owner-servers` | Owner | Bot Owner | View global server statistics across all shards |

---

## 🛡 Security & Best Practices

- **Token Protection**: All sensitive tokens and URIs are loaded exclusively from `.env`. Never commit your `.env` file to source control.
- **Isolated Server Data**: Server settings are completely isolated per Guild ID in MongoDB Atlas to ensure security and prevent data corruption during bot updates.
- **Permission Checking**: Commands strictly validate Discord permission flags before executing administrative actions.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
Developed with ❤️ for large Discord communities.
</div>
