"use client";

import { useEffect, useRef, useState } from "react";
import { chanceLabel } from "@/lib/game";

export function UpgradeWheel({
  bps,
  spinning,
  success,
  onSpinEnd,
}: {
  bps: number;
  spinning: boolean;
  success: boolean | null;
  onSpinEnd: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const done = useRef(onSpinEnd);
  done.current = onSpinEnd;
  const winDeg = Math.max(0, (bps / 10000) * 360);

  useEffect(() => {
    if (!spinning) return;
    const span = Math.max(winDeg - 10, 4);
    const land = success ? Math.min(Math.max(winDeg - 2, 1), 4 + Math.random() * span) : Math.min(348, winDeg + 8 + Math.random() * Math.max(8, 330 - winDeg));
    const next = rotationRef.current + 360 * 6 + land;
    rotationRef.current = next;
    setRotation(next);
    const timer = window.setTimeout(() => done.current(), 4300);
    return () => window.clearTimeout(timer);
    // Capture the chance at the moment the spin starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  return (
    <div className="relative mx-auto h-[280px] w-[280px]">
      <div
        className="absolute inset-3 rounded-full shadow-[0_0_40px_rgba(214,255,74,0.08)]"
        style={{
          background: `conic-gradient(#c8f14f 0deg ${winDeg}deg, #3a1c1c ${winDeg}deg 360deg)`,
          mask: "radial-gradient(circle, transparent 62%, #000 63%)",
          WebkitMask: "radial-gradient(circle, transparent 62%, #000 63%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.1s cubic-bezier(0.07, 0.75, 0.12, 1)" : "none",
        }}
      >
        <span className="absolute left-1/2 top-1 h-0 w-0 -translate-x-1/2 border-x-[8px] border-t-[16px] border-x-transparent border-t-white" />
      </div>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-4xl tabular-nums">{(bps / 100).toFixed(2)}%</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/55">{chanceLabel(bps)}</p>
        </div>
      </div>
    </div>
  );
}
