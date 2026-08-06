import type { Database } from 'better-sqlite3';

export function createTables(db: Database): void {

    // ── Guild Settings ─────────────────────────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS guild_settings (
            guild_id   TEXT    PRIMARY KEY,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
    `);

    // ── Welcome Settings ───────────────────────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS welcome_settings (
            guild_id      TEXT    PRIMARY KEY,
            enabled       INTEGER NOT NULL DEFAULT 0,
            channel_id    TEXT,
            message       TEXT    NOT NULL DEFAULT 'Welcome {mention} to **{server}**! You are member #{count}.',
            embed_enabled INTEGER NOT NULL DEFAULT 1,
            embed_color   TEXT    NOT NULL DEFAULT '#5865F2',
            created_at    INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at    INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
        );
    `);

    // ── Leave Settings ─────────────────────────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS leave_settings (
            guild_id      TEXT    PRIMARY KEY,
            enabled       INTEGER NOT NULL DEFAULT 0,
            channel_id    TEXT,
            message       TEXT    NOT NULL DEFAULT '**{user}** has left **{server}**. We now have {count} members.',
            embed_enabled INTEGER NOT NULL DEFAULT 1,
            embed_color   TEXT    NOT NULL DEFAULT '#ED4245',
            created_at    INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at    INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
        );
    `);

    // ── Giveaways ──────────────────────────────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS giveaways (
            message_id   TEXT    PRIMARY KEY,
            guild_id     TEXT    NOT NULL,
            channel_id   TEXT    NOT NULL,
            host_id      TEXT    NOT NULL,
            prize        TEXT    NOT NULL,
            winner_count INTEGER NOT NULL DEFAULT 1,
            ends_at      INTEGER NOT NULL,
            ended        INTEGER NOT NULL DEFAULT 0,
            winners      TEXT,
            created_at   INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
    `);

    // ── Polls ──────────────────────────────────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS polls (
            message_id TEXT    PRIMARY KEY,
            guild_id   TEXT    NOT NULL,
            channel_id TEXT    NOT NULL,
            host_id    TEXT    NOT NULL,
            question   TEXT    NOT NULL,
            options    TEXT    NOT NULL,
            ends_at    INTEGER,
            ended      INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
    `);
}
