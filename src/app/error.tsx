"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="hud mx-auto max-w-lg p-8 text-center">
      <h1 className="font-display text-3xl">Сбой на площадке</h1>
      <p className="mt-2 text-white/55">Повторите запрос. Если база только что поднялась, это обычно проходит со второй попытки.</p>
      <button type="button" className="btn-lime mt-5" onClick={reset}>Повторить</button>
    </div>
  );
}
