"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Send, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Thread = {
  other_user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  last_body: string;
  last_at: string;
  unread_count: number;
  request_state: "pending" | "accepted" | "declined";
};

type DM = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  message_type: string;
  attachment_url: string | null;
  request_state: "pending" | "accepted" | "declined";
  created_at: string;
  read_at: string | null;
};

export default function MessagesPage() {
  const params = useSearchParams();
  const requestedUser = params.get("user");
  const sb = useMemo(() => createClient(), []);
  const [me, setMe] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(requestedUser);
  const [messages, setMessages] = useState<DM[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    const { data } = await sb.rpc("list_crucible_dm_threads");
    setThreads((data ?? []) as Thread[]);
  }, [sb]);

  const loadConversation = useCallback(async (userId: string) => {
    const { data, error } = await sb.rpc("get_crucible_dm_thread", { p_other: userId });
    if (error) {
      setStatus("Could not load this conversation.");
      return;
    }
    setMessages((data ?? []) as DM[]);
    await sb.rpc("mark_crucible_dm_read", { p_other: userId });
    void loadThreads();
  }, [loadThreads, sb]);

  useEffect(() => {
    void sb.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    void loadThreads();
  }, [loadThreads, sb]);

  useEffect(() => {
    if (requestedUser) setActiveUser(requestedUser);
  }, [requestedUser]);

  useEffect(() => {
    if (activeUser) void loadConversation(activeUser);
    else setMessages([]);
  }, [activeUser, loadConversation]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!activeUser || !body.trim()) return;
    setSending(true);
    setStatus("");
    const { error } = await sb.rpc("send_crucible_dm", {
      p_recipient: activeUser,
      p_body: body.trim(),
      p_message_type: "text",
      p_attachment_url: null,
    });
    setSending(false);
    if (error) {
      const lower = error.message.toLowerCase();
      setStatus(lower.includes("dms_closed") ? "This user is not accepting direct messages." : "Message could not be sent.");
      return;
    }
    setBody("");
    await loadConversation(activeUser);
  }

  async function respond(accept: boolean) {
    if (!activeUser) return;
    await sb.rpc("respond_crucible_dm_request", { p_sender: activeUser, p_accept: accept });
    await loadConversation(activeUser);
    setStatus(accept ? "Message request accepted." : "Message request declined.");
  }

  const activeThread = threads.find((thread) => thread.other_user_id === activeUser);
  const pendingIncoming = !!activeUser && !!me && messages.some((m) => m.sender_id === activeUser && m.recipient_id === me && m.request_state === "pending");

  return (
    <main className="min-h-screen bg-[#060403] pb-28 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl md:grid-cols-[330px_1fr]">
        <aside className={`border-white/10 p-4 md:border-r ${activeUser ? "hidden md:block" : "block"}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">Crucible network</p><h1 className="mt-1 text-2xl font-black">Messages</h1></div>
            <Link href="/artists" className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]" aria-label="Find artists"><Search size={18} /></Link>
          </div>
          <div className="mt-5 space-y-2">
            {threads.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35"><MessageCircle className="mx-auto mb-2" />No conversations yet.<br/><Link href="/artists" className="mt-2 inline-block text-orange-300">Find an artist</Link></div> : null}
            {threads.map((thread) => (
              <button key={thread.other_user_id} onClick={() => setActiveUser(thread.other_user_id)} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
                {thread.avatar_url ? <img src={thread.avatar_url} alt="" className="size-11 rounded-full object-cover" /> : <div className="grid size-11 place-items-center rounded-full bg-white/5"><UserRound size={18} /></div>}
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate font-black">@{thread.username || "artist"}</span>{Number(thread.unread_count) > 0 ? <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-black">{thread.unread_count}</span> : null}</div><p className="truncate text-xs text-white/40">{thread.request_state === "pending" ? "Message request · " : ""}{thread.last_body}</p></div>
              </button>
            ))}
          </div>
        </aside>

        <section className={`${activeUser ? "flex" : "hidden md:flex"} min-h-[70vh] flex-col`}>
          {!activeUser ? <div className="m-auto text-center text-white/35"><MessageCircle className="mx-auto mb-3" size={36}/><p>Select a conversation or find an artist.</p></div> : <>
            <header className="flex items-center gap-3 border-b border-white/10 p-4"><button onClick={() => setActiveUser(null)} className="text-sm text-white/50 md:hidden">Back</button><div className="min-w-0 flex-1"><p className="font-black">@{activeThread?.username || "Crucible artist"}</p><p className="text-xs text-white/35">Direct message</p></div>{activeThread?.username ? <Link href={`/profile/${encodeURIComponent(activeThread.username)}`} className="text-xs font-bold text-orange-300">View profile</Link> : null}</header>
            {pendingIncoming ? <div className="m-4 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-4"><p className="font-black">Message request</p><p className="mt-1 text-xs text-white/55">Accept this request to continue the conversation.</p><div className="mt-3 flex gap-2"><button onClick={() => respond(true)} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-black">Accept</button><button onClick={() => respond(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold">Decline</button></div></div> : null}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((m) => { const mine = m.sender_id === me; return <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? "bg-orange-500 text-black" : "bg-white/[0.07] text-white/85"}`}><p>{m.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-black/55" : "text-white/25"}`}>{new Date(m.created_at).toLocaleString()}</p></div></div>; })}</div>
            <form onSubmit={send} className="border-t border-white/10 p-4"><div className="flex gap-2"><input disabled={pendingIncoming} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder={pendingIncoming ? "Accept the request to reply" : "Message..."} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-orange-300/50 disabled:opacity-50"/><button disabled={sending || pendingIncoming || !body.trim()} className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-black disabled:opacity-50" aria-label="Send message"><Send size={18}/></button></div>{status ? <p className="mt-2 text-xs text-orange-200">{status}</p> : null}</form>
          </>}
        </section>
      </section>
    </main>
  );
}
