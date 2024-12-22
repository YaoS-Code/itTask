// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create a requests table if it doesn’t exist
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    request_type TEXT NOT NULL,
    requested_date TEXT NOT NULL,
    authorized_by TEXT NOT NULL,
    authorized_email TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
