import fs from "fs";
import path from "path";

/** Local data root on the user's Windows machine (preference: E:\Poker). */
export const DATA_ROOT =
  process.env.POKER_DATA_ROOT?.trim() || "E:\\Poker";

export const DB_DIR = path.join(DATA_ROOT, "db");
export const RANGES_EXPORT_DIR = path.join(DATA_ROOT, "ranges");
export const DB_PATH = path.join(DB_DIR, "ranges.sqlite");

export function ensureDataDirs(): void {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(RANGES_EXPORT_DIR, { recursive: true });
}
