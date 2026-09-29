"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { SkinVisual } from "@/components/SkinVisual";
import { RARITY_META, type Rarity } from "@/lib/catalog";
import { formatMoney, timeAgo } from "@/lib/format";
import type { DropDTO } from "@/lib/types";

export function DropFeed({ drops, compact = false }: { drops: DropDTO[]; compact?: boolean }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => window.clearInterval(id);
  }, []);
  if (!drops.length) {
    return <p className="px-1 text-sm text-white/40">Лента пока тихая.</p>;
  }
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {drops.slice(0, 12).map((drop) => (
          <DropRow key={drop.id} drop={drop} compact />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {drops.slice(0, 14).map((drop) => (
        <DropRow key={drop.id} drop={drop} />
      ))}
    </div>
  );
}

function DropRow({ drop, compact = false }: { drop: DropDTO; compact?: boolean }) {
  const meta = RARITY_META[drop.rarity as Rarity] ?? RARITY_META.blue;
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 ${compact ? "min-w-[220px] p-2" : "p-2"}`}>
      <Avatar hue={drop.avatarHue} name={drop.nickname} size={compact ? 28 : 32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-white/55">{drop.nickname}</p>
        <p className="truncate text-sm" style={{ color: meta.color }}>
          {drop.skinName}
        </p>
        <p className="text-[11px] text-white/35">{timeAgo(drop.createdAt)}</p>
      </div>
      <SkinVisual image={drop.image} rarity={drop.rarity} className="h-12 w-16 shrink-0 rounded-lg" pad="p-1" />
      <span className="hidden text-right text-xs text-white/70 sm:block">{formatMoney(drop.price)}</span>
    </div>
  );
}
