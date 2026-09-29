"use client";

import Link from "next/link";
import { DropFeed } from "@/components/DropFeed";
import { useShell } from "@/components/shell-context";

export function Sidebar() {
  const shell = useShell();
  return (
    <>
      <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[300px] shrink-0 overflow-y-auto px-3 py-4 lg:block">
        <SidebarBody />
      </aside>
      {shell.sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Закрыть" onClick={() => shell.setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[320px] overflow-y-auto bg-[#0e1014] p-4 shadow-2xl">
            <SidebarBody onNavigate={() => shell.setSidebarOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const shell = useShell();
  return (
    <div className="space-y-4">
      <Link href="/case/chicken-farm" onClick={onNavigate} className="hud block overflow-hidden">
        <div className="relative h-36">
          <img src="/images/banner-operation.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <img src="/images/mascot.jpg" alt="" className="absolute -bottom-2 right-2 h-24 w-24 rounded-full object-cover ring-2 ring-[#c8f14f]/60" />
        </div>
        <div className="p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#c8f14f]">Операция</p>
          <p className="font-display text-lg leading-tight">Chicken Farm</p>
          <span className="btn-lime mt-3 h-9 min-h-0 w-full text-[11px]">К кейсу</span>
        </div>
      </Link>
      <div className="hud flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
          <span className="live-dot" />
          Online
        </div>
        <span className="font-display text-lg tabular-nums">{shell.online.toLocaleString("ru-RU")}</span>
      </div>
      <div className="hud p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">Вид</p>
          <div className="flex gap-1">
            <button type="button" className={`rounded-lg px-2 py-1 text-xs ${shell.viewMode === "grid" ? "bg-[#c8f14f] text-black" : "bg-white/5"}`} onClick={() => shell.setViewMode("grid")}>
              Сетка
            </button>
            <button type="button" className={`rounded-lg px-2 py-1 text-xs ${shell.viewMode === "list" ? "bg-[#c8f14f] text-black" : "bg-white/5"}`} onClick={() => shell.setViewMode("list")}>
              Список
            </button>
          </div>
        </div>
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Последние дропы</p>
        <DropFeed drops={shell.drops} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost h-10 flex-1 text-[11px]" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Наверх
        </button>
        <button type="button" className="btn-copper h-10 flex-1 text-[11px]" onClick={() => shell.setChatOpen(true)}>
          Чат
        </button>
      </div>
    </div>
  );
}
