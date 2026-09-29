"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Countdown } from "@/components/Countdown";
import { Roulette } from "@/components/Roulette";
import { SkinCard } from "@/components/SkinCard";
import { SkinVisual } from "@/components/SkinVisual";
import { useShell } from "@/components/shell-context";
import { RARITY_META, WEAR_META, type Rarity } from "@/lib/catalog";
import { api, publishUser, toast } from "@/lib/api";
import { formatFloat, formatMoney, splitSkinName } from "@/lib/format";
import { rarityRank } from "@/lib/game";
import { playWin } from "@/lib/sound";
import type { CaseDTO, CaseSkinDTO, DropDTO, OpenResult, SkinDTO, UserDTO } from "@/lib/types";

type Detail = {
  case: CaseDTO;
  skins: CaseSkinDTO[];
  recent: DropDTO[];
  mine: { id: number; roll: number; value: number; createdAt: string; skin: SkinDTO }[];
};

export function CaseOpener({ detail }: { detail: Detail }) {
  const shell = useShell();
  const router = useRouter();
  const [count, setCount] = useState(1);
  const [fast, setFast] = useState(false);
  const [pending, setPending] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [winner, setWinner] = useState<SkinDTO | null>(detail.skins[0] ?? null);
  const [batch, setBatch] = useState<OpenResult[] | null>(null);
  const [modal, setModal] = useState(false);
  const [mine, setMine] = useState(detail.mine);
  const finishedSpin = useRef(0);
  const price = detail.case.price * count;
  const rare = batch?.some((item) => item.skin.rarity === "gold" || item.skin.rarity === "red");

  async function openCase() {
    if (!shell.user) {
      router.push(`/login?next=/case/${detail.case.id}`);
      return;
    }
    if (shell.user.balance < price) {
      shell.setDepositOpen(true);
      toast("Не хватает баланса — пополните демо-кошелёк", "bad");
      return;
    }
    setPending(true);
    setModal(false);
    try {
      const data = await api<{ results: OpenResult[]; user: UserDTO }>(`/api/cases/${detail.case.id}/open`, {
        method: "POST",
        body: JSON.stringify({ count }),
      });
      publishUser(data.user);
      const best = [...data.results].sort((a, b) => rarityRank(b.skin.rarity) - rarityRank(a.skin.rarity) || b.value - a.value)[0];
      setBatch(data.results);
      setWinner(best.skin);
      setSpinning(true);
      setSpinId((value) => value + 1);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Кейс не открылся", "bad");
    } finally {
      setPending(false);
    }
  }

  function finishSpin() {
    if (!batch || finishedSpin.current === spinId) return;
    finishedSpin.current = spinId;
    setSpinning(false);
    setModal(true);
    setMine((prev) => [
      ...batch.map((item, index) => ({
        id: Date.now() + index,
        roll: item.roll,
        value: item.value,
        createdAt: new Date().toISOString(),
        skin: item.skin,
      })),
      ...prev,
    ].slice(0, 10));
    playWin(batch.some((item) => item.skin.rarity === "gold" || item.skin.rarity === "red"));
  }

  async function sell(ids: number[]) {
    try {
      const data = await api<{ user: UserDTO; sum: number }>("/api/inventory/sell", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      publishUser(data.user);
      toast(`Продано на ${formatMoney(data.sum)}`, "ok");
      setModal(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Не продалось", "bad");
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/cases" className="text-xs uppercase tracking-[0.16em] text-white/45">← все кейсы</Link>
      <div className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
        <div className="case-frame relative aspect-square overflow-hidden rounded-3xl" style={{ ["--accent" as string]: detail.case.accent }}>
          <img src={detail.case.image} alt="" className="h-full w-full object-contain p-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {detail.case.label ? <span className="rounded-full bg-[#c8f14f] px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-black">{detail.case.label}</span> : null}
            <span className="text-xs uppercase tracking-[0.16em] text-white/45">{detail.case.tagline}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{detail.case.name}</h1>
          <p className="mt-3 max-w-2xl text-white/65">{detail.case.story}</p>
          {detail.case.timerEndsAt ? (
            <p className="mt-2 text-sm uppercase tracking-[0.14em] text-white/50">таймер <Countdown iso={detail.case.timerEndsAt} /></p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 5].map((value) => (
              <button key={value} type="button" onClick={() => setCount(value)} className={`h-10 rounded-xl px-3 text-sm ${count === value ? "bg-[#c8f14f] text-black" : "bg-white/5"}`}>
                x{value}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-2 text-sm text-white/60">
              <input type="checkbox" checked={fast} onChange={(event) => setFast(event.target.checked)} />
              Быстро
            </label>
          </div>
          <button type="button" className="btn-lime mt-4 px-8" disabled={pending || spinning} onClick={() => void openCase()}>
            {pending ? "Крутим сервер…" : `Открыть за ${formatMoney(price)}`}
          </button>
        </div>
      </div>

      <Roulette pool={detail.skins} winner={winner} spinId={spinId} fast={fast} onDone={finishSpin} />

      <section>
        <h2 className="mb-3 font-display text-2xl">Содержимое</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {detail.skins.map((skin) => (
            <SkinCard key={skin.id} skin={skin} chance={skin.chance} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="hud p-4">
          <h2 className="font-display text-xl">Последние открытия</h2>
          <ul className="mt-3 space-y-2">
            {detail.recent.map((drop) => (
              <li key={drop.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{drop.nickname}</span>
                <span className="truncate" style={{ color: RARITY_META[drop.rarity].color }}>{drop.skinName}</span>
                <span className="shrink-0 text-white/50">{formatMoney(drop.price)}</span>
              </li>
            ))}
            {!detail.recent.length ? <li className="text-sm text-white/40">Этот кейс ещё никто не открывал.</li> : null}
          </ul>
        </div>
        <div className="hud p-4">
          <h2 className="font-display text-xl">Ваши 10</h2>
          <ul className="mt-3 space-y-2">
            {mine.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{item.skin.name}</span>
                <span className="text-white/50">ролл {item.roll}</span>
                <span>{formatMoney(item.value)}</span>
              </li>
            ))}
            {!mine.length ? <li className="text-sm text-white/40">Откройте кейс — история появится здесь.</li> : null}
          </ul>
        </div>
      </section>

      <AnimatePresence>
        {modal && batch ? (
          <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/75 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 16, scale: 0.96 }} animate={{ y: 0, scale: 1 }} className="hud relative max-h-[90vh] w-full max-w-3xl overflow-auto p-5" role="dialog" aria-modal>
              {rare
                ? Array.from({ length: 24 }).map((_, index) => (
                    <span key={index} className="confetti" style={{ left: `${(index * 37) % 100}%`, animationDelay: `${index * 0.03}s`, background: index % 2 ? "#c8f14f" : "#f0b429" }} />
                  ))
                : null}
              <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">{batch.length > 1 ? "Выпало" : "Ваш дроп"}</p>
              <div className={`mt-4 grid gap-3 ${batch.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {batch.map((item) => {
                  const meta = RARITY_META[item.skin.rarity as Rarity];
                  const parts = splitSkinName(item.skin.name);
                  return (
                    <div key={item.inventoryId} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <SkinVisual image={item.skin.image} rarity={item.skin.rarity} className="h-40" pad="p-4" />
                      <div className="p-3">
                        <p className="text-xs uppercase tracking-[0.14em]" style={{ color: meta.color }}>{meta.label}</p>
                        <p className="font-display text-xl">{parts.weapon}</p>
                        <p>{parts.finish}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {item.stattrak ? "ST · " : ""}
                          {item.wear} · {WEAR_META[item.wear]} · {formatFloat(item.floatThousandths)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">Ролл {item.roll} / {item.rollMax}</p>
                        <p className="mt-2 font-display text-[#c8f14f]">{formatMoney(item.value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-copper" onClick={() => void sell(batch.map((item) => item.inventoryId))}>Продать</button>
                <Link href="/inventory" className="btn-ghost">В инвентарь</Link>
                <button type="button" className="btn-lime" onClick={() => setModal(false)}>Оставить</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
