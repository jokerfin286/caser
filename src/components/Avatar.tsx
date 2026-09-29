export function Avatar({
  hue,
  name,
  url,
  size = 32,
}: {
  hue: number;
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="shrink-0 rounded-full object-cover ring-1 ring-white/15"
        style={{ width: size, height: size }}
      />
    );
  }
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        background: `conic-gradient(from 140deg, hsl(${hue} 52% 40%), hsl(${(hue + 36) % 360} 60% 56%), hsl(${hue} 45% 30%))`,
      }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
