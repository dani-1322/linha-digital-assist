import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { processPedido, submitPedido } from "@/lib/pedidos.functions";

type Estado = "editar" | "a_enviar" | "enviado" | "erro";

const FALLBACK =
  "Não foi possível enviar o pedido neste momento. Tente outra vez dentro de instantes ou escreva para daniel.alves.132203@gmail.com.";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary";

// crypto.randomUUID needs a secure context; getRandomValues also works over plain http (LAN tests).
function novoId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function PedidoPropostaForm() {
  const enviar = useServerFn(submitPedido);
  const processar = useServerFn(processPedido);
  const [estado, setEstado] = useState<Estado>("editar");
  const [erro, setErro] = useState(FALLBACK);
  // Kept across retries, so a request that was saved but timed out is not stored twice.
  const idRef = useRef<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (estado === "a_enviar") return;
    const form = new FormData(event.currentTarget);
    const id = (idRef.current ??= novoId());
    setEstado("a_enviar");
    try {
      const result = (await Promise.race([
        enviar({
          data: {
            id,
            nome: String(form.get("nome") ?? ""),
            email: String(form.get("email") ?? ""),
            pedido: String(form.get("pedido") ?? ""),
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 30_000)),
      ])) as { ok: boolean; error: string | null };
      if (result.ok) {
        setEstado("enviado");
        // The request is already saved; its interpretation runs on, without the client waiting.
        // If it fails, the request is marked "erro" and can be reprocessed later.
        processar({ data: { id } }).catch(() => {});
      } else {
        setErro(result.error ?? FALLBACK);
        setEstado("erro");
      }
    } catch {
      setErro(FALLBACK);
      setEstado("erro");
    }
  }

  if (estado === "enviado") {
    return (
      <div role="status" className="rounded-lg border border-border bg-card p-7 shadow-sm sm:p-8">
        <CheckCircle2 className="text-sea" size={34} />
        <h3 className="mt-5 text-2xl font-semibold">O seu pedido foi recebido com sucesso.</h3>
        <p className="mt-3 leading-7 text-muted-foreground">
          Obrigado por explicar o que precisa. Se quiser falar já sobre o seu negócio, marque o
          diagnóstico gratuito.
        </p>
        <a
          href="#marcar"
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Marcar diagnóstico gratuito <CalendarDays size={18} />
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-card p-7 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nome
          <input
            name="nome"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className={`${fieldClass} mt-2 min-h-11`}
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className={`${fieldClass} mt-2 min-h-11`}
          />
        </label>
      </div>
      <label className="mt-5 block text-sm font-semibold">
        O que precisa?
        <textarea
          name="pedido"
          required
          minLength={20}
          maxLength={3000}
          rows={6}
          placeholder="Ex.: Tenho um café em Queluz e só tenho Instagram. Queria um site com o menu, os horários e um botão de WhatsApp."
          className={`${fieldClass} mt-2 resize-y py-2.5 leading-6`}
        />
      </label>

      {estado === "erro" && (
        <p
          role="alert"
          className="mt-5 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Os seus dados servem apenas para responder a este pedido.
        </p>
        <button
          type="submit"
          disabled={estado === "a_enviar"}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-bold text-coral-foreground shadow-lg shadow-coral/25 transition hover:-translate-y-0.5 hover:bg-coral/90 disabled:translate-y-0 disabled:opacity-60"
        >
          {estado === "a_enviar" ? "A enviar…" : "Enviar pedido"} <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
