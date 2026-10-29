import { Suspense } from "react";
import { RangeWorkspace } from "@/components/RangeWorkspace";

export default function DesignerPage() {
  return (
    <>
      <header className="mb-8 animate-rise">
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--felt-deep)] sm:text-4xl">
          撲克學習站
        </p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          拖曳標記行動與頻率（可多色疊加），右鍵調整比例，懸停放大查看。資料存於本機
          E 槽 Poker 目錄。
        </p>
      </header>

      <main className="animate-rise-delay rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_88%,transparent)] p-4 shadow-[0_20px_60px_rgba(20,40,28,0.12)] backdrop-blur-sm sm:p-6">
        <Suspense
          fallback={
            <div className="p-8 text-[var(--muted)]">載入設計器…</div>
          }
        >
          <RangeWorkspace />
        </Suspense>
      </main>

      <footer className="mt-10 text-sm text-[var(--muted)]">
        V1 · 僅供個人學習 · 無真實金流 · 無多人對戰
      </footer>
    </>
  );
}
