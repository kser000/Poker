"use client";

import {
  CellMap,
  TOTAL_COMBOS,
  actionMeta,
  summarizeRangeFrequencies,
} from "@/lib/range";

type Props = {
  cells: CellMap;
};

function formatPct(n: number): string {
  if (n >= 9.95) return `${n.toFixed(1)}%`;
  if (n >= 0.05) return `${n.toFixed(1)}%`;
  return "0%";
}

function formatCombos(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function RangeFreqSummary({ cells }: Props) {
  const rows = summarizeRangeFrequencies(cells);
  const painted = rows.filter((r) => r.action !== "fold");
  const paintedCombos = painted.reduce((s, r) => s + r.combos, 0);
  const paintedPct = (paintedCombos / TOTAL_COMBOS) * 100;

  return (
    <aside
      className="w-full shrink-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_92%,transparent)] p-3 sm:w-[200px]"
      aria-label="整體行動頻率"
    >
      <h3 className="text-sm font-semibold text-[var(--ink)]">整體頻率</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
        依組合加權（對子 6／同花 4／雜色 12）
      </p>

      <div
        className="mt-3 flex h-3 overflow-hidden rounded-sm"
        role="img"
        aria-label="頻率比例條"
      >
        {rows.map((row) => {
          if (row.percent < 0.05) return null;
          const meta = actionMeta(row.action);
          return (
            <span
              key={row.action}
              style={{
                width: `${row.percent}%`,
                backgroundColor: meta.color,
              }}
              title={`${meta.label} ${formatPct(row.percent)}`}
            />
          );
        })}
      </div>

      <ul className="mt-3 space-y-2">
        {rows.map((row) => {
          const meta = actionMeta(row.action);
          return (
            <li key={row.action} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-[var(--ink)]">
                {meta.label}
              </span>
              <span className="tabular-nums font-semibold text-[var(--ink)]">
                {formatPct(row.percent)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-[var(--line)] pt-2 text-[11px] text-[var(--muted)]">
        <div className="flex justify-between gap-2">
          <span>進池合計</span>
          <span className="tabular-nums font-medium text-[var(--ink)]">
            {formatPct(paintedPct)}
          </span>
        </div>
        <div className="mt-1 flex justify-between gap-2">
          <span>組合數</span>
          <span className="tabular-nums">
            {formatCombos(paintedCombos)} / {TOTAL_COMBOS}
          </span>
        </div>
      </div>
    </aside>
  );
}
