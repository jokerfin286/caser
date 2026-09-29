"use client";

import type { ReactNode } from "react";
import { RARITY_META, WEAR_META, type Rarity } from "@/lib/catalog";
import { formatFloat, formatMoney, splitSkinName } from "@/lib/format";
import type { SkinDTO } from "@/lib/types";
import { SkinVisual } from "@/components/SkinVisual";

export function SkinCard({
  skin,
  value,
  wear,
  floatThousandths,
  stattrak,
  selected,
  chance,
  onClick,
  footer,
}: {
  skin: SkinDTO;
  value?: number;
  wear?: string;
  floatThousandths?: number;
  stattrak?: boolean;
  selected?: boolean;
  chance?: number;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  const meta = RARITY_META[skin.rarity as Rarity] ?? RARITY_META.blue;
  const parts = splitSkinName(skin.name);
  const interactive = Boolean(onClick);
  return (
    <div className={`skin-card ${selected ? "ring-2 ring-[#c8f14f]" : ""}`}>
      <button type="button" onClick={onClick} disabled={!interactive} className="block w-full text-left disabled:cursor-default">
      <SkinVisual image={skin.image} rarity={skin.rarity} className="aspect-[16/10]" />
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-white/45">{parts.weapon}</p>
          {stattrak ? <span className="text-[10px] font-bold tracking-widest text-orange-400">ST</span> : null}
        </div>
        <p className="truncate font-medium">{parts.finish || skin.name}</p>
        <div className="flex items-center justify-between gap-2 text-xs text-white/55">
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span className="font-display text-sm text-[#f6f1e8]">{formatMoney(value ?? skin.price)}</span>
        </div>
        {wear ? (
          <p className="text-[11px] text-white/40">
            {wear} · {WEAR_META[wear] ?? wear}
            {floatThousandths != null ? ` · ${formatFloat(floatThousandths)}` : ""}
          </p>
        ) : null}
        {chance != null ? <p className="text-[11px] text-white/45">{(chance / 100).toFixed(2)}%</p> : null}
        </div>
      </button>
      {footer ? <div className="px-3 pb-3">{footer}</div> : null}
    </div>
  );
}
