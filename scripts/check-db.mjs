import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const root = process.env.POKER_DATA_ROOT || ["E:", "Poker"].join("\\");
const dbDir = path.join(root, "db");
const dbPath = path.join(dbDir, "ranges.sqlite");

fs.mkdirSync(dbDir, { recursive: true });
fs.mkdirSync(path.join(root, "ranges"), { recursive: true });
fs.mkdirSync(path.join(root, "docs"), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS ranges (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    cells_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
const count = db.prepare("SELECT COUNT(*) AS n FROM ranges").get();
db.close();
console.log(JSON.stringify({ ok: true, dbPath, count: count.n, size: fs.statSync(dbPath).size }));
