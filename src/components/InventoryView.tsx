"use client";

import Link from "next/link";
import { useState } from "react";
import { SkinCard } from "@/components/SkinCard";
import { useShell } from "@/components/shell-context";
import { api, publishUser, toast } from "@/lib/api";
import { formatMoney, timeAgo } from "@/lib/format";
import type { InventoryDTO, SkinDTO, UpgradeDTO, UserDTO } from "@/lib/types";

type OpenRow = { id: number; value: number; roll: number; createdAt: string; caseName: string; skin: SkinDTO };

export function InventoryView({
  items,
  sold,
  upgrades,
  opens,
}: {
  items: InventoryDTO[];
  sold: InventoryDTO[];
  upgrades: UpgradeDTO[];
  opens: OpenRow[];
}) {
  const shell = useShell();
  const [tab, setTab] = useState<"items" | "history" | "upgrades">("items");
  const [owned, setOwned] = useState(items);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  async function sell(ids: number[]) {
    if (!ids.length) return;
    setBusy(true);
    try {
      const data = await api<{ user: UserDTO; sum: number }>("/api/inventory/sell", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      publishUser(data.user);
      setOwned((prev) => prev.filter((item) => !ids.includes(item.id)));
      setPicked([]);
      toast(`Продано на ${formatMoney(data.sum)}`, "ok");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Продажа не прошла", "bad");
    } finally {
      setBusy(false);
    }
  }

  const sum = owned.reduce((total, item) => total + item.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">Склад</p>
          <h1 className="font-display text-4xl">Инвентарь</h1>
          <p className="mt-1 text-sm text-white/50">{owned.length} предм. · {formatMoney(sum)}</p>
        </div>
        {tab === "items" && owned.length ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={busy || !picked.length} onClick={() => void sell(picked)}>Продать выбранные</button>
            <button type="button" className="btn-copper" disabled={busy} onClick={() => void sell(owned.map((item) => item.id))}>Продать все</button>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        {[
          ["items", "Предметы"],
          ["history", "История"],
          ["upgrades", "Апгрейды"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id as typeof tab)} className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.12em] ${tab === id ? "bg-[#c8f14f] text-black" : "bg-white/5"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "items" ? (
        owned.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {owned.map((item) => (
              <SkinCard
                key={item.id}
                skin={item.skin}
                value={item.value}
                wear={item.wear}
                floatThousandths={item.floatThousandths}
                stattrak={item.stattrak}
                selected={picked.includes(item.id)}
                onClick={() => setPicked((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))}
                footer={
                  <div className="flex gap-2 pt-2">
                    <button type="button" className="btn-ghost h-9 min-h-0 flex-1 text-[10px]" onClick={(event) => { event.stopPropagation(); void sell([item.id]); }}>Продать</button>
                    <Link href={`/upgrade?items=${item.id}`} className="btn-lime h-9 min-h-0 flex-1 text-[10px]" onClick={(event) => event.stopPropagation()}>Апгрейд</Link>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <div className="hud p-10 text-center">
            <p className="font-display text-2xl">У вас нет предметов</p>
            <p className="mt-2 text-white/55">Открой свой первый кейс — рулетка уже прогрета.</p>
            <Link href="/cases" className="btn-lime mt-5">Открыть кейс</Link>
          </div>
        )
      ) : null}
      {tab === "history" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="hud p-4">
            <h2 className="font-display text-xl">Открытия</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {opens.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-white/5 py-2">
                  <span className="min-w-0 truncate">{item.caseName}: {item.skin.name}</span>
                  <span className="shrink-0 text-white/45">{formatMoney(item.value)} · {timeAgo(item.createdAt)}</span>
                </li>
              ))}
              {!opens.length ? <li className="text-white/40">Открытий ещё не было.</li> : null}
            </ul>
          </div>
          <div className="hud p-4">
            <h2 className="font-display text-xl">Продажи</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {sold.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-white/5 py-2">
                  <span className="truncate">{item.skin.name}</span>
                  <span>{formatMoney(item.value)}</span>
                </li>
              ))}
              {!sold.length ? <li className="text-white/40">Продаж пока нет.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
      {tab === "upgrades" ? (
        <div className="space-y-2">
          {upgrades.map((item) => (
            <div key={item.id} className="hud flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className={item.success ? "text-[#c8f14f]" : "text-[#ffb4b4]"}>{item.success ? "Успех" : "Сгорел"}</p>
                <p className="font-medium">{item.target.name}</p>
                <p className="text-xs text-white/45">{item.stakeNote} · {(item.chanceBps / 100).toFixed(2)}% · {timeAgo(item.createdAt)}</p>
              </div>
              <span className="font-display">{formatMoney(item.stakeValue)}</span>
            </div>
          ))}
          {!upgrades.length ? <div className="hud p-8 text-center text-white/50">Апгрейдов ещё не было.</div> : null}
        </div>
      ) : null}
      {shell.user ? null : null}
    </div>
  );
}
