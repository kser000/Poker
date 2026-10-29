"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/designer", label: "範圍設計器" },
  { href: "/ranges", label: "我的範圍表" },
] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block size-5" aria-hidden>
      <span
        className="absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-transform duration-200"
        style={{
          top: open ? 9 : 3,
          transform: open ? "rotate(45deg)" : undefined,
        }}
      />
      <span
        className="absolute left-0 top-[9px] block h-[2px] w-5 rounded-full bg-current transition-opacity duration-200"
        style={{ opacity: open ? 0 : 1 }}
      />
      <span
        className="absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-transform duration-200"
        style={{
          top: open ? 9 : 15,
          transform: open ? "rotate(-45deg)" : undefined,
        }}
      />
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        className="fixed left-3 top-3 z-50 inline-flex size-11 items-center justify-center rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_94%,transparent)] text-[var(--ink)] shadow-[0_8px_24px_rgba(20,40,28,0.16)] backdrop-blur-md transition hover:bg-white"
        aria-label={open ? "關閉選單" : "開啟選單"}
        aria-expanded={open}
        aria-controls="main-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <HamburgerIcon open={open} />
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--ink)_45%,transparent)] backdrop-blur-[2px]"
          aria-label="關閉選單背景"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="main-drawer"
        className="fixed left-0 top-0 z-50 flex h-full w-[min(280px,86vw)] flex-col border-r border-[var(--line)] bg-[var(--panel)] shadow-[8px_0_40px_rgba(20,40,28,0.22)] transition-transform duration-200 ease-out"
        style={{
          transform: open ? "translateX(0)" : "translateX(-105%)",
          pointerEvents: open ? "auto" : "none",
        }}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-4 pl-16">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--felt-deep)]">
              撲克學習站
            </p>
            <p className="text-xs text-[var(--muted)]">導覽選單</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3" aria-label="主要導覽">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-3 text-base transition"
                    style={{
                      backgroundColor: active
                        ? "color-mix(in oklab, var(--accent) 16%, transparent)"
                        : "transparent",
                      color: active ? "var(--accent)" : "var(--ink)",
                      fontWeight: active ? 700 : 500,
                    }}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 pt-16 sm:px-6 sm:py-12 sm:pt-16">
        {children}
      </div>
    </div>
  );
}
