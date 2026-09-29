"use client";

import { useEffect, useRef, useState } from "react";
import { SkinVisual } from "@/components/SkinVisual";
import { splitSkinName } from "@/lib/format";
import { playTick } from "@/lib/sound";
import type { CaseSkinDTO, SkinDTO } from "@/lib/types";

const ITEM = 148;
const WIN_AT = 42;

function buildStrip(pool: CaseSkinDTO[], winner: SkinDTO) {
  const total = pool.reduce((sum, item) => sum + item.chance, 0) || 1;
  const pick = () => {
    let cursor = Math.random() * total;
    for (const item of pool) {
      if (cursor < item.chance) return item;
      cursor -= item.chance;
    }
    return pool[0];
  };
  const strip: SkinDTO[] = Array.from({ length: 62 }, pick);
  strip[WIN_AT] = winner;
  return strip;
}

export function Roulette({
  pool,
  winner,
  spinId,
  fast,
  onDone,
}: {
  pool: CaseSkinDTO[];
  winner: SkinDTO | null;
  spinId: number;
  fast: boolean;
  onDone: () => void;
}) {
  const [strip, setStrip] = useState<SkinDTO[]>(() => (pool.length ? buildStrip(pool, pool[0]) : []));
  const [x, setX] = useState(0);
  const [anim, setAnim] = useState(false);
  const [duration, setDuration] = useState(6400);
  const viewport = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  const finishSpin = useRef<() => void>(() => {});
  done.current = onDone;

  useEffect(() => {
    if (!spinId || !winner || !pool.length) return;
    let finished = false;
    let timer = 0;
    let inner = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      setAnim(false);
      done.current();
    };
    finishSpin.current = finish;
    const next = buildStrip(pool, winner);
    setStrip(next);
    setAnim(false);
    setX(0);
    const frame = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        const width = viewport.current?.clientWidth ?? 720;
        const jitter = (Math.random() - 0.5) * 64;
        const ms = fast ? 1100 : 6400;
        setDuration(ms);
        setAnim(true);
        setX(-(WIN_AT * ITEM + ITEM / 2 - width / 2 + jitter));
        timer = window.setTimeout(finish, ms + 800);
      });
    });
    return () => {
      finished = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(inner);
      window.clearTimeout(timer);
    };
  }, [spinId, winner, pool, fast]);

  useEffect(() => {
    if (!anim) return;
    let raf = 0;
    let last = -1;
    const loop = () => {
      const marker = (viewport.current?.getBoundingClientRect().left ?? 0) + (viewport.current?.clientWidth ?? 0) / 2;
      const nodes = stripRef.current?.querySelectorAll<HTMLElement>("[data-slot]") ?? [];
      let index = 0;
      nodes.forEach((node, i) => {
        if (node.getBoundingClientRect().left < marker) index = i;
      });
      if (index !== last) {
        last = index;
        playTick(640 + (index % 4) * 30);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [anim]);

  return (
    <div ref={viewport} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="marker" />
      <div
        ref={stripRef}
        className="flex py-4"
        style={{
          transform: `translate3d(${x}px,0,0)`,
          transition: anim ? `transform ${duration}ms cubic-bezier(0.08, 0.72, 0.08, 1)` : "none",
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "transform") return;
          finishSpin.current();
        }}
      >
        {strip.map((item, index) => {
          const parts = splitSkinName(item.name);
          return (
            <div key={`${item.id}-${index}`} data-slot className="w-[148px] shrink-0 px-1.5">
              <SkinVisual image={item.image} rarity={item.rarity} className="h-[92px] rounded-xl" />
              <p className="mt-2 truncate text-center text-[11px] text-white/70">{parts.finish || parts.weapon}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
