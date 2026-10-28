"use client";

import { useCallback, useRef } from "react";
import {
  ACTIONS,
  ActionId,
  CellMap,
  RANKS,
  actionMeta,
  handLabel,
} from "@/lib/range";

type Props = {
  cells: CellMap;
  brush: ActionId;
  onPaint: (hand: string, action: ActionId) => void;
};

export function RangeGrid({ cells, brush, onPaint }: Props) {
  const painting = useRef(false);
  const lastHand = useRef<string | null>(null);

  const paint = useCallback(
    (hand: string) => {
      if (lastHand.current === hand) return;
      lastHand.current = hand;
      onPaint(hand, brush);
    },
    [brush, onPaint],
  );

  return (
    <div
      className="w-full overflow-x-auto pb-2"
      onPointerLeave={() => {
        painting.current = false;
        lastHand.current = null;
      }}
      onPointerUp={() => {
        painting.current = false;
        lastHand.current = null;
      }}
    >
      <div
        className="inline-grid min-w-[640px] select-none gap-px rounded-sm bg-[color-mix(in_oklab,var(--ink)_18%,transparent)] p-px shadow-[0_12px_40px_rgba(20,40,28,0.18)]"
        style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
        role="grid"
        aria-label="翻前 13×13 範圍矩陣"
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
              const action = cells[hand] ?? "fold";
              const meta = actionMeta(action);
              const isPair = row === col;
              return (
                <button
                  key={hand}
                  type="button"
                  role="gridcell"
                  aria-label={`${hand} ${meta.label}`}
                  className="relative h-10 touch-none text-[10px] font-semibold transition-[filter,transform] duration-75 hover:brightness-110 active:scale-[0.97] sm:h-11 sm:text-[11px]"
                  style={{
                    backgroundColor: meta.color,
                    color: meta.text,
                    boxShadow: isPair
                      ? "inset 0 0 0 1.5px rgba(20,40,28,0.28)"
                      : undefined,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLButtonElement).setPointerCapture(
                      e.pointerId,
                    );
                    painting.current = true;
                    lastHand.current = null;
                    paint(hand);
                  }}
                  onPointerEnter={() => {
                    if (painting.current) paint(hand);
                  }}
                >
                  {hand}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-[var(--muted)]">
        點選或按住拖曳上色。對角線為對子，右上為同花（s），左下為雜色（o）。
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
    </div>
  );
}
