import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiErrorText, apiGet, apiStreamPost } from "@/lib/api";
import type { ChatHistoryItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS = [
  "Bhai DSA ka roadmap bata de",
  "Exam se ek raat pehle kya padhein?",
  "OS me deadlock samajh nahi aata 😭",
];

export default function Chat() {
  const queryClient = useQueryClient();
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem("ghee-guru-session");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("ghee-guru-session", id);
    return id;
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const historyQ = useQuery({
    queryKey: ["chat", sessionId],
    queryFn: () => apiGet<ChatHistoryItem[]>(`/chat/${sessionId}/history`),
    retry: false,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [historyQ.data?.length, streaming]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setInput("");
    setStreaming("…");
    try {
      setStreaming("");
      await apiStreamPost("/chat/stream", { session_id: sessionId, message }, (delta) =>
        setStreaming((s) => s + delta),
      );
      await queryClient.invalidateQueries({ queryKey: ["chat", sessionId] });
    } catch (e) {
      toast.error(apiErrorText(e));
    } finally {
      setStreaming("");
      setBusy(false);
    }
  };

  const history = historyQ.data ?? [];

  return (
    <div className="mx-auto flex h-[calc(100svh-8rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <img src="/ghee-jar.png" alt="Ghee Guru" className="h-12 w-12 rounded-full border-2 border-amber-200 object-cover" />
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight" data-testid="chat-heading">
            Ghee Guru 🧈
          </h1>
          <p className="text-sm text-zinc-600">Tera study buddy — Hinglish me, 24×7, zero judgement.</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-[#FAFAFA] p-4"
        data-testid="chat-messages"
      >
        {history.length === 0 && !streaming && (
          <div className="py-10 text-center" data-testid="chat-empty-state">
            <img src="/ghee-jar.png" alt="" className="mx-auto h-16 w-16 rounded-xl border border-amber-200 object-cover" />
            <p className="mt-4 font-heading text-lg font-bold">Arre hello! Kuch pucho na 🧈</p>
            <p className="mt-1 text-sm text-zinc-500">
              Concept, exam strategy, ya bas padhne ka mood nahi — sab batado.
            </p>
          </div>
        )}
        {history.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "ml-auto rounded-br-sm bg-amber-500 text-white"
                : "rounded-bl-sm border border-zinc-200 bg-white text-zinc-800",
            )}
            data-testid={`chat-message-${m.role}`}
          >
            {m.content}
          </div>
        ))}
        {streaming && (
          <div
            className="max-w-[85%] rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800"
            data-testid="chat-streaming-bubble"
          >
            {streaming}
            {busy && streaming === "…" && <span className="animate-pulse">▍</span>}
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="mt-3 flex flex-wrap gap-2" data-testid="chat-presets">
        {PRESETS.map((p, i) => (
          <button
            key={p}
            onClick={() => send(p)}
            disabled={busy}
            data-testid={`chat-preset-chip-${i}`}
            className="rounded-full border border-amber-200 bg-[#FEF9C3]/60 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2 pb-4"
        data-testid="chat-composer"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ghee Guru se kuch pucho…"
          className="h-12 border-amber-200"
          disabled={busy}
          data-testid="chat-input"
        />
        <Button type="submit" size="lg" className="h-12" disabled={busy || !input.trim()} data-testid="chat-send-button">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
