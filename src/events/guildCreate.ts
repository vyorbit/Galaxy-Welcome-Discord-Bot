import { Events, Guild } from 'discord.js';
import { Event } from '../structures/Event';
import { ensureGuild } from '../database/repositories/GuildRepo';
import chalk from 'chalk';

export default new Event({
    name: Events.GuildCreate,
    execute: (guild: Guild) => {
        try {
            // Pre-create the guild row so welcome/leave settings are ready immediately
            ensureGuild(guild.id);
            console.log(chalk.green(`[GuildCreate] Joined: ${guild.name} (${guild.id}) — ${guild.memberCount} members`));
        } catch (error) {
            console.error(chalk.red(`[GuildCreate] Failed to register guild ${guild.id}:`), error);
        }
    }
});
