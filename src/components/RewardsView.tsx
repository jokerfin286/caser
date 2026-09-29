"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useShell } from "@/components/shell-context";
import { api, publishUser, toast } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { UserDTO } from "@/lib/types";

type Rewards = {
  daily: { available: boolean; streak: number; amount: number; nextStreak: number };
  milestones: { key: string; title: string; hint: string; goal: number; reward: number; progress: number; claimed: boolean; ready: boolean }[];
  coupons: { code: string; amount: number; description: string; redeemed: boolean }[];
  leaderboard: { rank: number; nickname: string; avatarHue: number; bestDropName: string | null; bestDropValue: number; casesOpened: number; isMe: boolean }[];
};

export function RewardsView({ initial }: { initial: Rewards }) {
  const shell = useShell();
  const [data, setData] = useState(initial);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setData(await api<Rewards>("/api/rewards"));
  }

  async function claim(key: string) {
    if (!shell.user) {
      toast("Сначала войдите через Steam", "info");
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ user: UserDTO; amount: number }>("/api/rewards", {
        method: "POST",
        body: JSON.stringify({ action: "milestone", key }),
      });
      publishUser(result.user);
      toast(`Начислено ${formatMoney(result.amount)}`, "ok");
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Не получилось", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function coupon() {
    setBusy(true);
    try {
      const result = await api<{ user: UserDTO; amount: number }>("/api/rewards", {
        method: "POST",
        body: JSON.stringify({ action: "coupon", code }),
      });
      publishUser(result.user);
      toast(`Купон: +${formatMoney(result.amount)}`, "ok");
      setCode("");
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Купон не прошёл", "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">Бонусы</p>
        <h1 className="font-display text-4xl">Награды</h1>
      </div>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="hud overflow-hidden p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">Ежедневный ящик монет</p>
          <h2 className="mt-2 font-display text-3xl">{formatMoney(data.daily.amount)}</h2>
          <p className="mt-2 text-white/60">Серия {data.daily.streak} · следующая {data.daily.nextStreak}. Каждый день +15 ₽, потолок 250 ₽.</p>
          <button type="button" className="btn-lime mt-5" disabled={busy || !data.daily.available} onClick={() => void claim("daily")}>
            {data.daily.available ? "Забрать" : "Уже получено"}
          </button>
        </div>
        <div className="hud p-6">
          <h2 className="font-display text-2xl">Купон</h2>
          <p className="mt-2 text-sm text-white/55">CHICKEN, FARM100, KEISER200</p>
          <div className="mt-4 flex gap-2">
            <input className="field uppercase" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Код" />
            <button type="button" className="btn-copper" disabled={busy} onClick={() => void coupon()}>Ок</button>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.coupons.map((item) => (
              <li key={item.code} className="flex justify-between gap-3 text-white/70">
                <span>{item.code} · {item.description}</span>
                <span>{item.redeemed ? "использован" : formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.milestones.map((item) => (
          <article key={item.key} className="hud p-4">
            <p className="font-display text-lg">{item.title}</p>
            <p className="mt-1 text-sm text-white/50">{item.hint}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[#c8f14f]" style={{ width: `${Math.min(100, (item.progress / item.goal) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/45">{item.progress} / {item.goal} · {formatMoney(item.reward)}</p>
            <button type="button" className="btn-ghost mt-3 h-9 min-h-0 w-full text-[10px]" disabled={busy || item.claimed || !item.ready} onClick={() => void claim(item.key)}>
              {item.claimed ? "Получено" : item.ready ? "Забрать" : "Ещё рано"}
            </button>
          </article>
        ))}
      </section>
      <section className="hud p-4">
        <h2 className="font-display text-2xl">Лидерборд по лучшему дропу</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-white/40">
              <tr>
                <th className="py-2">#</th>
                <th>Игрок</th>
                <th>Лучший дроп</th>
                <th>Кейсы</th>
                <th className="text-right">Цена</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((row) => (
                <tr key={row.rank} className={row.isMe ? "bg-[#c8f14f]/10" : ""}>
                  <td className="py-3">{row.rank}</td>
                  <td>
                    <span className="flex items-center gap-2">
                      <Avatar hue={row.avatarHue} name={row.nickname} size={28} />
                      {row.nickname}
                    </span>
                  </td>
                  <td className="text-white/70">{row.bestDropName ?? "—"}</td>
                  <td>{row.casesOpened}</td>
                  <td className="text-right font-display">{formatMoney(row.bestDropValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
