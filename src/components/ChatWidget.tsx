import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/lib/chat.functions";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME =
  "Olá! Sou o assistente da Linha Digital. Posso ajudar com os pacotes, o que está incluído, as zonas abrangidas ou a marcação do diagnóstico gratuito.";

const SUGGESTIONS = [
  "Que pacotes existem?",
  "Trabalham na minha zona?",
  "Quanto tempo demora o site?",
  "O que é o diagnóstico gratuito?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const ask = useServerFn(askAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const result = await ask({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            result.reply ??
            result.error ??
            "Não consegui responder neste momento. Tente outra vez dentro de instantes.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Houve um problema de ligação. Tente novamente dentro de momentos." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="flex h-[min(78vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border border-deep-foreground/10 bg-background shadow-2xl">
          <div className="flex items-center justify-between gap-3 bg-deep px-4 py-3 text-deep-foreground">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-coral font-display text-sm font-bold text-coral-foreground">
                LD
              </span>
              <div>
                <p className="font-display text-sm font-bold">Assistente Linha Digital</p>
                <p className="text-xs text-deep-foreground/60">Responde a dúvidas sobre os serviços</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar conversa"
              className="grid size-8 place-items-center rounded-md text-deep-foreground/70 hover:bg-deep-foreground/10 hover:text-deep-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-cool px-4 py-5">
            {messages.map((message, i) => (
              <div
                key={i}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {busy && (
              <p className="text-xs font-semibold text-muted-foreground">A escrever…</p>
            )}
            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border bg-background px-4 py-3">
            <a
              href="#marcar"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-bold text-coral-foreground transition hover:bg-coral/90"
            >
              <CalendarDays size={17} /> Marcar diagnóstico gratuito
            </a>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escreva a sua pergunta…"
                maxLength={500}
                aria-label="Escreva a sua pergunta"
                className="min-h-11 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:border-primary"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Enviar mensagem"
                className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="text-center text-[11px] text-muted-foreground">
              Respostas automáticas. Para casos concretos, marque o diagnóstico.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Fechar assistente" : "Abrir assistente da Linha Digital"}
        className="flex min-h-14 items-center gap-2.5 rounded-full bg-deep px-5 text-sm font-bold text-deep-foreground shadow-2xl ring-1 ring-deep-foreground/10 transition hover:-translate-y-0.5"
      >
        {open ? <X size={20} className="text-coral" /> : <MessageCircle size={20} className="text-coral" />}
        <span className="hidden sm:inline">{open ? "Fechar" : "Tire uma dúvida"}</span>
      </button>
    </div>
  );
}
