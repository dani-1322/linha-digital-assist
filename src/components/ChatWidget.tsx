import { ArrowRight, CalendarDays, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Que pacotes existem?",
  "Quanto tempo demora a fazer o site?",
  "Trabalham na minha zona?",
  "Já tenho site. Vale a pena renovar?",
];

const WELCOME =
  "Olá! Sou o assistente da Linha Digital. Posso explicar os pacotes, o processo e as zonas onde o Daniel trabalha. Em que posso ajudar?";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.content !== WELCOME) }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            "Não foi possível responder agora. Escreva para daniel.alves.132203@gmail.com.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Houve um problema de ligação. Tente novamente dentro de momentos.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Assistente da Linha Digital"
          className="flex h-[min(34rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 bg-deep px-4 py-3 text-deep-foreground">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-coral text-coral-foreground font-display text-sm font-bold">
                LD
              </span>
              <div>
                <p className="text-sm font-bold">Assistente Linha Digital</p>
                <p className="text-xs text-deep-foreground/60">Responde a dúvidas sobre os sites</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar conversa"
              className="grid size-8 place-items-center rounded-md border border-deep-foreground/20 hover:bg-deep-foreground/10"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-cool px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3.5 py-2.5 text-sm leading-6 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading && (
              <p className="text-sm text-muted-foreground">A escrever…</p>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-3">
            <a
              href="#marcar"
              onClick={() => setOpen(false)}
              className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-bold text-coral-foreground hover:bg-coral/90"
            >
              <CalendarDays size={16} /> Marcar diagnóstico gratuito <ArrowRight size={15} />
            </a>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva a sua pergunta…"
                aria-label="Mensagem"
                className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Enviar mensagem"
                className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
        className="flex min-h-14 items-center gap-2 rounded-full bg-deep px-5 text-sm font-bold text-deep-foreground shadow-2xl transition hover:-translate-y-0.5"
      >
        {open ? <X size={20} className="text-coral" /> : <MessageCircle size={20} className="text-coral" />}
        <span className="hidden sm:inline">{open ? "Fechar" : "Tire uma dúvida"}</span>
      </button>
    </div>
  );
}
