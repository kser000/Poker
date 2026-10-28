export const RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

export type Rank = (typeof RANKS)[number];

export type ActionId = "fold" | "call" | "raise" | "allin";

/** Non-fold paint actions that can share a cell. */
export type PaintActionId = Exclude<ActionId, "fold">;

export type Position =
  | "UTG"
  | "UTG+1"
  | "MP"
  | "LJ"
  | "HJ"
  | "CO"
  | "BTN"
  | "SB"
  | "BB";

export const POSITIONS: Position[] = [
  "UTG",
  "UTG+1",
  "MP",
  "LJ",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
];

export const ACTIONS: {
  id: ActionId;
  label: string;
  color: string;
  text: string;
}[] = [
  { id: "fold", label: "棄牌 Fold", color: "#e8ebe6", text: "#5c6558" },
  { id: "call", label: "跟注 Call", color: "#3d9a6a", text: "#ffffff" },
  { id: "raise", label: "加注 Raise", color: "#d64545", text: "#ffffff" },
  { id: "allin", label: "全下 All-in", color: "#c47b16", text: "#ffffff" },
];

const PAINT_IDS: PaintActionId[] = ["call", "raise", "allin"];

export type CellPart = {
  action: PaintActionId;
  frequency: number;
};

/** Empty `parts` = 棄牌／空白格. Multiple parts = multi-color split. */
export type CellState = {
  parts: CellPart[];
};

export type CellMap = Record<string, CellState>;

export type RangeChart = {
  id: string;
  name: string;
  position: Position;
  note: string;
  cells: CellMap;
  updatedAt: string;
};

export const STORAGE_KEY = "poker-ranges-v1";

export function clampFrequency(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function emptyCell(): CellState {
  return { parts: [] };
}

export function isPaintAction(id: string): id is PaintActionId {
  return PAINT_IDS.includes(id as PaintActionId);
}

export function cellTotal(cell: CellState): number {
  return cell.parts.reduce((sum, p) => sum + clampFrequency(p.frequency), 0);
}

export function normalizeParts(parts: CellPart[]): CellPart[] {
  const byAction = new Map<PaintActionId, number>();
  for (const part of parts) {
    if (!isPaintAction(part.action)) continue;
    const freq = clampFrequency(part.frequency);
    if (freq <= 0) continue;
    byAction.set(part.action, freq);
  }
  const ordered: CellPart[] = [];
  for (const id of PAINT_IDS) {
    const freq = byAction.get(id);
    if (freq) ordered.push({ action: id, frequency: freq });
  }
  return ordered;
}

/**
 * Apply brush to a cell.
 * - fold / 0% → clear
 * - else set that action’s frequency; keep other colors if sum ≤ 100%
 * - if sum would exceed 100% → overwrite cell with only the new paint
 */
export function applyPaint(
  cell: CellState,
  action: ActionId,
  frequency: number,
): CellState {
  const freq = clampFrequency(frequency);
  if (action === "fold" || freq <= 0) return emptyCell();
  if (!isPaintAction(action)) return emptyCell();

  const others = cell.parts.filter((p) => p.action !== action);
  const otherSum = others.reduce((s, p) => s + clampFrequency(p.frequency), 0);

  if (otherSum + freq > 100) {
    return { parts: [{ action, frequency: freq }] };
  }
  return { parts: normalizeParts([...others, { action, frequency: freq }]) };
}

/** Migrate legacy string / single-action / mix cells → multi-part CellState. */
export function normalizeCell(raw: unknown): CellState {
  if (typeof raw === "string") {
    if (raw === "fold" || raw === "mix") return emptyCell();
    if (isPaintAction(raw)) {
      return { parts: [{ action: raw, frequency: 100 }] };
    }
    return emptyCell();
  }
  if (!raw || typeof raw !== "object") return emptyCell();

  const obj = raw as {
    action?: unknown;
    frequency?: unknown;
    parts?: unknown;
  };

  if (Array.isArray(obj.parts)) {
    return { parts: normalizeParts(obj.parts as CellPart[]) };
  }

  if (typeof obj.action === "string") {
    if (obj.action === "fold" || obj.action === "mix") return emptyCell();
    if (isPaintAction(obj.action)) {
      const frequency =
        typeof obj.frequency === "number" ? clampFrequency(obj.frequency) : 100;
      if (frequency <= 0) return emptyCell();
      return { parts: [{ action: obj.action, frequency }] };
    }
  }

  return emptyCell();
}

export function normalizeCells(raw: unknown): CellMap {
  const base = emptyCells();
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Record<string, unknown>;
  for (const hand of Object.keys(base)) {
    if (hand in input) base[hand] = normalizeCell(input[hand]);
  }
  return base;
}

export function handLabel(row: number, col: number): string {
  const r1 = RANKS[row];
  const r2 = RANKS[col];
  if (row === col) return `${r1}${r2}`;
  if (col > row) return `${r1}${r2}s`;
  return `${r2}${r1}o`;
}

export function emptyCells(): CellMap {
  const cells: CellMap = {};
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      cells[handLabel(r, c)] = emptyCell();
    }
  }
  return cells;
}

export function createRange(
  partial?: Partial<Pick<RangeChart, "name" | "position" | "note">>,
): RangeChart {
  return {
    id: crypto.randomUUID(),
    name: partial?.name?.trim() || "未命名範圍",
    position: partial?.position || "BTN",
    note: partial?.note || "",
    cells: emptyCells(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeChart(raw: unknown): RangeChart | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<RangeChart> & { cells?: unknown };
  if (typeof obj.id !== "string") return null;
  return {
    id: obj.id,
    name: typeof obj.name === "string" ? obj.name : "未命名範圍",
    position: (POSITIONS.includes(obj.position as Position)
      ? obj.position
      : "BTN") as Position,
    note: typeof obj.note === "string" ? obj.note : "",
    cells: normalizeCells(obj.cells),
    updatedAt:
      typeof obj.updatedAt === "string"
        ? obj.updatedAt
        : new Date().toISOString(),
  };
}

export function loadRanges(): RangeChart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeChart)
      .filter((r): r is RangeChart => r !== null);
  } catch {
    return [];
  }
}

export function saveRanges(ranges: RangeChart[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ranges));
}

export function upsertRange(range: RangeChart): RangeChart[] {
  const list = loadRanges();
  const idx = list.findIndex((r) => r.id === range.id);
  const next = { ...range, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  saveRanges(list);
  return list;
}

export function deleteRange(id: string): RangeChart[] {
  const list = loadRanges().filter((r) => r.id !== id);
  saveRanges(list);
  return list;
}

export function actionMeta(id: ActionId) {
  return ACTIONS.find((a) => a.id === id) ?? ACTIONS[0];
}

export function cellSummary(cell: CellState): string {
  if (cell.parts.length === 0) return "棄牌";
  return cell.parts
    .map((p) => `${actionMeta(p.action).label} ${clampFrequency(p.frequency)}%`)
    .join(" · ");
}
