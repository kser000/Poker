"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RangeChart, loadCachedRanges } from "@/lib/range";
import {
  deleteRangeApi,
  fetchRangesFromApi,
  migrateLegacyIfNeeded,
} from "@/lib/ranges-api";

export function RangesList() {
  const [list, setList] = useState<RangeChart[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setSyncing(true);
    setError(null);
    try {
      await migrateLegacyIfNeeded();
      const ranges = await fetchRangesFromApi();
      setList(ranges);
    } catch {
      setList(loadCachedRanges());
      setError("無法連線資料庫，顯示本機快取。");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    setList(loadCachedRanges());
    setHydrated(true);
    void refresh();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定刪除「${name}」？`)) return;
    try {
      await deleteRangeApi(id);
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("刪除失敗。");
    }
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8 text-[var(--muted)]">
        載入列表…
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
            我的範圍表
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            共 {list.length} 份 · 來源 E:\Poker\db\ranges.sqlite
            {syncing ? " · 同步中…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] hover:bg-white"
          >
            重新整理
          </button>
          <Link
            href="/designer"
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            新建／設計
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-[#e0b4b4] bg-[#fdf2f2] px-3 py-2 text-sm text-[#8a3030]">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="rounded-xl border border-dashed border-[var(--line)] bg-white/50 px-4 py-10 text-center text-sm text-[var(--muted)]">
            尚無已存範圍。到「範圍設計器」編輯後按「儲存到資料庫」。
          </li>
        ) : (
          list.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-white/80 p-4 shadow-[0_8px_24px_rgba(20,40,28,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-[var(--ink)]">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {item.position}
                    {item.note ? ` · ${item.note}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(item.updatedAt).toLocaleString("zh-TW")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/designer?id=${encodeURIComponent(item.id)}`}
                    className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                  >
                    開啟編輯
                  </Link>
                  <button
                    type="button"
                    className="rounded-md border border-[#e0b4b4] px-3 py-1.5 text-sm text-[#8a3030] hover:bg-[#fdf2f2]"
                    onClick={() => void handleDelete(item.id, item.name)}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
