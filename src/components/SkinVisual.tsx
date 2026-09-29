"use client";

import { RARITY_META, type Rarity } from "@/lib/catalog";

export function SkinVisual({
  image,
  rarity,
  className = "",
  pad = "p-2",
}: {
  image: string;
  rarity: Rarity | string;
  className?: string;
  pad?: string;
}) {
  const meta = RARITY_META[(rarity as Rarity) in RARITY_META ? (rarity as Rarity) : "blue"];
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(75% 70% at 50% 38%, ${meta.color}26, transparent 72%), linear-gradient(165deg, rgba(255,255,255,0.05), rgba(0,0,0,0.25))`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" loading="lazy" className={`h-full w-full object-contain ${pad}`} />
      <span
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: meta.color, boxShadow: `0 0 14px ${meta.color}66` }}
      />
    </div>
  );
}
