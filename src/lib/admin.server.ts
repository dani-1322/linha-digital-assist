import { ItemSchema, listarCatalogo, listarCatalogoAtivo } from "./catalogo.server";
import {
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
  type FirestoreDocument,
} from "./firestore.server";
import type { Interpretacao } from "./interpretacao.server";
import { processarPedido, type EstadoPedido } from "./pedidos.server";
import { calcularProposta, criarProposta, euros } from "./propostas.server";

// Data and actions of the admin area. Callers must have checked exigirAdmin first.

const dataHora = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

const texto = (v: unknown) => (typeof v === "string" ? v : "");
const formatarData = (v: unknown) => (v instanceof Date ? dataHora.format(v) : "");

export type LinhaPedido = {
  id: string;
  criadoEm: string;
  nome: string;
  email: string;
  resumo: string;
  estado: EstadoPedido;
  valor: string | null;
  estadoNotificacao: string | null;
  link: string | null;
};

function valorProposta(proposta: FirestoreDocument | undefined): string | null {
  if (!proposta) return null;
  const unico = Number(proposta.data["totalUnicoCentimos"] ?? 0);
  const mensal = Number(proposta.data["totalMensalCentimos"] ?? 0);
  const partes = [];
  if (unico > 0) partes.push(euros.format(unico / 100));
  if (mensal > 0) partes.push(`${euros.format(mensal / 100)}/mês`);
  return partes.join(" + ") || null;
}

export async function listarPedidos(): Promise<LinhaPedido[]> {
  const [pedidos, propostas] = await Promise.all([
    listDocuments("pedidos", "criadoEm desc"),
    listDocuments("propostas"),
  ]);
  const porId = new Map(propostas.map((p) => [p.id, p]));
  return pedidos.map((pedido) => {
    const d = pedido.data;
    const proposta = porId.get(texto(d["propostaId"]));
    const interpretacao = d["interpretacao"] as { resumo?: unknown } | null;
    return {
      id: pedido.id,
      criadoEm: formatarData(d["criadoEm"]),
      nome: texto(d["nome"]),
      email: texto(d["email"]),
      resumo: texto(interpretacao?.resumo) || texto(d["textoOriginal"]).slice(0, 140),
      estado: texto(d["estado"]) as EstadoPedido,
      valor: valorProposta(proposta),
      estadoNotificacao: proposta ? texto(proposta.data["estadoNotificacao"]) || null : null,
      link: proposta ? texto(proposta.data["link"]) || null : null,
    };
  });
}

export type DetalhePedido = {
  id: string;
  estado: EstadoPedido;
  textoOriginal: string;
  interpretacao: Interpretacao | null;
  motivoRevisao: string | null;
  erros: { em: string; mensagem: string }[];
};

export async function detalhePedido(id: string): Promise<DetalhePedido | null> {
  const pedido = await getDocument("pedidos", id);
  if (!pedido) return null;
  const d = pedido.data;
  const erros = Array.isArray(d["errosProcessamento"]) ? d["errosProcessamento"] : [];
  return {
    id,
    estado: texto(d["estado"]) as EstadoPedido,
    textoOriginal: texto(d["textoOriginal"]),
    interpretacao: (d["interpretacao"] as Interpretacao | null) ?? null,
    motivoRevisao: texto(d["motivoRevisao"]) || null,
    erros: erros.map((e) => {
      const erro = e as { em?: unknown; mensagem?: unknown };
      return { em: formatarData(erro.em), mensagem: texto(erro.mensagem) };
    }),
  };
}

// Requests that failed or never finished (e.g. the browser closed before processing ran).
export const ESTADOS_REPROCESSAVEIS: EstadoPedido[] = ["erro", "recebido", "em_analise"];

/** Puts a failed or stuck request back to "recebido" and processes it again. */
export async function reprocessarPedido(id: string): Promise<string> {
  const pedido = await getDocument("pedidos", id);
  if (!pedido) return "Pedido não encontrado.";
  if (!ESTADOS_REPROCESSAVEIS.includes(pedido.data["estado"] as EstadoPedido)) {
    return "Este pedido já foi processado.";
  }
  await updateDocument("pedidos", id, { estado: "recebido", atualizadoEm: new Date() });
  try {
    const estado = await processarPedido(id);
    return `Processado de novo. Estado: ${estado}.`;
  } catch {
    return "O processamento voltou a falhar. O motivo ficou registado no pedido.";
  }
}

/**
 * Resolves a request in review: the administrator chooses the services and quantities, and
 * the code calculates and creates the proposal with catalogue prices, as in automatic cases.
 */
export async function resolverPedido(
  id: string,
  itens: { catalogoId: string; quantidade: number }[],
): Promise<{ ok: boolean; mensagem: string }> {
  const pedido = await getDocument("pedidos", id);
  if (!pedido) return { ok: false, mensagem: "Pedido não encontrado." };
  if (pedido.data["estado"] !== "necessita_revisao") {
    return { ok: false, mensagem: "Este pedido não está a aguardar revisão." };
  }
  const anterior = pedido.data["interpretacao"] as Interpretacao | null;
  const interpretacao: Interpretacao = {
    resumo: anterior?.resumo || texto(pedido.data["textoOriginal"]).slice(0, 200),
    itens: itens.map((i) => ({ ...i, evidencia: "Definido na revisão do administrador." })),
    prazoPedido: anterior?.prazoPedido ?? null,
    informacaoEmFalta: [],
    necessitaRevisao: false,
    motivoRevisao: null,
  };
  const calculo = calcularProposta(interpretacao, await listarCatalogoAtivo());
  if (!calculo.ok) return { ok: false, mensagem: calculo.motivo };

  const propostaId = await criarProposta(id, interpretacao.resumo, calculo);
  await updateDocument("pedidos", id, {
    estado: "proposta_criada",
    propostaId,
    motivoRevisao: null,
    revistoEm: new Date(),
    atualizadoEm: new Date(),
  });
  return { ok: true, mensagem: "Proposta criada." };
}

export function catalogoCompleto() {
  return listarCatalogo(true);
}

/** Creates or updates a catalogue item. Prices stay fictitious until the business sets real ones. */
export async function guardarItemCatalogo(
  id: string,
  dados: unknown,
  novo: boolean,
): Promise<{ ok: boolean; mensagem: string }> {
  const parsed = ItemSchema.safeParse(dados);
  if (!parsed.success) {
    return { ok: false, mensagem: `Dados inválidos: ${parsed.error.issues[0]?.message ?? ""}` };
  }
  if (novo) {
    const resultado = await createDocument("catalogo", id, parsed.data);
    return resultado === "created"
      ? { ok: true, mensagem: "Serviço criado." }
      : { ok: false, mensagem: "Já existe um serviço com este identificador." };
  }
  await updateDocument("catalogo", id, parsed.data);
  return { ok: true, mensagem: "Alterações guardadas." };
}
