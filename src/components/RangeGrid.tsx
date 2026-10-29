"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RangeFreqSummary } from "@/components/RangeFreqSummary";
import {
  ACTIONS,
  ActionId,
  CellMap,
  CellState,
  RANKS,
  actionMeta,
  cellSummary,
  cellTotal,
  clampFrequency,
  emptyCell,
  handLabel,
} from "@/lib/range";

type Props = {
  cells: CellMap;
  brush: ActionId;
  brushFrequency: number;
  onPaint: (
    hand: string,
    action: ActionId,
    frequency: number,
    options?: { allowToggle?: boolean },
  ) => void;
  onBrushFrequencyChange: (frequency: number) => void;
};

type FreqMenu = {
  hand: string;
  x: number;
  y: number;
};

type HoverInfo = {
  hand: string;
  cell: CellState;
  x: number;
  y: number;
};

function CellFill({ cell }: { cell: CellState }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col-reverse"
      style={{ height: "100%" }}
    >
      {cell.parts.map((part) => (
        <span
          key={part.action}
          style={{
            height: `${clampFrequency(part.frequency)}%`,
            backgroundColor: actionMeta(part.action).color,
          }}
        />
      ))}
    </span>
  );
}

export function RangeGrid({
  cells,
  brush,
  brushFrequency,
  onPaint,
  onBrushFrequencyChange,
}: Props) {
  const painting = useRef(false);
  const dragging = useRef(false);
  const startHand = useRef<string | null>(null);
  const lastHand = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<FreqMenu | null>(null);
  const [draftFreq, setDraftFreq] = useState(100);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const paint = useCallback(
    (hand: string, allowToggle = false) => {
      if (lastHand.current === hand) return;
      lastHand.current = hand;
      onPaint(hand, brush, brushFrequency, { allowToggle });
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
    onBrushFrequencyChange(freq);
    onPaint(menu.hand, brush, freq);
    setMenu(null);
  }

  const foldMeta = actionMeta("fold");

  return (
    <div className="relative w-full pb-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 overflow-x-auto">
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
          setHover(null);
          painting.current = true;
          dragging.current = false;
          startHand.current = hand;
          lastHand.current = null;
          gridRef.current?.setPointerCapture(e.pointerId);
          // Defer paint until move (drag) or up (click toggle).
        }}
        onPointerMove={(e) => {
          if (painting.current) {
            const hand = handFromPoint(e.clientX, e.clientY);
            if (!hand) return;
            if (!dragging.current && hand !== startHand.current) {
              dragging.current = true;
              // Drag mode: paint start cell without toggle, then continue.
              if (startHand.current) {
                lastHand.current = null;
                paint(startHand.current, false);
              }
            }
            if (dragging.current) paint(hand, false);
            return;
          }
          if (menu) return;
          const hand = handFromPoint(e.clientX, e.clientY);
          if (!hand) {
            setHover(null);
            return;
          }
          const cell = cells[hand] ?? emptyCell();
          setHover({
            hand,
            cell,
            x: e.clientX,
            y: e.clientY,
          });
        }}
        onPointerLeave={() => {
          if (!painting.current) setHover(null);
        }}
        onPointerUp={() => {
          if (painting.current && !dragging.current && startHand.current) {
            lastHand.current = null;
            paint(startHand.current, true);
          }
          painting.current = false;
          dragging.current = false;
          startHand.current = null;
          lastHand.current = null;
        }}
        onPointerCancel={() => {
          painting.current = false;
          dragging.current = false;
          startHand.current = null;
          lastHand.current = null;
        }}
        onContextMenu={(e) => {
          const hand = handFromPoint(e.clientX, e.clientY);
          if (!hand) return;
          e.preventDefault();
          painting.current = false;
          setHover(null);
          const cell = cells[hand] ?? emptyCell();
          const existing = cell.parts.find((p) => p.action === brush);
          setDraftFreq(
            existing ? clampFrequency(existing.frequency) : brushFrequency,
          );
          setMenu({ hand, x: e.clientX, y: e.clientY });
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
              const cell = cells[hand] ?? emptyCell();
              const isPair = row === col;
              const total = cellTotal(cell);
              const labelColor = total >= 45 ? "#ffffff" : foldMeta.text;
              const isHovered = hover?.hand === hand;

              return (
                <div
                  key={hand}
                  data-hand={hand}
                  role="gridcell"
                  aria-label={`${hand} ${cellSummary(cell)}`}
                  className="relative h-10 touch-none overflow-hidden text-[10px] font-semibold transition-[filter,transform] duration-75 sm:h-11 sm:text-[11px]"
                  style={{
                    backgroundColor: foldMeta.color,
                    boxShadow: isPair
                      ? "inset 0 0 0 1.5px rgba(20,40,28,0.28)"
                      : undefined,
                    cursor: "crosshair",
                    transform: isHovered ? "scale(1.08)" : undefined,
                    zIndex: isHovered ? 2 : undefined,
                    filter: isHovered ? "brightness(1.05)" : undefined,
                  }}
                >
                  <CellFill cell={cell} />
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
      </div>

      <RangeFreqSummary cells={cells} />
      </div>

      <p className="mt-3 text-sm text-[var(--muted)]">
        左鍵點擊：相同行動與頻率可清除；拖曳只上色。可疊加多種行動（總和 ≤ 100%，超過則覆蓋）。懸停放大；右鍵設頻率。對角線為對子，右上同花（s），左下雜色（o）。右側為整體頻率（組合加權）。
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

      {hover && !menu ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[60] w-[200px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_20px_48px_rgba(20,40,28,0.28)]"
          style={{
            left: Math.min(hover.x + 16, window.innerWidth - 216),
            top: Math.min(hover.y + 16, window.innerHeight - 200),
          }}
        >
          <div
            className="relative h-24 w-full"
            style={{ backgroundColor: foldMeta.color }}
          >
            <CellFill cell={hover.cell} />
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[var(--ink)] drop-shadow-sm">
              {hover.hand}
            </span>
          </div>
          <div className="space-y-1.5 p-3">
            <div className="text-sm font-semibold text-[var(--ink)]">
              {hover.hand}
              <span className="ml-1.5 font-normal text-[var(--muted)]">
                合計 {cellTotal(hover.cell)}%
              </span>
            </div>
            {hover.cell.parts.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">棄牌（空白）</p>
            ) : (
              <ul className="space-y-1">
                {hover.cell.parts.map((part) => (
                  <li
                    key={part.action}
                    className="flex items-center justify-between text-xs text-[var(--ink)]"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block size-2.5 rounded-sm"
                        style={{
                          backgroundColor: actionMeta(part.action).color,
                        }}
                      />
                      {actionMeta(part.action).label}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {clampFrequency(part.frequency)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {menu ? (
        <div
          ref={menuRef}
          role="dialog"
          aria-label={`${menu.hand} 頻率設定`}
          className="fixed z-50 w-[240px] rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-[0_16px_40px_rgba(20,40,28,0.28)]"
          style={{
            left: Math.min(menu.x, window.innerWidth - 256),
            top: Math.min(menu.y, window.innerHeight - 220),
          }}
        >
          <div className="text-sm font-semibold text-[var(--ink)]">
            {menu.hand}
            <span className="ml-1.5 font-normal text-[var(--muted)]">
              {actionMeta(brush).label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            現況：{cellSummary(cells[menu.hand] ?? emptyCell())}
          </p>
          <label className="mt-3 block space-y-1.5">
            <span className="flex items-center justify-between text-xs text-[var(--muted)]">
              套用頻率
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
