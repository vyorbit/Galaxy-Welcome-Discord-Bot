import { db } from '../db';

export interface GuildRow {
    guild_id: string;
    created_at: number;
    updated_at: number;
}

/**
 * Ensures a guild row exists in guild_settings.
 * Creates one if it doesn't — safe to call on every interaction.
 */
export function ensureGuild(guildId: string): void {
    db.prepare(`
        INSERT OR IGNORE INTO guild_settings (guild_id)
        VALUES (?)
    `).run(guildId);
}

/**
 * Fetch a guild row, or null if not found.
 */
export function getGuild(guildId: string): GuildRow | undefined {
    return db.prepare<string, GuildRow>(`
        SELECT * FROM guild_settings WHERE guild_id = ?
    `).get(guildId);
}

/**
 * Remove a guild and all its related settings (cascade).
 * Call when the bot is kicked from a server.
 */
export function deleteGuild(guildId: string): void {
    db.prepare(`
        DELETE FROM guild_settings WHERE guild_id = ?
    `).run(guildId);
}

/**
 * Update the guild's updated_at timestamp.
 */
export function touchGuild(guildId: string): void {
    db.prepare(`
        UPDATE guild_settings
        SET updated_at = strftime('%s', 'now')
        WHERE guild_id = ?
    `).run(guildId);
}
