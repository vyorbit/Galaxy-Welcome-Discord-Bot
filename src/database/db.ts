/**
 * @file db.ts
 * @organization VY ORBIT (https://vyorbit.com)
 * @copyright (c) VY ORBIT. All rights reserved.
 * @internal VYORBIT-DB-SQLITE
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { createTables } from './tables';

// Resolve DB path — defaults to ./data/galaxy.db, overrideable via env
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'galaxy.db');

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Open the database (creates file if it doesn't exist)
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
    try {
        createTables(db);
        console.log(chalk.green(`[Database] SQLite ready — ${DB_PATH}`));
    } catch (error) {
        console.error(chalk.red('[Database] Failed to initialize:'), error);
        process.exit(1);
    }
}
