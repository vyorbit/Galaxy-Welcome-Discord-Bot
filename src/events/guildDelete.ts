import { Events, Guild } from 'discord.js';
import { Event } from '../structures/Event';
import { deleteGuild } from '../database/repositories/GuildRepo';
import chalk from 'chalk';

export default new Event({
    name: Events.GuildDelete,
    execute: (guild: Guild) => {
        try {
            // Remove all guild data from DB when bot is kicked/banned/server deleted
            // Cascade delete removes welcome_settings and leave_settings automatically
            deleteGuild(guild.id);
            console.log(chalk.yellow(`[GuildDelete] Left/removed from: ${guild.name} (${guild.id}) — DB cleaned up`));
        } catch (error) {
            console.error(chalk.red(`[GuildDelete] Failed to clean up guild ${guild.id}:`), error);
        }
    }
});
