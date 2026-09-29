import Link from "next/link";

export function LoginGate({ title, next = "/login" }: { title: string; next?: string }) {
  return (
    <div className="hud mx-auto max-w-lg p-8 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">Нужен вход</p>
      <h1 className="mt-2 font-display text-3xl">{title}</h1>
      <p className="mt-3 text-white/60">Кейсы можно смотреть без аккаунта. Открытие, инвентарь и вывод — после входа через Steam.</p>
      <Link href={next} className="btn-lime mt-6">Войти через Steam</Link>
    </div>
  );
}
