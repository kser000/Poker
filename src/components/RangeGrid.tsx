"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIONS,
  ActionId,
  CellMap,
  CellState,
  RANKS,
  actionMeta,
  clampFrequency,
  handLabel,
} from "@/lib/range";

type Props = {
  cells: CellMap;
  brush: ActionId;
  brushFrequency: number;
  onPaint: (hand: string, action: ActionId, frequency: number) => void;
  onSetCell: (hand: string, state: CellState) => void;
};

type FreqMenu = {
  hand: string;
  action: ActionId;
  frequency: number;
  x: number;
  y: number;
};

export function RangeGrid({
  cells,
  brush,
  brushFrequency,
  onPaint,
  onSetCell,
}: Props) {
  const painting = useRef(false);
  const lastHand = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<FreqMenu | null>(null);
  const [draftFreq, setDraftFreq] = useState(100);

  const paint = useCallback(
    (hand: string) => {
      if (lastHand.current === hand) return;
      lastHand.current = hand;
      onPaint(hand, brush, brushFrequency);
    },
    [brush, brushFrequency, onPaint],
  );

  const handFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest("[data-hand]") as HTMLElement | null;
    return cell?.dataset.hand ?? null;
  }, []);

  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    function onPointer(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  function applyMenu() {
    if (!menu) return;
    const freq = clampFrequency(draftFreq);
    const action = menu.action === "fold" && freq > 0 ? brush : menu.action;
    onSetCell(menu.hand, {
      action: freq <= 0 ? "fold" : action,
      frequency: freq <= 0 ? 100 : freq,
    });
    setMenu(null);
  }

  const foldMeta = actionMeta("fold");

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div
        ref={gridRef}
        className="inline-grid min-w-[640px] select-none gap-px rounded-sm bg-[color-mix(in_oklab,var(--ink)_18%,transparent)] p-px shadow-[0_12px_40px_rgba(20,40,28,0.18)]"
        style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
        role="grid"
        aria-label="翻前 13×13 範圍矩陣"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const hand = handFromPoint(e.clientX, e.clientY);
          if (!hand) return;
          e.preventDefault();
          setMenu(null);
          painting.current = true;
          lastHand.current = null;
          gridRef.current?.setPointerCapture(e.pointerId);
          paint(hand);
        }}
        onPointerMove={(e) => {
          if (!painting.current) return;
          const hand = handFromPoint(e.clientX, e.clientY);
          if (hand) paint(hand);
        }}
        onPointerUp={() => {
          painting.current = false;
          lastHand.current = null;
        }}
        onPointerCancel={() => {
          painting.current = false;
          lastHand.current = null;
        }}
        onContextMenu={(e) => {
          const hand = handFromPoint(e.clientX, e.clientY);
          if (!hand) return;
          e.preventDefault();
          painting.current = false;
          const cell = cells[hand] ?? { action: "fold" as ActionId, frequency: 100 };
          const action =
            cell.action === "fold" ? brush : cell.action;
          const frequency =
            cell.action === "fold" ? brushFrequency : cell.frequency;
          setDraftFreq(frequency);
          setMenu({
            hand,
            action,
            frequency,
            x: e.clientX,
            y: e.clientY,
          });
        }}
      >
        <div className="flex h-8 items-center justify-center bg-[var(--panel)] text-[10px] font-medium text-[var(--muted)]">
          #
        </div>
        {RANKS.map((rank) => (
          <div
            key={`col-${rank}`}
            className="flex h-8 items-center justify-center bg-[var(--panel)] text-xs font-semibold tracking-wide text-[var(--ink)]"
          >
            {rank}
          </div>
        ))}

        {RANKS.map((rowRank, row) => (
          <div key={`row-${rowRank}`} className="contents">
            <div className="flex h-10 items-center justify-center bg-[var(--panel)] text-xs font-semibold tracking-wide text-[var(--ink)] sm:h-11">
              {rowRank}
            </div>
            {RANKS.map((_, col) => {
              const hand = handLabel(row, col);
              const cell = cells[hand] ?? { action: "fold" as ActionId, frequency: 100 };
              const meta = actionMeta(cell.action);
              const isPair = row === col;
              const freq =
                cell.action === "fold" ? 100 : clampFrequency(cell.frequency);
              const showPartial = cell.action !== "fold" && freq < 100;
              const labelColor =
                cell.action === "fold" || (showPartial && freq < 45)
                  ? foldMeta.text
                  : meta.text;

              return (
                <div
                  key={hand}
                  data-hand={hand}
                  role="gridcell"
                  aria-label={`${hand} ${meta.label} ${freq}%`}
                  className="relative h-10 touch-none overflow-hidden text-[10px] font-semibold transition-[filter,transform] duration-75 hover:brightness-110 sm:h-11 sm:text-[11px]"
                  style={{
                    backgroundColor: foldMeta.color,
                    boxShadow: isPair
                      ? "inset 0 0 0 1.5px rgba(20,40,28,0.28)"
                      : undefined,
                    cursor: "crosshair",
                  }}
                >
                  {cell.action !== "fold" ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0"
                      style={{
                        height: `${freq}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  ) : null}
                  <span
                    className="pointer-events-none relative z-[1] flex h-full w-full items-center justify-center"
                    style={{ color: labelColor }}
                  >
                    {hand}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-[var(--muted)]">
        左鍵拖曳以上色；右鍵點格子設定頻率（預設 100%）。對角線為對子，右上同花（s），左下雜色（o）。
      </p>

      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        {ACTIONS.map((a) => (
          <li key={a.id} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm"
              style={{ backgroundColor: a.color }}
              aria-hidden
            />
            {a.label}
          </li>
        ))}
      </ul>

      {menu ? (
        <div
          ref={menuRef}
          role="dialog"
          aria-label={`${menu.hand} 頻率設定`}
          className="fixed z-50 w-[220px] rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-[0_16px_40px_rgba(20,40,28,0.28)]"
          style={{
            left: Math.min(menu.x, window.innerWidth - 236),
            top: Math.min(menu.y, window.innerHeight - 180),
          }}
        >
          <div className="text-sm font-semibold text-[var(--ink)]">
            {menu.hand}
            <span className="ml-1.5 font-normal text-[var(--muted)]">
              {actionMeta(menu.action).label}
            </span>
          </div>
          <label className="mt-3 block space-y-1.5">
            <span className="flex items-center justify-between text-xs text-[var(--muted)]">
              頻率
              <span className="font-semibold tabular-nums text-[var(--ink)]">
                {clampFrequency(draftFreq)}%
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={clampFrequency(draftFreq)}
              onChange={(e) => setDraftFreq(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={clampFrequency(draftFreq)}
              onChange={(e) => setDraftFreq(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--line)] bg-white/80 px-2 py-1.5 text-sm tabular-nums text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={applyMenu}
              className="flex-1 rounded-md bg-[var(--accent)] px-2 py-1.5 text-sm font-semibold text-white hover:brightness-110"
            >
              套用
            </button>
            <button
              type="button"
              onClick={() => setMenu(null)}
              className="rounded-md border border-[var(--line)] bg-white/70 px-2 py-1.5 text-sm text-[var(--ink)] hover:bg-white"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
