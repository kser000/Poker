import fs from "fs";
import path from "path";

/** Spell drive letter without a static absolute path literal (Next file-tracing). */
function driveRoot(): string {
  return `${String.fromCharCode(69)}:${path.sep}`;
}

function preferredRoot(): string {
  return path.join(driveRoot(), "Poker");
}

function fallbackRoot(): string {
  return path.join(driveRoot(), "PokerData");
}

function envRoot(): string | null {
  const raw = process.env.POKER_DATA_ROOT?.trim();
  return raw ? raw : null;
}

/** True if we can create dirs and write a small probe file under root. */
export function isWritableDataRoot(root: string): boolean {
  try {
    const probeDir = path.join(root, "db");
    fs.mkdirSync(probeDir, { recursive: true });
    const probe = path.join(probeDir, ".write-probe");
    fs.writeFileSync(probe, String(Date.now()));
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve data root:
 * 1) POKER_DATA_ROOT env
 * 2) preferred E-drive Poker folder
 * 3) PokerData fallback if preferred is missing/corrupt/unwritable
 */
export function resolveDataRoot(): string {
  const fromEnv = envRoot();
  if (fromEnv) {
    if (!isWritableDataRoot(fromEnv)) {
      throw new Error(
        `POKER_DATA_ROOT 無法寫入：${fromEnv}。請檢查磁碟／權限，或改設可用路徑。`,
      );
    }
    return fromEnv;
  }

  const preferred = preferredRoot();
  if (isWritableDataRoot(preferred)) {
    return preferred;
  }

  const fallback = fallbackRoot();
  if (isWritableDataRoot(fallback)) {
    return fallback;
  }

  throw new Error(
    `無法寫入資料目錄（已試 ${preferred} 與 ${fallback}）。資料碟可能損毀或無權限；請重建資料資料夾或設定 POKER_DATA_ROOT。`,
  );
}

let cachedRoot: string | null = null;

export function getDataRoot(): string {
  if (!cachedRoot) cachedRoot = resolveDataRoot();
  return cachedRoot;
}

export function getDbDir(): string {
  return path.join(getDataRoot(), "db");
}

export function getRangesExportDir(): string {
  return path.join(getDataRoot(), "ranges");
}

export function getDbPath(): string {
  return path.join(getDbDir(), "ranges.sqlite");
}

export function ensureDataDirs(): { root: string; dbPath: string } {
  const root = getDataRoot();
  const dbDir = path.join(root, "db");
  const rangesDir = path.join(root, "ranges");
  const docsDir = path.join(root, "docs");
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(rangesDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  return { root, dbPath: path.join(dbDir, "ranges.sqlite") };
}
