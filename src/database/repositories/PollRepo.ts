import { db } from '../db';

export interface PollRow {
    message_id: string;
    guild_id:   string;
    channel_id: string;
    host_id:    string;
    question:   string;
    options:    string;       // JSON string[] e.g. '["Yes","No","Maybe"]'
    ends_at:    number | null; // Unix timestamp (seconds), null = no expiry
    ended:      number;        // 0 = active | 1 = ended
    created_at: number;
}

/** Insert a new poll record. */
export function createPoll(row: Omit<PollRow, 'ended' | 'created_at'>): void {
    db.prepare(`
        INSERT INTO polls (message_id, guild_id, channel_id, host_id, question, options, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(row.message_id, row.guild_id, row.channel_id, row.host_id, row.question, row.options, row.ends_at ?? null);
}

/** Fetch a single poll by Discord message ID. */
export function getPoll(messageId: string): PollRow | undefined {
    return db.prepare<string, PollRow>(
        'SELECT * FROM polls WHERE message_id = ?'
    ).get(messageId);
}

/** Get all active polls in a guild (for /poll list). */
export function getGuildActivePolls(guildId: string): PollRow[] {
    return db.prepare<string, PollRow>(
        'SELECT * FROM polls WHERE ended = 0 AND guild_id = ? ORDER BY created_at DESC'
    ).all(guildId);
}

/** All active polls across all guilds (for timer restoration on startup). */
export function getAllActivePolls(): PollRow[] {
    return db.prepare<[], PollRow>(
        'SELECT * FROM polls WHERE ended = 0 AND ends_at IS NOT NULL ORDER BY ends_at ASC'
    ).all();
}

/** Mark a poll as ended. */
export function markPollEnded(messageId: string): void {
    db.prepare('UPDATE polls SET ended = 1 WHERE message_id = ?').run(messageId);
}
