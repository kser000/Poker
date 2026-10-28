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

export type ActionId = "fold" | "call" | "raise" | "allin" | "mix";

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
  { id: "mix", label: "混合 Mix", color: "#2f6fed", text: "#ffffff" },
];

/** Per-hand action with frequency 0–100 (percent of cell filled). */
export type CellState = {
  action: ActionId;
  frequency: number;
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

export function cellState(
  action: ActionId = "fold",
  frequency = 100,
): CellState {
  return { action, frequency: clampFrequency(frequency) };
}

/** Migrate legacy `ActionId` string cells or partial objects → CellState. */
export function normalizeCell(raw: unknown): CellState {
  if (typeof raw === "string") {
    const action = (ACTIONS.some((a) => a.id === raw) ? raw : "fold") as ActionId;
    return cellState(action, 100);
  }
  if (raw && typeof raw === "object") {
    const obj = raw as { action?: unknown; frequency?: unknown };
    const action =
      typeof obj.action === "string" && ACTIONS.some((a) => a.id === obj.action)
        ? (obj.action as ActionId)
        : "fold";
    const frequency =
      typeof obj.frequency === "number" ? obj.frequency : 100;
    return cellState(action, frequency);
  }
  return cellState("fold", 100);
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
      cells[handLabel(r, c)] = cellState("fold", 100);
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
