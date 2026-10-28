"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RangeGrid } from "@/components/RangeGrid";
import {
  ACTIONS,
  ActionId,
  POSITIONS,
  Position,
  RangeChart,
  applyPaint,
  clampFrequency,
  createRange,
  emptyCell,
  loadCachedRanges,
} from "@/lib/range";
import {
  deleteRangeApi,
  fetchRangesFromApi,
  migrateLegacyIfNeeded,
  upsertRangeApi,
} from "@/lib/ranges-api";

export function RangeWorkspace() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("id");

  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [current, setCurrent] = useState<RangeChart>(() => createRange());
  const [brush, setBrush] = useState<ActionId>("raise");
  const [brushFrequency, setBrushFrequency] = useState(100);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const cached = loadCachedRanges();
      if (loadId) {
        const found = cached.find((r) => r.id === loadId);
        if (found && !cancelled) {
          setCurrent({ ...found, cells: { ...found.cells } });
        }
      }

      setHydrated(true);
      setSyncing(true);
      try {
        await migrateLegacyIfNeeded();
        const list = await fetchRangesFromApi();
        if (cancelled) return;
        if (loadId) {
          const found = list.find((r) => r.id === loadId);
          if (found) setCurrent({ ...found, cells: { ...found.cells } });
        }
      } catch {
        if (!cancelled) setError("無法連線資料庫，已使用本機快取。");
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  const onPaint = useCallback(
    (hand: string, action: ActionId, frequency: number) => {
      setCurrent((prev) => {
        const existing = prev.cells[hand] ?? emptyCell();
        return {
          ...prev,
          cells: {
            ...prev.cells,
            [hand]: applyPaint(existing, action, frequency),
          },
        };
      });
    },
    [],
  );

  async function handleSave() {
    setError(null);
    try {
      const saved = await upsertRangeApi({
        ...current,
        name: current.name.trim() || "未命名範圍",
      });
      setCurrent(saved);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    } catch {
      setError("儲存到資料庫失敗。");
    }
  }

  function handleNew() {
    setCurrent(createRange({ name: "新範圍", position: "BTN" }));
  }

  async function handleDelete() {
    if (!confirm(`確定刪除「${current.name}」？`)) return;
    setError(null);
    try {
      await deleteRangeApi(current.id);
      setCurrent(createRange({ name: "新範圍", position: "BTN" }));
    } catch {
      setError("刪除失敗。");
    }
  }

  function clearBoard() {
    setCurrent((prev) => ({
      ...prev,
      cells: createRange().cells,
    }));
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-8 text-[var(--muted)]">
        載入範圍表…
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
            範圍設計器
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            資料存於 E:\Poker\db（SQLite），瀏覽器保留快取。
            {syncing ? " 同步中…" : ""}
          </p>
        </div>
        <Link
          href="/ranges"
          className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          查看我的範圍表 →
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-[#e0b4b4] bg-[#fdf2f2] px-3 py-2 text-sm text-[#8a3030]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">名稱</span>
          <input
            className="w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
            value={current.name}
            onChange={(e) =>
              setCurrent((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="例如：BTN RFI"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">位置</span>
          <select
            className="w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
            value={current.position}
            onChange={(e) =>
              setCurrent((prev) => ({
                ...prev,
                position: e.target.value as Position,
              }))
            }
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--ink)]">備註（可選）</span>
        <input
          className="w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
          value={current.note}
          onChange={(e) =>
            setCurrent((prev) => ({ ...prev, note: e.target.value }))
          }
          placeholder="例如：100bb 現金桌 RFI"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-[var(--ink)]">畫筆</span>
        {ACTIONS.map((a) => {
          const active = brush === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setBrush(a.id)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition"
              style={{
                borderColor: active ? a.color : "var(--line)",
                backgroundColor: active ? a.color : "rgba(255,255,255,0.7)",
                color: active ? a.text : "var(--ink)",
                boxShadow: active ? `0 0 0 2px ${a.color}55` : undefined,
              }}
            >
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: a.color }}
                aria-hidden
              />
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
          <span className="font-medium">畫筆頻率</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={brushFrequency}
            onChange={(e) =>
              setBrushFrequency(clampFrequency(Number(e.target.value)))
            }
            className="w-36 accent-[var(--accent)]"
            aria-label="畫筆頻率"
          />
          <span className="w-10 tabular-nums text-[var(--muted)]">
            {brushFrequency}%
          </span>
        </label>
        <span className="text-xs text-[var(--muted)]">
          總和 ≤ 100% 可疊色；超過則覆蓋。懸停格子可放大查看頻率。
        </span>
      </div>

      <RangeGrid
        cells={current.cells}
        brush={brush}
        brushFrequency={brushFrequency}
        onPaint={onPaint}
        onBrushFrequencyChange={setBrushFrequency}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          儲存到資料庫
        </button>
        <button
          type="button"
          onClick={handleNew}
          className="rounded-md border border-[var(--line)] bg-white/70 px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
        >
          新建空白表
        </button>
        <button
          type="button"
          onClick={clearBoard}
          className="rounded-md border border-[var(--line)] bg-white/70 px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
        >
          清空格子
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="rounded-md border border-[#e0b4b4] bg-white/70 px-4 py-2.5 text-sm font-medium text-[#8a3030] transition hover:bg-[#fdf2f2]"
        >
          刪除此表
        </button>
        {savedFlash ? (
          <span className="self-center text-sm font-medium text-[var(--accent)] animate-[fade_1.6s_ease]">
            已儲存
          </span>
        ) : null}
      </div>
    </section>
  );
}
