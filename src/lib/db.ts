import Database from "better-sqlite3";
import { ensureDataDirs, getDbPath } from "@/lib/paths";
import {
  RangeChart,
  normalizeCells,
  normalizeRange,
  type Position,
} from "@/lib/range";

type RangeRow = {
  id: string;
  name: string;
  position: string;
  note: string;
  cells_json: string;
  updated_at: string;
};

type DbGlobal = typeof globalThis & {
  __pokerDb?: Database.Database;
  __pokerDbPath?: string;
};

function openDb(): Database.Database {
  const { dbPath } = ensureDataDirs();
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
    CREATE INDEX IF NOT EXISTS idx_ranges_updated ON ranges(updated_at DESC);
  `);
  const g = globalThis as DbGlobal;
  g.__pokerDbPath = dbPath;
  return db;
}

export function getDb(): Database.Database {
  const g = globalThis as DbGlobal;
  const pathNow = getDbPath();
  // Reopen if data root/path changed (e.g. env override in tests).
  if (!g.__pokerDb || g.__pokerDbPath !== pathNow) {
    try {
      g.__pokerDb?.close();
    } catch {
      /* ignore */
    }
    g.__pokerDb = openDb();
  }
  return g.__pokerDb;
}

export function getActiveDbPath(): string {
  getDb();
  return (globalThis as DbGlobal).__pokerDbPath ?? getDbPath();
}

function rowToRange(row: RangeRow): RangeChart {
  let cellsRaw: unknown = {};
  try {
    cellsRaw = JSON.parse(row.cells_json);
  } catch {
    cellsRaw = {};
  }
  return {
    id: row.id,
    name: row.name,
    position: row.position as Position,
    note: row.note,
    cells: normalizeCells(cellsRaw),
    updatedAt: row.updated_at,
  };
}

export function listRanges(): RangeChart[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, position, note, cells_json, updated_at
       FROM ranges ORDER BY updated_at DESC`,
    )
    .all() as RangeRow[];
  return rows.map(rowToRange);
}

export function getRange(id: string): RangeChart | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, name, position, note, cells_json, updated_at
       FROM ranges WHERE id = ?`,
    )
    .get(id) as RangeRow | undefined;
  return row ? rowToRange(row) : null;
}

export function upsertRangeDb(input: unknown): RangeChart {
  const range = normalizeRange(input);
  if (!range) {
    throw new Error("無效的範圍資料");
  }
  const updatedAt = new Date().toISOString();
  const next: RangeChart = { ...range, updatedAt };
  const db = getDb();
  db.prepare(
    `INSERT INTO ranges (id, name, position, note, cells_json, updated_at)
     VALUES (@id, @name, @position, @note, @cells_json, @updated_at)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       position = excluded.position,
       note = excluded.note,
       cells_json = excluded.cells_json,
       updated_at = excluded.updated_at`,
  ).run({
    id: next.id,
    name: next.name,
    position: next.position,
    note: next.note,
    cells_json: JSON.stringify(next.cells),
    updated_at: next.updatedAt,
  });
  return next;
}

export function deleteRangeDb(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM ranges WHERE id = ?`).run(id);
  return result.changes > 0;
}

/** Insert ranges that are missing; skip ids already in DB. Returns inserted count. */
export function migrateRanges(rawList: unknown[]): {
  inserted: number;
  skipped: number;
} {
  let inserted = 0;
  let skipped = 0;
  const db = getDb();
  const exists = db.prepare(`SELECT 1 FROM ranges WHERE id = ?`);
  const insert = db.prepare(
    `INSERT INTO ranges (id, name, position, note, cells_json, updated_at)
     VALUES (@id, @name, @position, @note, @cells_json, @updated_at)`,
  );

  const tx = db.transaction((items: unknown[]) => {
    for (const item of items) {
      const range = normalizeRange(item);
      if (!range) {
        skipped += 1;
        continue;
      }
      if (exists.get(range.id)) {
        skipped += 1;
        continue;
      }
      insert.run({
        id: range.id,
        name: range.name,
        position: range.position,
        note: range.note,
        cells_json: JSON.stringify(range.cells),
        updated_at: range.updatedAt,
      });
      inserted += 1;
    }
  });
  tx(rawList);
  return { inserted, skipped };
}
