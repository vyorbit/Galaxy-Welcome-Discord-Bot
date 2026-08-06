import { db } from '../db';
import { ensureGuild } from './GuildRepo';

export interface LeaveRow {
    guild_id: string;
    enabled: number;
    channel_id: string | null;
    message: string;
    embed_enabled: number;
    embed_color: string;
    created_at: number;
    updated_at: number;
}

const DEFAULT_MESSAGE = '**{user}** has left **{server}**. We now have {count} members.';
const DEFAULT_COLOR   = '#ED4245';

/** Fetch leave settings for a guild. Auto-creates a default row if missing. */
export function getLeave(guildId: string): LeaveRow {
    ensureGuild(guildId);

    const existing = db.prepare<string, LeaveRow>(`
        SELECT * FROM leave_settings WHERE guild_id = ?
    `).get(guildId);

    if (!existing) {
        db.prepare(`
            INSERT OR IGNORE INTO leave_settings (guild_id)
            VALUES (?)
        `).run(guildId);

        return db.prepare<string, LeaveRow>(`
            SELECT * FROM leave_settings WHERE guild_id = ?
        `).get(guildId)!;
    }

    return existing;
}

/** Enable or disable leave messages for a guild. */
export function setLeaveEnabled(guildId: string, enabled: boolean): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, enabled)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            enabled    = excluded.enabled,
            updated_at = strftime('%s', 'now')
    `).run(guildId, enabled ? 1 : 0);
}

/** Set the channel where leave messages are sent. */
export function setLeaveChannel(guildId: string, channelId: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, channel_id)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            channel_id = excluded.channel_id,
            updated_at = strftime('%s', 'now')
    `).run(guildId, channelId);
}

/** Set the leave message text. Supports placeholders: {user} {server} {count} */
export function setLeaveMessage(guildId: string, message: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, message)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            message    = excluded.message,
            updated_at = strftime('%s', 'now')
    `).run(guildId, message);
}

/** Set the embed color for the leave card. */
export function setLeaveColor(guildId: string, color: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, embed_color)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            embed_color = excluded.embed_color,
            updated_at  = strftime('%s', 'now')
    `).run(guildId, color);
}

/** Toggle embed on/off for leave messages. */
export function setLeaveEmbedEnabled(guildId: string, enabled: boolean): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, embed_enabled)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            embed_enabled = excluded.embed_enabled,
            updated_at    = strftime('%s', 'now')
    `).run(guildId, enabled ? 1 : 0);
}

/** Reset all leave settings to defaults for a guild. */
export function resetLeave(guildId: string): void {
    ensureGuild(guildId);
    db.prepare(`
        INSERT INTO leave_settings (guild_id, enabled, channel_id, message, embed_enabled, embed_color)
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

/** Resolve placeholders in a leave message string. */
export function resolveLeavePlaceholders(
    message: string,
    opts: { username: string; server: string; count: number }
): string {
    return message
        .replace(/{user}/g, opts.username)
        .replace(/{server}/g, opts.server)
        .replace(/{count}/g, opts.count.toString());
}
