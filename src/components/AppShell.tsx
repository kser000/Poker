"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SIDEBAR_POS_KEY = "poker-sidebar-pos-v1";
const SIDEBAR_COLLAPSE_KEY = "poker-sidebar-collapsed-v1";

const NAV = [
  { href: "/designer", label: "範圍設計器" },
  { href: "/ranges", label: "我的範圍表" },
] as const;

type Pos = { x: number; y: number };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: 12, y: 12 });
  const [ready, setReady] = useState(false);
  const drag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_POS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pos;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(parsed);
        }
      }
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SIDEBAR_POS_KEY, JSON.stringify(pos));
  }, [pos, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, ready]);

  function onDragStart(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  }

  function onDragMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 80, drag.current.origX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 80, drag.current.origY + dy)),
    });
  }

  function onDragEnd() {
    drag.current = null;
  }

  return (
    <div className="relative min-h-screen">
      <aside
        className="fixed z-40 select-none rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_94%,transparent)] shadow-[0_12px_36px_rgba(20,40,28,0.18)] backdrop-blur-md"
        style={{
          left: pos.x,
          top: pos.y,
          width: collapsed ? "auto" : 200,
        }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="flex cursor-grab items-center justify-between gap-2 px-3 py-2 active:cursor-grabbing">
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-[var(--felt-deep)]">
              撲克學習站
            </p>
            {!collapsed ? (
              <p className="text-[10px] text-[var(--muted)]">拖曳可移動選單</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md border border-[var(--line)] bg-white/70 px-2 py-1 text-xs text-[var(--ink)] hover:bg-white"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "展開側欄" : "收合側欄"}
          >
            {collapsed ? "展開" : "收合"}
          </button>
        </div>

        {!collapsed ? (
          <nav className="border-t border-[var(--line)] px-2 py-2" aria-label="主要導覽">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2.5 py-2 text-sm transition"
                      style={{
                        backgroundColor: active
                          ? "color-mix(in oklab, var(--accent) 18%, transparent)"
                          : "transparent",
                        color: active ? "var(--accent)" : "var(--ink)",
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </aside>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </div>
  );
}
