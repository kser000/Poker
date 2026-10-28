"use client";

import { useCallback, useEffect, useState } from "react";
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
  deleteRange,
  emptyCell,
  loadRanges,
  upsertRange,
} from "@/lib/range";

export function RangeWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  const [list, setList] = useState<RangeChart[]>([]);
  const [current, setCurrent] = useState<RangeChart>(() => createRange());
  const [brush, setBrush] = useState<ActionId>("raise");
  const [brushFrequency, setBrushFrequency] = useState(100);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const ranges = loadRanges();
    setList(ranges);
    if (ranges[0]) setCurrent(ranges[0]);
    setHydrated(true);
  }, []);

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

  function handleSave() {
    const next = upsertRange({
      ...current,
      name: current.name.trim() || "未命名範圍",
    });
    setList(next);
    setCurrent(next.find((r) => r.id === current.id) ?? next[0]);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  function handleNew() {
    setCurrent(createRange({ name: "新範圍", position: "BTN" }));
  }

  function handleLoad(id: string) {
    const found = list.find((r) => r.id === id);
    if (found) setCurrent({ ...found, cells: { ...found.cells } });
  }

  function handleDelete(id: string) {
    const next = deleteRange(id);
    setList(next);
    if (current.id === id) {
      setCurrent(next[0] ?? createRange());
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
        載入本地範圍表…
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="space-y-5">
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
          <span className="text-sm font-medium text-[var(--ink)]">
            備註（可選）
          </span>
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
          <span className="mr-1 text-sm font-medium text-[var(--ink)]">
            畫筆
          </span>
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
            總和 ≤ 100% 可疊色；超過則覆蓋。棄牌畫筆可清空格子。
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
            onClick={handleSave}
            className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            儲存到本機
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
          {savedFlash ? (
            <span className="self-center text-sm font-medium text-[var(--accent)] animate-[fade_1.6s_ease]">
              已儲存
            </span>
          ) : null}
        </div>
      </section>

      <aside className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
            我的範圍表
          </h2>
          <span className="text-xs text-[var(--muted)]">{list.length} 份</span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          資料存在瀏覽器 localStorage，不會上傳伺服器。
        </p>
        <ul className="space-y-2">
          {list.length === 0 ? (
            <li className="rounded-lg border border-dashed border-[var(--line)] bg-white/50 px-3 py-6 text-center text-sm text-[var(--muted)]">
              尚無已存範圍。編輯後按「儲存到本機」。
            </li>
          ) : (
            list.map((item) => {
              const active = item.id === current.id;
              return (
                <li
                  key={item.id}
                  className="rounded-lg border bg-white/75 p-3 transition"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    boxShadow: active
                      ? "0 0 0 1px color-mix(in oklab, var(--accent) 40%, transparent)"
                      : undefined,
                  }}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => handleLoad(item.id)}
                  >
                    <div className="font-medium text-[var(--ink)]">
                      {item.name}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      {item.position}
                      {item.note ? ` · ${item.note}` : ""}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted)]">
                      {new Date(item.updatedAt).toLocaleString("zh-TW")}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="mt-2 text-xs text-[#a33] underline-offset-2 hover:underline"
                    onClick={() => handleDelete(item.id)}
                  >
                    刪除
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
}
