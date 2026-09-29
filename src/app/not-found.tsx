import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hud mx-auto max-w-lg p-8 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-white/50">404</p>
      <h1 className="mt-2 font-display text-3xl">Такого кейса нет</h1>
      <p className="mt-2 text-white/55">Проверьте ссылку или вернитесь в каталог.</p>
      <Link href="/cases" className="btn-lime mt-5">К кейсам</Link>
    </div>
  );
}
