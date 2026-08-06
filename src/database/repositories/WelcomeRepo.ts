import { db } from '../db';
import { ensureGuild } from './GuildRepo';

export interface WelcomeRow {
    guild_id: string;
    enabled: number;          // SQLite stores booleans as 0/1
    channel_id: string | null;
    message: string;
    embed_enabled: number;
    embed_color: string;
    created_at: number;
    updated_at: number;
}

const DEFAULT_MESSAGE = 'Welcome {mention} to **{server}**! You are member #{count}.';
const DEFAULT_COLOR   = '#5865F2';

/** Fetch welcome settings for a guild. Auto-creates a default row if missing. */
export function getWelcome(guildId: string): WelcomeRow {
    ensureGuild(guildId);

    const existing = db.prepare<string, WelcomeRow>(`
        SELECT * FROM welcome_settings WHERE guild_id = ?
    `).get(guildId);

    if (!existing) {
        db.prepare(`
            INSERT OR IGNORE INTO welcome_settings (guild_id)
            VALUES (?)
        `).run(guildId);

        return db.prepare<string, WelcomeRow>(`
            SELECT * FROM welcome_settings WHERE guild_id = ?
        `).get(guildId)!;
    }

    return existing;
}

/** Enable or disable welcome messages for a guild. */
export function setWelcomeEnabled(guildId: string, enabled: boolean): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, enabled)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            enabled    = excluded.enabled,
            updated_at = strftime('%s', 'now')
    `).run(guildId, enabled ? 1 : 0);
}

/** Set the channel where welcome messages are sent. */
export function setWelcomeChannel(guildId: string, channelId: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, channel_id)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            channel_id = excluded.channel_id,
            updated_at = strftime('%s', 'now')
    `).run(guildId, channelId);
}

/** Set the welcome message text. Supports placeholders: {mention} {user} {server} {count} */
export function setWelcomeMessage(guildId: string, message: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, message)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            message    = excluded.message,
            updated_at = strftime('%s', 'now')
    `).run(guildId, message);
}

/** Set the embed color for the welcome card. */
export function setWelcomeColor(guildId: string, color: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, embed_color)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            embed_color = excluded.embed_color,
            updated_at  = strftime('%s', 'now')
    `).run(guildId, color);
}

/** Toggle embed on/off for welcome messages. */
export function setWelcomeEmbedEnabled(guildId: string, enabled: boolean): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, embed_enabled)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            embed_enabled = excluded.embed_enabled,
            updated_at    = strftime('%s', 'now')
    `).run(guildId, enabled ? 1 : 0);
}

/** Reset all welcome settings to defaults for a guild. */
export function resetWelcome(guildId: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO welcome_settings (guild_id, enabled, channel_id, message, embed_enabled, embed_color)
        VALUES (?, 0, NULL, ?, 1, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            enabled       = 0,
            channel_id    = NULL,
            message       = ?,
            embed_enabled = 1,
            embed_color   = ?,
            updated_at    = strftime('%s', 'now')
    `).run(guildId, DEFAULT_MESSAGE, DEFAULT_COLOR, DEFAULT_MESSAGE, DEFAULT_COLOR);
}

/** Resolve placeholders in a welcome message string. */
export function resolveWelcomePlaceholders(
    message: string,
    opts: { username: string; mention: string; server: string; count: number }
): string {
    return message
        .replace(/{user}/g, opts.username)
        .replace(/{mention}/g, opts.mention)
        .replace(/{server}/g, opts.server)
        .replace(/{count}/g, opts.count.toString());
}
