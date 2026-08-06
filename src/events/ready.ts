import { Events, Client, REST, Routes } from 'discord.js';
import { Event } from '../structures/Event';
import { ExtendedClient } from '../structures/ExtendedClient';
import chalk from 'chalk';

export default new Event({
    name: Events.ClientReady,
    once: true,
    execute: async (client: Client) => {
        const extClient = client as ExtendedClient;
        console.log(chalk.green(`[Ready] Logged in as ${client.user?.tag} (${client.user?.id})`));
        console.log(chalk.green(`[Ready] Serving ${client.guilds.cache.size} guild(s) on this shard`));

        // Initialize giveaway timers from database on startup
        extClient.giveawayManager.initialize();

        // Only register slash commands from cluster 0 / shard 0
        // to avoid duplicate registrations across shards
        const isLeadShard = extClient.cluster?.id === 0;
        if (!isLeadShard) {
            console.log(chalk.gray(`[Ready] Skipping command registration (not lead cluster)`));
            return;
        }

        const token    = process.env.BOT_TOKEN;
        const clientId = process.env.CLIENT_ID;

        if (!token || !clientId) {
            console.warn(chalk.yellow('[Ready] BOT_TOKEN or CLIENT_ID missing — skipping slash command registration.'));
            return;
        }

        try {
            const rest = new REST({ version: '10' }).setToken(token);
            const commandData = [...extClient.commands.values()].map(cmd => cmd.data.toJSON());

            console.log(chalk.blue(`[Ready] Registering ${commandData.length} slash command(s) globally...`));

            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commandData }
            );

            console.log(chalk.green(`[Ready] Successfully registered ${commandData.length} slash command(s).`));
        } catch (error) {
            console.error(chalk.red('[Ready] Failed to register slash commands:'), error);
        }
    }
});
