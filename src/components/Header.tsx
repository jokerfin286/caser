"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useShell } from "@/components/shell-context";
import { api } from "@/lib/api";
import { formatMoney, timeAgo } from "@/lib/format";

const LINKS = [
  { href: "/inventory", label: "Инвентарь" },
  { href: "/cases", label: "Кейсы" },
  { href: "/upgrade", label: "Апгрейды" },
  { href: "/rewards", label: "Награды" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cases") return pathname === "/" || pathname.startsWith("/case");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const shell = useShell();
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setMenu(false);
        setBell(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0b0f]/80 backdrop-blur-xl">
      <div ref={root} className="mx-auto flex h-[72px] max-w-[1680px] items-center gap-4 px-4">
        <button type="button" className="btn-ghost h-10 min-h-0 px-3 lg:hidden" onClick={() => shell.setSidebarOpen(true)}>
          Лента
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center bg-[#c8f14f] font-display text-lg text-[#131608]">K</span>
          <span className="hidden font-display text-lg tracking-[0.08em] sm:inline">КЕЙСЕР</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} data-active={isActive(pathname, link.href)} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-[#c8f14f]/30 px-2 py-1 text-[10px] tracking-[0.16em] text-[#c8f14f] sm:inline">
            DEMO
          </span>
          <button
            type="button"
            onClick={() => (shell.user ? shell.setDepositOpen(true) : router.push("/login"))}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 py-1 pl-3 pr-1"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c8f14f] text-[11px] text-black">₽</span>
            <span className="max-w-[92px] truncate font-display text-xs tabular-nums sm:max-w-none sm:text-sm">{formatMoney(shell.user?.balance ?? 0)}</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#c8f14f] text-lg leading-none text-[#131608]">+</span>
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label="Уведомления"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10"
              onClick={() => {
                setBell((value) => !value);
                setMenu(false);
                if (shell.unread) void api("/api/notifications", { method: "POST" });
              }}
            >
              <BellIcon />
              {shell.unread > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ef4b4b] px-1 text-[10px]">
                  {shell.unread}
                </span>
              ) : null}
            </button>
            {bell ? (
              <div className="absolute right-0 top-12 w-[320px] rounded-2xl border border-white/10 bg-[#13151b] p-3 shadow-2xl">
                <p className="mb-2 font-display text-sm">Уведомления</p>
                <div className="max-h-80 space-y-2 overflow-auto">
                  {shell.notifications.length ? (
                    shell.notifications.map((item) => (
                      <div key={item.id} className="rounded-xl bg-white/5 p-2">
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs text-white/55">{item.body}</p>
                        <p className="mt-1 text-[11px] text-white/35">{timeAgo(item.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/45">Пока тихо.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          {shell.user ? (
            <div className="relative">
              <button type="button" className="rounded-full" onClick={() => { setMenu((value) => !value); setBell(false); }}>
                <Avatar hue={shell.user.avatarHue} name={shell.user.nickname} url={shell.user.avatarUrl} size={40} />
              </button>
              {menu ? (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10 bg-[#13151b] p-2 shadow-2xl">
                  <p className="px-2 py-1 font-display">{shell.user.nickname}</p>
                  <p className="px-2 pb-2 text-xs text-white/40">
                    {shell.user.isSteam ? shell.user.steamId : "локальный аккаунт"}
                  </p>
                  <Link href="/profile" className="block rounded-lg px-2 py-2 text-sm hover:bg-white/5" onClick={() => setMenu(false)}>
                    Профиль
                  </Link>
                  <Link href="/rewards" className="block rounded-lg px-2 py-2 text-sm hover:bg-white/5" onClick={() => setMenu(false)}>
                    Награды
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5"
                    onClick={() => shell.setSound(!shell.sound)}
                  >
                    Звук: {shell.sound ? "вкл" : "выкл"}
                  </button>
                  <button type="button" className="block w-full rounded-lg px-2 py-2 text-left text-sm text-[#ffb4b4] hover:bg-white/5" onClick={() => void logout()}>
                    Выйти
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="btn-lime h-10 min-h-0 px-3 text-[11px]">
              Steam
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
