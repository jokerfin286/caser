"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useShell } from "@/components/shell-context";
import { api, publishUser, toast } from "@/lib/api";
import { formatMoney, METHOD_LABELS, timeAgo } from "@/lib/format";
import type { TxDTO, UserDTO, WithdrawalDTO } from "@/lib/types";

const METHODS = ["card", "sbp", "crypto", "steam"];

export function ProfileView({
  initialUser,
  transactions,
  withdrawals,
  rank,
}: {
  initialUser: UserDTO;
  transactions: TxDTO[];
  withdrawals: WithdrawalDTO[];
  rank: number;
}) {
  const shell = useShell();
  const user = shell.user ?? initialUser;
  const [tradeUrl, setTradeUrl] = useState(user.tradeUrl ?? "");
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState("card");
  const [destination, setDestination] = useState("");
  const [cashouts, setCashouts] = useState(withdrawals);
  const [txs, setTxs] = useState(transactions);
  const [busy, setBusy] = useState(false);

  const bars = useMemo(() => {
    const slice = [...txs].slice(0, 12).reverse();
    const max = Math.max(1, ...slice.map((item) => Math.abs(item.amount)));
    return slice.map((item) => ({ ...item, h: Math.max(8, (Math.abs(item.amount) / max) * 72) }));
  }, [txs]);

  async function saveUrl() {
    setBusy(true);
    try {
      const data = await api<{ user: UserDTO }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ tradeUrl }),
      });
      publishUser(data.user);
      toast("Trade URL сохранён", "ok");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Не сохранилось", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function cashout() {
    setBusy(true);
    try {
      const data = await api<{ user: UserDTO; withdrawal: WithdrawalDTO }>("/api/balance", {
        method: "POST",
        body: JSON.stringify({ action: "withdraw", amount, method, destination }),
      });
      publishUser(data.user);
      setCashouts((prev) => [data.withdrawal, ...prev]);
      setTxs((prev) => [
        {
          id: Date.now(),
          type: "withdraw",
          amount: -data.withdrawal.amount,
          note: `Заявка #${data.withdrawal.id}`,
          createdAt: data.withdrawal.createdAt,
        },
        ...prev,
      ]);
      toast("Заявка создана и ждёт рассмотрения", "ok");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Вывод не создан", "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="hud flex flex-wrap items-center gap-4 p-5">
        <Avatar hue={user.avatarHue} name={user.nickname} url={user.avatarUrl} size={72} />
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#c8f14f]">Профиль</p>
          <h1 className="font-display text-3xl">{user.nickname}</h1>
          <p className="text-sm text-white/50">
            {user.isSteam ? `SteamID ${user.steamId}` : "Локальный аккаунт (без Steam)"}
          </p>
          <p className="text-sm text-white/50">На площадке с {new Date(user.createdAt).toLocaleDateString("ru-RU")} · место #{rank}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-white/40">Баланс</p>
          <p className="font-display text-3xl text-[#c8f14f]">{formatMoney(user.balance)}</p>
          <button type="button" className="btn-ghost mt-2 h-9 min-h-0" onClick={() => shell.setDepositOpen(true)}>Пополнить</button>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Кейсы", String(user.casesOpened)],
          ["Апгрейды", `${user.upgradesWon}/${user.upgradesDone}`],
          ["Лучший дроп", user.bestDropName ?? "—"],
          ["Сумма дропа", formatMoney(user.totalDropValue)],
        ].map(([label, value]) => (
          <article key={label} className="hud p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">{label}</p>
            <p className="mt-2 truncate font-display text-xl">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="hud p-4" id="withdraw">
          <h2 className="font-display text-2xl">Вывод</h2>
          <p className="mt-1 text-sm text-white/50">Заявка списывает демо-баланс и остаётся в статусе «на рассмотрении». Реальная выплата не уходит.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {METHODS.map((item) => (
              <button key={item} type="button" onClick={() => setMethod(item)} className={`rounded-xl border px-3 py-2 text-sm ${method === item ? "border-[#c8f14f]" : "border-white/10"}`}>
                {METHOD_LABELS[item]}
              </button>
            ))}
          </div>
          <input className="field mt-3" type="number" min={100} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <input className="field mt-2" placeholder="Карта, кошелёк или SteamID" value={destination} onChange={(event) => setDestination(event.target.value)} />
          <button type="button" className="btn-copper mt-3" disabled={busy} onClick={() => void cashout()}>Создать заявку</button>
          <ul className="mt-4 space-y-2 text-sm">
            {cashouts.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 border-b border-white/5 py-2">
                <span>#{item.id} · {METHOD_LABELS[item.method] ?? item.method} · {item.destination}</span>
                <span className="shrink-0 text-white/50">{formatMoney(item.amount)} · {item.status === "pending" ? "на рассмотрении" : item.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="hud p-4">
          <h2 className="font-display text-2xl">История баланса</h2>
          <div className="mt-4 flex h-24 items-end gap-1">
            {bars.map((item) => (
              <div key={item.id} className="flex-1 rounded-t" style={{ height: item.h, background: item.amount >= 0 ? "#c8f14f" : "#ff5d5d" }} title={item.note ?? ""} />
            ))}
          </div>
          <ul className="mt-4 max-h-72 space-y-2 overflow-auto text-sm">
            {txs.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate">{item.note || item.type}</span>
                  <span className="text-xs text-white/35">{timeAgo(item.createdAt)}</span>
                </span>
                <span className={item.amount >= 0 ? "text-[#c8f14f]" : "text-[#ffb4b4]"}>{item.amount >= 0 ? "+" : ""}{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="hud p-4">
        <h2 className="font-display text-2xl">Настройки</h2>
        <label className="mt-3 block text-xs uppercase tracking-[0.14em] text-white/40">Trade URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input className="field" value={tradeUrl} onChange={(event) => setTradeUrl(event.target.value)} placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…" />
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void saveUrl()}>Сохранить</button>
        </div>
      </section>
    </div>
  );
}
