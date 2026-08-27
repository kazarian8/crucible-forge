"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MessageCircleQuestion, UserRound, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function SupportDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Yo — Ask Crucible is here. What do you need help with?" },
  ]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ask-crucible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const payload = await response.json();
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.ok ? payload.reply : payload.error ?? "Ask Crucible is unavailable." },
      ]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Ask Crucible hit a snag. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-1/2 z-[60] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-black/90 shadow-2xl backdrop-blur md:bottom-4 md:left-auto md:right-5 md:max-w-none md:translate-x-0 md:z-[90]">
        <button type="button" onClick={() => setOpen(true)} className="flex min-w-0 items-center gap-2 px-4 py-3 text-xs font-black text-white/80 hover:bg-white/10">
          <MessageCircleQuestion size={16} className="shrink-0" /> <span className="truncate">Ask Crucible</span>
        </button>
        <Link href="/contact" className="flex min-w-0 items-center gap-2 border-l border-white/10 px-4 py-3 text-xs font-black text-orange-200 hover:bg-white/10">
          <UserRound size={16} className="shrink-0" /> <span className="truncate">Contact Justice</span>
        </Link>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/55 p-3 md:items-center md:justify-end md:p-5" onClick={() => setOpen(false)}>
          <section className="flex max-h-[78vh] w-full flex-col rounded-3xl border border-orange-300/20 bg-[#0b0806] shadow-2xl md:h-[620px] md:max-w-md" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm font-black text-white">Ask Crucible</p>
                <p className="text-xs text-white/35">AI help · Justice-flavored, facts first</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div key={index} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-orange-500 text-black" : "bg-white/[0.06] text-white/80"}`}>
                  {message.content}
                </div>
              ))}
              {loading ? <div className="max-w-[70%] rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/40">Checking that for you…</div> : null}
            </div>

            <form onSubmit={submit} className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={4000} placeholder="Ask about Forge, credits, Vault, exports…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-orange-300/40" />
                <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-orange-500 px-4 text-sm font-black text-black disabled:opacity-40">Send</button>
              </div>
              <Link href="/contact" className="mt-2 block text-center text-xs text-white/35 hover:text-orange-200">Need a real person? Contact Justice</Link>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
