import { RangeWorkspace } from "@/components/RangeWorkspace";

export default function Home() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-10 animate-rise">
        <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--felt-deep)] sm:text-5xl">
          撲克學習站
        </p>
        <h1 className="mt-3 max-w-2xl text-xl font-medium text-[var(--ink)] sm:text-2xl">
          翻前範圍設計器
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          拖曳為 169 種起手牌標記行動與頻率（可多色疊加），右鍵調整比例，命名後存到本機。筆記與策略記錄將於之後版本加入。
        </p>
      </header>

      <main className="animate-rise-delay rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_88%,transparent)] p-4 shadow-[0_20px_60px_rgba(20,40,28,0.12)] backdrop-blur-sm sm:p-6">
        <RangeWorkspace />
      </main>

      <footer className="mt-10 text-sm text-[var(--muted)]">
        V1 · 僅供個人學習 · 無真實金流 · 無多人對戰
      </footer>
    </div>
  );
}
