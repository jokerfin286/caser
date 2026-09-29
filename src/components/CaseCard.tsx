"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Countdown } from "@/components/Countdown";
import { useShell } from "@/components/shell-context";
import { formatMoney } from "@/lib/format";
import type { CaseDTO } from "@/lib/types";

export function CaseCard({ item }: { item: CaseDTO }) {
  const { viewMode } = useShell();
  const list = viewMode === "list";
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
      <Link
        href={`/case/${item.id}`}
        className={`group hud block overflow-hidden ${list ? "flex items-center gap-4 p-3" : "p-3"}`}
      >
        <div
          className={`case-frame relative overflow-hidden rounded-xl ${list ? "h-24 w-36 shrink-0" : "aspect-[5/4]"}`}
          style={{ ["--accent" as string]: item.accent }}
        >
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
          />
          <span className="shine pointer-events-none absolute inset-y-0 w-1/2" />
          {item.label ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 font-display text-[10px] tracking-[0.16em] text-[#c8f14f]">
              {item.label}
            </span>
          ) : null}
        </div>
        <div className={`min-w-0 ${list ? "flex flex-1 items-center justify-between gap-4" : "mt-3"}`}>
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight">{item.name}</p>
            <p className="mt-1 truncate text-sm text-white/55">{item.tagline}</p>
            {item.timerEndsAt ? (
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/50">
                таймер <Countdown iso={item.timerEndsAt} />
              </p>
            ) : null}
          </div>
          <div className={list ? "text-right" : "mt-3 flex items-center justify-between"}>
            <span className="font-display text-[#c8f14f]">{formatMoney(item.price)}</span>
            {!list ? <span className="text-xs uppercase tracking-[0.16em] text-white/45">открыть</span> : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
