import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Mail } from "lucide-react";
import type { PropostaPublica } from "@/lib/propostas.server";
import { getProposta } from "@/lib/propostas.functions";

export const Route = createFileRoute("/proposta/$token")({
  loader: ({ params }) => getProposta({ data: { token: params.token } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.estado === "ok"
            ? `Proposta ${loaderData.proposta.numero} | Linha Digital`
            : "Proposta | Linha Digital",
      },
      // Private page: reachable only through its link, never listed by search engines, and the
      // token is not sent to other sites as a referrer.
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PropostaPage,
});

const EMAIL = "daniel.alves.132203@gmail.com";

function PropostaPage() {
  const resultado = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-deep-foreground/10 bg-deep text-deep-foreground">
        <div className="section-shell flex h-18 items-center">
          <a href="/" className="flex items-center gap-3 font-display text-lg font-bold">
            <span className="grid size-9 place-items-center rounded-md bg-coral text-coral-foreground">
              LD
            </span>
            Linha Digital
          </a>
        </div>
      </header>

      <main className="section-shell max-w-4xl flex-1 py-12 sm:py-16">
        {resultado.estado === "ok" ? (
          <Proposta proposta={resultado.proposta} />
        ) : (
          <SemProposta estado={resultado.estado} />
        )}
      </main>

      <footer className="bg-deep py-8 text-deep-foreground">
        <div className="section-shell text-xs text-deep-foreground/60">
          © 2026 Linha Digital. Sites simples para negócios locais da Linha de Sintra.
        </div>
      </footer>
    </div>
  );
}

function Proposta({ proposta }: { proposta: PropostaPublica }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Proposta {proposta.numero}
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">A sua proposta</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{proposta.resumo}</p>
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Data</dt>
          <dd className="font-semibold">{proposta.criadaEm}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Válida até</dt>
          <dd className="font-semibold">{proposta.validaAte}</dd>
        </div>
      </dl>

      {proposta.demonstracao && (
        <p
          role="note"
          className="mt-8 rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-sm leading-6"
        >
          <strong>Proposta de demonstração.</strong> Os preços são fictícios e servem apenas para
          mostrar o funcionamento do sistema; não constituem uma oferta comercial.
        </p>
      )}

      <h2 className="mt-10 text-xl font-semibold">Serviços incluídos</h2>
      <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {proposta.itens.map((item) => (
            <li
              key={item.nome}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:p-6"
            >
              <div className="min-w-0">
                <h3 className="font-semibold">{item.nome}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.descricao}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.condicoes}</p>
              </div>
              <div className="shrink-0 text-sm sm:text-right">
                <p className="text-muted-foreground">
                  {item.quantidade} × {item.precoUnitario}
                </p>
                <p className="mt-1 text-base font-semibold">{item.subtotal}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-border bg-surface-cool px-5 py-5 sm:px-6">
          {proposta.totalUnico && (
            <Total rotulo="Total — pagamento único (sem IVA)" valor={proposta.totalUnico} />
          )}
          {proposta.totalMensal && (
            <Total rotulo="Mensalidade (sem IVA)" valor={proposta.totalMensal} />
          )}
        </div>
      </section>

      <h2 className="mt-10 text-xl font-semibold">Condições</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
        {proposta.condicoesGerais.map((condicao) => (
          <li key={condicao}>{condicao}</li>
        ))}
        <li>Proposta válida até {proposta.validaAte}.</li>
      </ul>

      <Contacto titulo="Tem dúvidas sobre esta proposta?" />
    </>
  );
}

function Total({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-sm font-semibold">{rotulo}</span>
      <span className="font-display text-2xl font-bold text-primary">{valor}</span>
    </p>
  );
}

const MENSAGENS = {
  nao_encontrada: {
    titulo: "Proposta não encontrada",
    texto: "O link pode estar incompleto. Confirme que copiou o endereço completo.",
  },
  expirada: {
    titulo: "Esta proposta expirou",
    texto: "A validade da proposta terminou. Podemos preparar uma proposta atualizada.",
  },
  indisponivel: {
    titulo: "Não foi possível carregar a proposta",
    texto: "Tente novamente dentro de instantes.",
  },
} as const;

function SemProposta({ estado }: { estado: keyof typeof MENSAGENS }) {
  const { titulo, texto } = MENSAGENS[estado];
  return (
    <>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{titulo}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{texto}</p>
      <Contacto titulo="Quer falar connosco?" />
    </>
  );
}

function Contacto({ titulo }: { titulo: string }) {
  return (
    <section className="mt-12 rounded-lg bg-deep p-7 text-deep-foreground sm:p-8">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <p className="mt-2 text-sm leading-6 text-deep-foreground/75">
        Marque um diagnóstico gratuito de 15 a 20 minutos ou escreva-nos.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href="/#marcar"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 py-3 text-sm font-bold text-coral-foreground shadow-lg shadow-coral/25 transition hover:-translate-y-0.5 hover:bg-coral/90"
        >
          Marcar diagnóstico gratuito <CalendarDays size={18} />
        </a>
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex items-center gap-2 break-all text-sm text-deep-foreground/75 hover:text-deep-foreground"
        >
          <Mail size={16} /> {EMAIL}
        </a>
      </div>
    </section>
  );
}
