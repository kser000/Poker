import {
  RangeChart,
  loadCachedRanges,
  loadLegacyRangesForMigration,
  parseRangeList,
  saveCachedRanges,
  MIGRATION_FLAG_KEY,
} from "@/lib/range";

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRangesFromApi(): Promise<RangeChart[]> {
  const res = await fetch("/api/ranges", { cache: "no-store" });
  if (!res.ok) throw new Error("無法載入範圍表");
  const data = await readJson(res);
  const list = parseRangeList(
    data && typeof data === "object" && "ranges" in data
      ? (data as { ranges: unknown }).ranges
      : data,
  );
  saveCachedRanges(list);
  return list;
}

export async function upsertRangeApi(range: RangeChart): Promise<RangeChart> {
  const res = await fetch("/api/ranges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(range),
  });
  if (!res.ok) throw new Error("儲存失敗");
  const data = (await readJson(res)) as { range?: unknown };
  const saved = parseRangeList(data?.range ? [data.range] : [])[0];
  if (!saved) throw new Error("儲存回應無效");
  const cached = loadCachedRanges();
  const idx = cached.findIndex((r) => r.id === saved.id);
  if (idx >= 0) cached[idx] = saved;
  else cached.unshift(saved);
  saveCachedRanges(cached);
  return saved;
}

export async function deleteRangeApi(id: string): Promise<void> {
  const res = await fetch(`/api/ranges/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("刪除失敗");
  saveCachedRanges(loadCachedRanges().filter((r) => r.id !== id));
}

/** One-time: push legacy localStorage ranges into SQLite if not yet migrated. */
export async function migrateLegacyIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return;
  const legacy = loadLegacyRangesForMigration();
  if (legacy.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    return;
  }
  try {
    const res = await fetch("/api/ranges/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ranges: legacy }),
    });
    if (res.ok) {
      localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    }
  } catch {
    // Keep flag unset so next load can retry.
  }
}
