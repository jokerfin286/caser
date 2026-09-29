"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkinCard } from "@/components/SkinCard";
import { SkinVisual } from "@/components/SkinVisual";
import { UpgradeWheel } from "@/components/UpgradeWheel";
import { useShell } from "@/components/shell-context";
import { api, publishUser, toast } from "@/lib/api";
import { formatMoney, splitSkinName } from "@/lib/format";
import { isRare, upgradeChanceBps } from "@/lib/game";
import { playFail, playWin } from "@/lib/sound";
import type { InventoryDTO, SkinDTO, UserDTO } from "@/lib/types";

type UpgradeResponse = {
  success: boolean;
  chanceBps: number;
  stake: number;
  won: { inventoryId: number; wear: string; floatThousandths: number; value: number; skin: SkinDTO } | null;
  target: SkinDTO;
  user: UserDTO;
};

export function UpgradeStudio({ skins, initialItems }: { skins: SkinDTO[]; initialItems: InventoryDTO[] }) {
  const shell = useShell();
  const router = useRouter();
  const search = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<number[]>(() =>
    (search.get("items") ?? "")
      .split(",")
      .map(Number)
      .filter((id) => initialItems.some((item) => item.id === id)),
  );
  const [targetId, setTargetId] = useState<string | null>(search.get("target"));
  const [stake, setStake] = useState(0);
  const [tab, setTab] = useState<"mine" | "targets">("targets");
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [onlyRicher, setOnlyRicher] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [result, setResult] = useState<UpgradeResponse | null>(null);
  const [locked, setLocked] = useState(false);

  const selectedItems = items.filter((item) => selected.includes(item.id));
  const itemsValue = selectedItems.reduce((sum, item) => sum + item.value, 0);
  const target = skins.find((skin) => skin.id === targetId) ?? null;
  const balance = shell.user?.balance ?? 0;
  const balanceStake = Math.min(stake, balance);
  const totalStake = itemsValue + balanceStake;
  const bps = target ? upgradeChanceBps(totalStake, target.price) : 0;

  const catalog = useMemo(() => {
    return skins.filter((skin) => {
      if (rarity !== "all" && skin.rarity !== rarity) return false;
      if (query && !skin.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (onlyRicher && totalStake > 0 && skin.price <= totalStake) return false;
      return true;
    });
  }, [onlyRicher, query, rarity, skins, totalStake]);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function stakeFor(percent: number) {
    if (!target) return;
    const need = Math.ceil((percent / 100 / 0.9) * target.price);
    setStake(Math.max(0, Math.min(balance, need - itemsValue)));
  }

  async function run() {
    if (!shell.user) {
      router.push("/login?next=/upgrade");
      return;
    }
    if (!target || totalStake <= 0 || target.price <= totalStake) {
      toast("Выберите цель дороже ставки", "bad");
      return;
    }
    setLocked(true);
    setResult(null);
    try {
      const data = await api<UpgradeResponse>("/api/upgrade", {
        method: "POST",
        body: JSON.stringify({ itemIds: selected, balanceStake, targetSkinId: target.id }),
      });
      setSuccess(data.success);
      setResult(data);
      setSpinning(true);
    } catch (error) {
      setLocked(false);
      toast(error instanceof Error ? error.message : "Апгрейд не запустился", "bad");
    }
  }

  async function finish() {
    setSpinning(false);
    setLocked(false);
    if (!result) return;
    publishUser(result.user);
    if (result.success) playWin(isRare(result.target.rarity));
    else playFail();
    setSelected([]);
    setStake(0);
    const fresh = await api<{ items: InventoryDTO[] }>("/api/upgrade").catch(() => null);
    if (fresh) setItems(fresh.items);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">Контракты</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">Апгрейд</h1>
      </div>

      {/* Stake → wheel → target */}
      <section className="glass p-5 md:p-7">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Stake side */}
          <div className="order-2 md:order-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Ваша ставка</p>
              {selected.length || stake ? (
                <button
                  type="button"
                  className="text-xs text-white/40 hover:text-white"
                  onClick={() => {
                    setSelected([]);
                    setStake(0);
                  }}
                >
                  Очистить
                </button>
              ) : null}
            </div>
            <div className="mt-3 min-h-[96px]">
              {selectedItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="glass-soft flex items-center gap-2 px-2 py-1.5 text-left"
                      title="Убрать из ставки"
                    >
                      <SkinVisual image={item.skin.image} rarity={item.skin.rarity} className="h-9 w-12 rounded-md" pad="p-0.5" />
                      <span className="text-xs text-white/70">{formatMoney(item.value)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid h-[96px] place-items-center rounded-2xl border border-dashed border-white/12 text-sm text-white/35">
                  Выберите предметы и/или баланс
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>Баланс в ставку</span>
                <span className="tabular-nums text-white/70">{formatMoney(balanceStake)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={balance}
                value={balanceStake}
                onChange={(event) => setStake(Number(event.target.value))}
                className="mt-2 w-full accent-[#c8f14f]"
              />
              <div className="mt-2 flex gap-2">
                {[10, 25, 50].map((percent) => (
                  <button key={percent} type="button" className="chip flex-1" onClick={() => stakeFor(percent)}>
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Итого ставка <span className="font-display text-lg text-white">{formatMoney(totalStake)}</span>
            </p>
          </div>

          {/* Wheel */}
          <div className="order-1 text-center md:order-2">
            <UpgradeWheel bps={bps} spinning={spinning} success={success} onSpinEnd={() => void finish()} />
            <button
              type="button"
              className="btn-lime mt-3 w-full max-w-[220px]"
              disabled={locked || !target || totalStake <= 0 || (target ? target.price <= totalStake : true)}
              onClick={() => void run()}
            >
              {locked ? "Крутится…" : "Апгрейд"}
            </button>
            {result && !spinning ? (
              <p className={`mt-3 text-sm ${result.success ? "text-[#c8f14f]" : "text-[#ffb4b4]"}`}>
                {result.success ? `Успех: ${result.target.name}` : "Не удалось — ставка сгорела"}
              </p>
            ) : (
              <p className="mt-3 text-xs text-white/30">шанс = ставка / цена цели × 90%, максимум 75%</p>
            )}
          </div>

          {/* Target side */}
          <div className="order-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Предмет для апгрейда</p>
              {target ? (
                <button type="button" className="text-xs text-white/40 hover:text-white" onClick={() => setTargetId(null)}>
                  Очистить
                </button>
              ) : null}
            </div>
            {target ? (
              <div className="mt-3">
                <SkinVisual image={target.image} rarity={target.rarity} className="h-[120px] rounded-2xl" pad="p-3" />
                <p className="mt-3 truncate text-sm text-white/50">{splitSkinName(target.name).weapon}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{splitSkinName(target.name).finish || target.name}</p>
                  <p className="shrink-0 font-display text-[#c8f14f]">{formatMoney(target.price)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid h-[176px] place-items-center rounded-2xl border border-dashed border-white/12 text-sm text-white/35">
                Выберите цель из каталога ниже
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Picker */}
      <section className="glass p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="chip" data-on={tab === "targets"} onClick={() => setTab("targets")}>
            Выбрать предмет
          </button>
          <button type="button" className="chip" data-on={tab === "mine"} onClick={() => setTab("mine")}>
            Мои предметы {items.length ? `· ${items.length}` : ""}
          </button>
          {tab === "targets" ? (
            <>
              <input
                className="field ml-auto w-full sm:w-56"
                placeholder="Поиск скина"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select className="field w-auto" value={rarity} onChange={(event) => setRarity(event.target.value)}>
                <option value="all">Любая редкость</option>
                <option value="blue">Армейское</option>
                <option value="purple">Запрещённое</option>
                <option value="pink">Засекреченное</option>
                <option value="red">Тайное</option>
                <option value="gold">Контрабанда</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-white/50">
                <input type="checkbox" checked={onlyRicher} onChange={(event) => setOnlyRicher(event.target.checked)} />
                дороже ставки
              </label>
            </>
          ) : null}
        </div>
        <div className="mt-4 grid max-h-[560px] gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
          {tab === "targets" ? (
            catalog.length ? (
              catalog.map((skin) => (
                <SkinCard key={skin.id} skin={skin} selected={skin.id === targetId} onClick={() => setTargetId(skin.id)} />
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-white/35">Ничего не найдено.</p>
            )
          ) : items.length ? (
            items.map((item) => (
              <SkinCard
                key={item.id}
                skin={item.skin}
                value={item.value}
                wear={item.wear}
                floatThousandths={item.floatThousandths}
                stattrak={item.stattrak}
                selected={selected.includes(item.id)}
                onClick={() => toggle(item.id)}
              />
            ))
          ) : (
            <p className="col-span-full py-8 text-center text-sm text-white/35">
              Инвентарь пуст — откройте кейс и вернитесь сюда.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
