import { RangesList } from "@/components/RangesList";

export default function RangesPage() {
  return (
    <>
      <header className="mb-8 animate-rise">
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--felt-deep)] sm:text-4xl">
          撲克學習站
        </p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          瀏覽已存範圍表，開啟編輯或刪除。列表來自 SQLite，並以瀏覽器快取加速顯示。
        </p>
      </header>

      <main className="animate-rise-delay rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_88%,transparent)] p-4 shadow-[0_20px_60px_rgba(20,40,28,0.12)] backdrop-blur-sm sm:p-6">
        <RangesList />
      </main>

      <footer className="mt-10 text-sm text-[var(--muted)]">
        V1 · 資料目錄 E:\Poker\db
      </footer>
    </>
  );
}
