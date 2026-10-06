import { z } from "zod";
import type { ItemCatalogo } from "./catalogo.server";
import { createDocument, findDocument } from "./firestore.server";
import type { Interpretacao } from "./interpretacao.server";

// "A base de dados fornece os preços. O código calcula." Prices come only from the catalogue,
// and each proposal stores a copy of everything it used, so later catalogue changes never
// alter a proposal that was already issued.

const VALIDADE_DIAS_PADRAO = 15;
const BASE_URL_PADRAO = "https://linha-digital-assist.lovable.app";

export type ItemProposta = {
  catalogoId: string;
  nome: string;
  descricao: string;
  unidade: "pacote" | "unidade" | "hora";
  recorrencia: "unica" | "mensal";
  quantidade: number;
  precoUnitarioCentimos: number;
  subtotalCentimos: number;
  condicoes: string;
};

export type Calculo =
  | {
      ok: true;
      itens: ItemProposta[];
      totalUnicoCentimos: number;
      totalMensalCentimos: number;
      demonstracao: boolean;
    }
  | { ok: false; motivo: string };

/**
 * subtotal = quantidade × preço unitário; one total for one-off payments and another for
 * monthly ones, never mixed. Everything in whole cents. Cases the calculation does not support
 * are returned as a reason for review instead of a price.
 */
export function calcularProposta(interpretacao: Interpretacao, catalogo: ItemCatalogo[]): Calculo {
  const itens: ItemProposta[] = [];
  let demonstracao = false;
  for (const pedido of interpretacao.itens) {
    const item = catalogo.find((c) => c.id === pedido.catalogoId);
    if (!item) return { ok: false, motivo: `O serviço ${pedido.catalogoId} já não está ativo.` };
    if (pedido.quantidade === null) {
      return { ok: false, motivo: `Quantidade por confirmar: ${pedido.catalogoId}.` };
    }
    if (item.unidade === "pacote" && pedido.quantidade !== 1) {
      return { ok: false, motivo: `Quantidade inesperada para um pacote: ${pedido.catalogoId}.` };
    }
    // Whole quantities times whole cents are exact; the rounding only guards the invariant.
    const subtotalCentimos = Math.round(pedido.quantidade * item.precoUnitarioCentimos);
    itens.push({
      catalogoId: item.id,
      nome: item.nome,
      descricao: item.descricao,
      unidade: item.unidade,
      recorrencia: item.recorrencia,
      quantidade: pedido.quantidade,
      precoUnitarioCentimos: item.precoUnitarioCentimos,
      subtotalCentimos,
      condicoes: item.condicoes,
    });
    demonstracao ||= item.precoFicticio;
  }
  if (itens.length === 0) return { ok: false, motivo: "Nenhum serviço para calcular." };

  const soma = (recorrencia: ItemProposta["recorrencia"]) =>
    itens
      .filter((i) => i.recorrencia === recorrencia)
      .reduce((total, i) => total + i.subtotalCentimos, 0);
  return {
    ok: true,
    itens,
    totalUnicoCentimos: soma("unica"),
    totalMensalCentimos: soma("mensal"),
    demonstracao,
  };
}

// 256 random bits: the link is the only key to the proposal, so it must not be guessable.
function novoToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Stores the proposal with the request's id as its own id, so processing the same request
 * twice can never create a second proposal. Returns the proposal id.
 */
export async function criarProposta(
  pedidoId: string,
  resumo: string,
  calculo: Extract<Calculo, { ok: true }>,
): Promise<string> {
  const agora = new Date();
  const dias = Number(process.env["PROPOSTA_VALIDADE_DIAS"]) || VALIDADE_DIAS_PADRAO;
  const base = (process.env["APP_BASE_URL"]?.trim() || BASE_URL_PADRAO).replace(/\/+$/, "");
  const token = novoToken();

  const condicoesGerais = ["Valores sem IVA."];
  if (calculo.totalMensalCentimos > 0) {
    condicoesGerais.push("A mensalidade é cobrada à parte do pagamento único.");
  }
  if (calculo.demonstracao) {
    condicoesGerais.push(
      "Proposta de demonstração: os preços são fictícios e não constituem uma oferta comercial.",
    );
  }

  await createDocument("propostas", pedidoId, {
    numero: `LD-${agora.toISOString().slice(0, 10).replace(/-/g, "")}-${pedidoId.slice(0, 6).toUpperCase()}`,
    pedidoId,
    criadaEm: agora,
    validaAte: new Date(agora.getTime() + dias * 86_400_000),
    resumo,
    itens: calculo.itens,
    totalUnicoCentimos: calculo.totalUnicoCentimos,
    totalMensalCentimos: calculo.totalMensalCentimos,
    moeda: "EUR",
    condicoesGerais,
    demonstracao: calculo.demonstracao,
    token,
    link: `${base}/proposta/${token}`,
    // Filled in by the notification phase.
    estadoNotificacao: "por_enviar",
    resendId: null,
    notificacaoTentadaEm: null,
    erroNotificacao: null,
  });
  return pedidoId;
}

const PropostaGuardada = z.object({
  numero: z.string(),
  criadaEm: z.date(),
  validaAte: z.date(),
  resumo: z.string(),
  itens: z.array(
    z.object({
      nome: z.string(),
      descricao: z.string(),
      unidade: z.enum(["pacote", "unidade", "hora"]),
      recorrencia: z.enum(["unica", "mensal"]),
      quantidade: z.number(),
      precoUnitarioCentimos: z.number(),
      subtotalCentimos: z.number(),
      condicoes: z.string(),
    }),
  ),
  totalUnicoCentimos: z.number(),
  totalMensalCentimos: z.number(),
  condicoesGerais: z.array(z.string()),
  demonstracao: z.boolean(),
});

/** What the public proposal page shows: no email, no original request, values preformatted. */
export type PropostaPublica = {
  numero: string;
  criadaEm: string;
  validaAte: string;
  resumo: string;
  itens: {
    nome: string;
    descricao: string;
    condicoes: string;
    quantidade: string;
    precoUnitario: string;
    subtotal: string;
  }[];
  totalUnico: string | null;
  totalMensal: string | null;
  condicoesGerais: string[];
  demonstracao: boolean;
};

export type ResultadoProposta =
  { estado: "ok"; proposta: PropostaPublica } | { estado: "nao_encontrada" | "expirada" };

// Formatted on the server so the page renders identical text on the server and in the browser.
export const euros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const dataLonga = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Lisbon",
});
const UNIDADES = { pacote: "pacote", unidade: "un.", hora: "h" } as const;

export async function obterPropostaPublica(token: string): Promise<ResultadoProposta> {
  const doc = await findDocument("propostas", "token", token);
  if (!doc) return { estado: "nao_encontrada" };
  const parsed = PropostaGuardada.safeParse(doc.data);
  if (!parsed.success) {
    console.error("Proposta inválida", doc.id, parsed.error.issues[0]?.message);
    return { estado: "nao_encontrada" };
  }
  const p = parsed.data;
  if (p.validaAte.getTime() < Date.now()) return { estado: "expirada" };

  const mes = (i: { recorrencia: string }) => (i.recorrencia === "mensal" ? "/mês" : "");
  return {
    estado: "ok",
    proposta: {
      numero: p.numero,
      criadaEm: dataLonga.format(p.criadaEm),
      validaAte: dataLonga.format(p.validaAte),
      resumo: p.resumo,
      itens: p.itens.map((i) => ({
        nome: i.nome,
        descricao: i.descricao,
        condicoes: i.condicoes,
        quantidade: `${i.quantidade} ${UNIDADES[i.unidade]}`,
        precoUnitario: euros.format(i.precoUnitarioCentimos / 100) + mes(i),
        subtotal: euros.format(i.subtotalCentimos / 100) + mes(i),
      })),
      totalUnico: p.totalUnicoCentimos > 0 ? euros.format(p.totalUnicoCentimos / 100) : null,
      totalMensal:
        p.totalMensalCentimos > 0 ? `${euros.format(p.totalMensalCentimos / 100)}/mês` : null,
      condicoesGerais: p.condicoesGerais,
      demonstracao: p.demonstracao,
    },
  };
}
