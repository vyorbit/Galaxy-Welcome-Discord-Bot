import { db } from '../db';

export interface GiveawayRow {
    message_id:   string;
    guild_id:     string;
    channel_id:   string;
    host_id:      string;
    prize:        string;
    winner_count: number;
    ends_at:      number;        // Unix timestamp (seconds)
    ended:        number;        // 0 = active | 1 = ended
    winners:      string | null; // JSON array of user IDs
    created_at:   number;
}

/** Insert a new giveaway record. */
export function createGiveaway(row: Omit<GiveawayRow, 'ended' | 'winners' | 'created_at'>): void {
    db.prepare(`
        INSERT INTO giveaways (message_id, guild_id, channel_id, host_id, prize, winner_count, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(row.message_id, row.guild_id, row.channel_id, row.host_id, row.prize, row.winner_count, row.ends_at);
}

/** Fetch a single giveaway by its Discord message ID. */
export function getGiveaway(messageId: string): GiveawayRow | undefined {
    return db.prepare<string, GiveawayRow>(
        'SELECT * FROM giveaways WHERE message_id = ?'
    ).get(messageId);
}

/** All active giveaways across all guilds (used on startup to restore timers). */
export function getAllActiveGiveaways(): GiveawayRow[] {
    return db.prepare<[], GiveawayRow>(
        'SELECT * FROM giveaways WHERE ended = 0 ORDER BY ends_at ASC'
    ).all();
}

/** Active giveaways in a specific guild (for /giveaway list). */
export function getGuildActiveGiveaways(guildId: string): GiveawayRow[] {
    return db.prepare<string, GiveawayRow>(
        'SELECT * FROM giveaways WHERE ended = 0 AND guild_id = ? ORDER BY ends_at ASC'
    ).all(guildId);
}

/** Mark a giveaway as ended and store the winner IDs. */
export function markGiveawayEnded(messageId: string, winners: string[]): void {
    db.prepare(`
        UPDATE giveaways SET ended = 1, winners = ? WHERE message_id = ?
    `).run(JSON.stringify(winners), messageId);
}
