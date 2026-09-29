"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, publishUser, toast } from "@/lib/api";
import { formatMoney, timeAgo } from "@/lib/format";
import type { ChatDTO, UserDTO } from "@/lib/types";
import { useShell } from "@/components/shell-context";

const METHODS = [
  { id: "card", title: "Карта", note: "демо, без списания" },
  { id: "sbp", title: "СБП", note: "мгновенно" },
  { id: "yookassa", title: "ЮKassa", note: "демо-эквайринг" },
  { id: "crypto", title: "Крипто", note: "USDT, демо" },
];

export function DepositModal() {
  const shell = useShell();
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("card");
  const [pending, setPending] = useState(false);
  if (!shell.depositOpen) return null;

  async function submit() {
    setPending(true);
    try {
      const data = await api<{ user: UserDTO }>("/api/balance", {
        method: "POST",
        body: JSON.stringify({ action: "deposit", amount, method }),
      });
      publishUser(data.user);
      toast(`Баланс пополнен на ${formatMoney(amount * 100)}`, "ok");
      shell.setDepositOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Не удалось пополнить", "bad");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={() => shell.setDepositOpen(false)}>
      <div className="hud w-full max-w-lg p-5" role="dialog" aria-modal onClick={(event) => event.stopPropagation()}>
        <p className="text-xs uppercase tracking-[0.18em] text-[#c8f14f]">Демо-кошелёк</p>
        <h2 className="mt-1 font-display text-2xl">Пополнение</h2>
        <p className="mt-2 text-sm text-white/55">Средства начисляются сразу. Карта, СБП, ЮKassa и крипто в этой сборке ничего не списывают.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[100, 250, 500, 1000, 2500, 5000].map((value) => (
            <button key={value} type="button" className={`rounded-xl border px-2 py-3 ${amount === value ? "border-[#c8f14f] bg-[#c8f14f]/10" : "border-white/10"}`} onClick={() => setAmount(value)}>
              {value.toLocaleString("ru-RU")} ₽
            </button>
          ))}
        </div>
        <input className="field mt-3" type="number" min={50} max={100000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {METHODS.map((item) => (
            <button key={item.id} type="button" className={`rounded-xl border p-3 text-left ${method === item.id ? "border-[#c8f14f]" : "border-white/10"}`} onClick={() => setMethod(item.id)}>
              <span className="block font-medium">{item.title}</span>
              <span className="text-xs text-white/45">{item.note}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => shell.setDepositOpen(false)}>Закрыть</button>
          <button type="button" className="btn-lime flex-1" disabled={pending} onClick={() => void submit()}>
            {pending ? "Начисляем…" : `Зачислить ${amount.toLocaleString("ru-RU")} ₽`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatDrawer() {
  const shell = useShell();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatDTO[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!shell.chatOpen || !shell.user) return;
    void api<{ messages: ChatDTO[] }>("/api/chat").then((data) => setMessages(data.messages)).catch(() => {});
  }, [shell.chatOpen, shell.user]);

  if (!shell.chatOpen) return null;

  async function send() {
    if (!text.trim()) return;
    setPending(true);
    try {
      const data = await api<{ messages: ChatDTO[] }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      setMessages(data.messages);
      setText("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Чат недоступен", "bad");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => shell.setChatOpen(false)}>
      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#12141a] p-4" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/50">Поддержка</p>
            <h2 className="font-display text-xl">Чат КЕЙСЕР</h2>
          </div>
          <button type="button" className="btn-ghost h-9 min-h-0 px-3" onClick={() => shell.setChatOpen(false)}>Закрыть</button>
        </div>
        {shell.user ? (
          <>
            <div className="mt-4 flex-1 space-y-3 overflow-auto">
              {messages.map((message) => (
                <div key={message.id} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${message.fromSupport ? "bg-white/5" : "ml-auto bg-[#c8f14f] text-[#131608]"}`}>
                  <p className="mb-1 text-[11px] opacity-60">{message.nickname} · {timeAgo(message.createdAt)}</p>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <input className="field" value={text} onChange={(event) => setText(event.target.value)} placeholder="Спросить про вывод, шанс, Steam…" />
              <button className="btn-lime px-4" disabled={pending} type="submit">Ок</button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <p className="text-white/60">Чат поддержки открывается после входа.</p>
              <button type="button" className="btn-lime mt-4" onClick={() => router.push("/login")}>Войти через Steam</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
