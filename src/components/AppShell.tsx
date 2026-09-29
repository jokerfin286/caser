"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { ChatDrawer, DepositModal } from "@/components/Modals";
import { Sidebar } from "@/components/Sidebar";
import { DropFeed } from "@/components/DropFeed";
import { ShellProvider, type ShellValue } from "@/components/shell-context";
import { api } from "@/lib/api";
import { loadSoundEnabled, setSoundEnabled, syncSoundEnabled } from "@/lib/sound";
import type { BootstrapDTO, DropDTO, NoticeDTO, UserDTO } from "@/lib/types";

type Toast = { id: number; text: string; tone: "ok" | "bad" | "info" };

export function AppShell({ initial, children }: { initial: BootstrapDTO; children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(initial.user);
  const [online, setOnline] = useState(initial.online);
  const [drops, setDrops] = useState<DropDTO[]>(initial.drops);
  const [notifications, setNotifications] = useState<NoticeDTO[]>(initial.notifications);
  const [unread, setUnread] = useState(initial.unread);
  const [viewMode, setViewModeState] = useState<"grid" | "list">("grid");
  const [sound, setSoundState] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("keiser-view");
    if (stored === "list" || stored === "grid") setViewModeState(stored);
    const enabled = loadSoundEnabled();
    setSoundState(enabled);
    syncSoundEnabled(enabled);
  }, []);

  useEffect(() => {
    const onUser = (event: Event) => setUser((event as CustomEvent<UserDTO>).detail);
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Toast>).detail;
      setToasts((prev) => [...prev, detail].slice(-4));
      window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== detail.id)), 3200);
    };
    window.addEventListener("keiser:user", onUser);
    window.addEventListener("keiser:toast", onToast);
    return () => {
      window.removeEventListener("keiser:user", onUser);
      window.removeEventListener("keiser:toast", onToast);
    };
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let poll: number | null = null;
    let got = false;
    const apply = (payload: { online: number; drops: DropDTO[]; balance: number | null; notifications: NoticeDTO[]; unread: number }) => {
      setOnline(payload.online);
      setDrops(payload.drops);
      setNotifications(payload.notifications ?? []);
      setUnread(payload.unread ?? 0);
      if (payload.balance != null) {
        setUser((prev) => (prev ? { ...prev, balance: payload.balance as number } : prev));
      }
    };
    const startPoll = () => {
      if (poll) return;
      poll = window.setInterval(() => {
        void api<{ online: number; drops: DropDTO[]; balance: number | null; notifications: NoticeDTO[]; unread: number }>("/api/feed")
          .then(apply)
          .catch(() => {});
      }, 5000);
    };
    try {
      source = new EventSource("/api/live");
      source.onmessage = (event) => {
        got = true;
        apply(JSON.parse(event.data));
      };
      source.onerror = () => {
        source?.close();
        startPoll();
      };
    } catch {
      startPoll();
    }
    const fail = window.setTimeout(() => {
      if (!got) {
        source?.close();
        startPoll();
      }
    }, 7000);
    return () => {
      window.clearTimeout(fail);
      source?.close();
      if (poll) window.clearInterval(poll);
    };
  }, []);

  const value: ShellValue = {
    user,
    online,
    drops,
    notifications,
    unread,
    viewMode,
    setViewMode: (mode) => {
      setViewModeState(mode);
      localStorage.setItem("keiser-view", mode);
    },
    sound,
    setSound: (next) => {
      setSoundState(next);
      setSoundEnabled(next);
    },
    depositOpen,
    setDepositOpen,
    chatOpen,
    setChatOpen,
    sidebarOpen,
    setSidebarOpen,
    refresh: async () => {
      const data = await api<BootstrapDTO>("/api/bootstrap");
      setUser(data.user);
      setOnline(data.online);
      setDrops(data.drops);
      setNotifications(data.notifications);
      setUnread(data.unread);
    },
  };

  return (
    <ShellProvider value={value}>
      <Header />
      <div className="border-b border-white/5 px-4 py-2 lg:hidden">
        <DropFeed drops={drops} compact />
      </div>
      <div className="mx-auto flex max-w-[1680px]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 lg:px-6">{children}</main>
      </div>
      <MobileNav />
      <DepositModal />
      <ChatDrawer />
      <div className="pointer-events-none fixed bottom-20 right-4 z-[65] flex w-[min(100%-2rem,320px)] flex-col gap-2">
        {toasts.map((item) => (
          <div key={item.id} className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-xl ${item.tone === "bad" ? "border-red-400/40 bg-[#241214]" : item.tone === "ok" ? "border-[#c8f14f]/40 bg-[#161b0e]" : "border-white/10 bg-[#13151b]"}`}>
            {item.text}
          </div>
        ))}
      </div>
      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/40">
        КЕЙСЕР — демонстрационная платформа. Баланс виртуальный: реальные платежи, вывод денег и обмен скинов Steam не выполняются.
      </footer>
    </ShellProvider>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const items = [
    { href: "/cases", label: "Кейсы" },
    { href: "/upgrade", label: "Апгрейд" },
    { href: "/inventory", label: "Инвентарь" },
    { href: "/rewards", label: "Награды" },
    { href: "/profile", label: "Профиль" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0c0b0a]/95 md:hidden">
      {items.map((item) => {
        const active = item.href === "/cases" ? pathname === "/" || pathname.startsWith("/case") : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`px-1 py-3 text-center text-[10px] uppercase tracking-[0.08em] ${active ? "text-[#c8f14f]" : "text-white/45"}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
