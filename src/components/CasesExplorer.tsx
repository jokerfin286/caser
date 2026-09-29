"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CaseCard } from "@/components/CaseCard";
import { Countdown } from "@/components/Countdown";
import { useShell } from "@/components/shell-context";
import type { CaseDTO } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "operation", label: "Операция" },
  { id: "new", label: "New" },
  { id: "premium", label: "Премиум" },
  { id: "standard", label: "База" },
];

export function CasesExplorer({ cases, spotlight = false }: { cases: CaseDTO[]; spotlight?: boolean }) {
  const shell = useShell();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const [price, setPrice] = useState("all");
  const operation = cases.find((item) => item.id === "chicken-farm");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cases.filter((item) => {
      if (filter === "new") return item.label === "NEW" || item.category === "new";
      if (filter !== "all" && item.category !== filter) return false;
      if (q && !`${item.name} ${item.tagline}`.toLowerCase().includes(q)) return false;
      if (price === "low" && item.price >= 5000) return false;
      if (price === "mid" && (item.price < 5000 || item.price > 15000)) return false;
      if (price === "high" && (item.price < 15000 || item.price > 30000)) return false;
      if (price === "whale" && item.price < 30000) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      return a.sortOrder - b.sortOrder;
    });
    return list;
  }, [cases, filter, price, query, sort]);

  return (
    <div className="space-y-6">
      {spotlight && operation ? (
        <section className="hud overflow-hidden">
          <div className="relative min-h-[280px]">
            <img src="/images/banner-operation.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
            <div className="relative grid gap-6 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#c8f14f]">Операция</p>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 max-w-xl font-display text-4xl leading-none md:text-6xl">
                  CHICKEN FARM
                </motion.h1>
                <p className="mt-4 max-w-lg text-white/70">
                  Сезонный ящик, живая лента и апгрейды. Онлайн сейчас {shell.online.toLocaleString("ru-RU")}.
                </p>
                {operation.timerEndsAt ? (
                  <p className="mt-3 text-sm uppercase tracking-[0.16em] text-white/50">
                    до конца <Countdown iso={operation.timerEndsAt} />
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/case/chicken-farm" className="btn-lime">Открыть курятник</Link>
                  <Link href="/upgrade" className="btn-ghost">К апгрейдам</Link>
                </div>
              </div>
              <img src="/images/mascot.jpg" alt="" className="hidden h-56 w-56 justify-self-end rounded-full object-cover ring-2 ring-[#c8f14f]/50 md:block" />
            </div>
          </div>
        </section>
      ) : (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">Каталог</p>
          <h1 className="font-display text-4xl">Все кейсы</h1>
        </div>
      )}

      <div className="hud flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <input className="field md:max-w-xs" placeholder="Поиск кейса" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.12em] ${filter === item.id ? "bg-[#c8f14f] text-black" : "bg-white/5"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 md:ml-auto">
          <select className="field w-auto" value={price} onChange={(event) => setPrice(event.target.value)}>
            <option value="all">Любая цена</option>
            <option value="low">до 50 ₽</option>
            <option value="mid">50–150 ₽</option>
            <option value="high">150–300 ₽</option>
            <option value="whale">300+ ₽</option>
          </select>
          <select className="field w-auto" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Сначала операция</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
            <option value="name">По имени</option>
          </select>
        </div>
      </div>

      {visible.length ? (
        <div className={shell.viewMode === "list" ? "space-y-3" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
          {visible.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="hud p-8 text-center text-white/55">Ничего не нашли. Сбросьте фильтр или поищите другое имя.</div>
      )}
    </div>
  );
}
