"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, toast } from "@/lib/api";
import type { UserDTO } from "@/lib/types";

export function LoginView() {
  const search = useSearchParams();
  const [nickname, setNickname] = useState("");
  const [pending, setPending] = useState(false);
  const steamError = search.get("error") === "steam";
  const next = search.get("next") || "/";

  async function loginDemo() {
    setPending(true);
    try {
      const data = await api<{ user: UserDTO }>("/api/auth/steam", {
        method: "POST",
        body: JSON.stringify({ nickname }),
      });
      toast(`Привет, ${data.user.nickname}`, "ok");
      window.location.href = next;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Вход не удался", "bad");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pt-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">Вход</p>
        <h1 className="mt-2 font-display text-3xl">КЕЙСЕР</h1>
      </div>

      {steamError ? (
        <div className="glass border-red-400/30 p-4 text-sm text-[#ffb4b4]">
          Steam не подтвердил вход. Попробуйте ещё раз или создайте аккаунт ниже.
        </div>
      ) : null}

      <section className="glass p-6">
        <h2 className="font-display text-lg">Через Steam</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Реальная авторизация Steam OpenID: редирект на steamcommunity.com и возврат с вашим SteamID. Пароль вводится только на стороне Steam.
        </p>
        <a href="/api/auth/steam/login" className="btn-lime mt-4 w-full">
          <SteamIcon />
          Войти через Steam
        </a>
      </section>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/30">
        <span className="h-px flex-1 bg-white/10" />
        или
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <section className="glass p-6">
        <h2 className="font-display text-lg">Создать аккаунт</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Локальный аккаунт без Steam: укажите ник — если он уже существует, вы войдёте в него.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void loginDemo();
          }}
        >
          <input
            className="field"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Никнейм (от 3 символов)"
          />
          <button type="submit" className="btn-ghost w-full" disabled={pending}>
            {pending ? "Создаём…" : "Продолжить"}
          </button>
        </form>
      </section>

      <p className="px-2 text-center text-xs leading-relaxed text-white/35">
        Баланс на площадке виртуальный. Новым игрокам начисляется 750 ₽.
      </p>
    </div>
  );
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-9.96 9.06l5.35 2.21a2.83 2.83 0 0 1 1.6-.49h.14l2.38-3.45v-.05a3.77 3.77 0 1 1 3.77 3.77h-.09l-3.4 2.43v.12a2.83 2.83 0 1 1-5.56.75l-3.83-1.58A10 10 0 1 0 12 2Zm-4.7 13.6 1.23.51a2.12 2.12 0 1 0 1.14-2.75l1.27.52a1.56 1.56 0 1 1-.82 2.05 1.55 1.55 0 0 1-2.82-.33Zm10-4.83a2.51 2.51 0 1 0-2.51-2.51 2.52 2.52 0 0 0 2.51 2.51Zm0-4.4a1.89 1.89 0 1 1-1.88 1.89 1.89 1.89 0 0 1 1.88-1.89Z" />
    </svg>
  );
}
