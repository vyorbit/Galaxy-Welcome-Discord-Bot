import { config } from 'dotenv';
import { ExtendedClient } from './structures/ExtendedClient';
import { GiveawayManager } from './managers/GiveawayManager';
import { initDatabase } from './database/db';
import chalk from 'chalk';

config();

const client = new ExtendedClient();

// Attach the giveaway manager before login so it's available in all commands
client.giveawayManager = new GiveawayManager(client);

async function init() {
    try {
        console.log(chalk.yellow('[Bot] Starting initialization...'));

        // Initialize SQLite (creates tables if they don't exist)
        initDatabase();

        // Load all event and command handlers
        await client.loadHandlers();

        // Connect to Discord
        await client.login(process.env.BOT_TOKEN);

        console.log(chalk.green('[Bot] Initialization complete.'));
    } catch (error) {
        console.error(chalk.red('[Bot ERROR] Initialization failed:'), error);
        process.exit(1);
    }
}

init();
