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

export type CellMap = Record<string, ActionId>;

export type RangeChart = {
  id: string;
  name: string;
  position: Position;
  note: string;
  cells: CellMap;
  updatedAt: string;
};

export const STORAGE_KEY = "poker-ranges-v1";

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
      cells[handLabel(r, c)] = "fold";
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

export function loadRanges(): RangeChart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RangeChart[];
    return Array.isArray(parsed) ? parsed : [];
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
