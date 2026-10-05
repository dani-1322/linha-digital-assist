import { listarCatalogoAtivo } from "./catalogo.server";
import { createDocument, getDocument, updateDocument } from "./firestore.server";
import { interpretarPedido } from "./interpretacao.server";

export type EstadoPedido =
  "recebido" | "em_analise" | "necessita_revisao" | "proposta_criada" | "erro";

export type NovoPedido = { id: string; nome: string; email: string; pedido: string };

export async function savePedido(input: NovoPedido): Promise<"created" | "exists"> {
  const agora = new Date();
  const estado: EstadoPedido = "recebido";
  return createDocument("pedidos", input.id, {
    nome: input.nome,
    email: input.email,
    textoOriginal: input.pedido,
    estado,
    criadoEm: agora,
    atualizadoEm: agora,
    // Filled in by the interpretation and proposal phases.
    interpretacao: null,
    informacaoEmFalta: [],
    motivoRevisao: null,
    propostaId: null,
    errosProcessamento: [],
  });
}

/**
 * Interprets a saved request. Only runs while it is still "recebido", so calling it again
 * never reprocesses it. A failure is stored on the request (estado "erro", with the reason)
 * and rethrown; the request itself is never lost.
 */
export async function processarPedido(id: string): Promise<EstadoPedido | "ignorado"> {
  const pedido = await getDocument("pedidos", id);
  if (!pedido || pedido.data["estado"] !== "recebido") return "ignorado";

  await updateDocument("pedidos", id, { estado: "em_analise", atualizadoEm: new Date() });
  try {
    const catalogo = await listarCatalogoAtivo();
    if (catalogo.length === 0) throw new Error("CATALOGO_VAZIO");
    // Only the request text goes to the model: never the client's name or email.
    const interpretacao = await interpretarPedido(
      String(pedido.data["textoOriginal"] ?? ""),
      catalogo,
    );
    const estado: EstadoPedido = interpretacao.necessitaRevisao
      ? "necessita_revisao"
      : "em_analise";
    await updateDocument("pedidos", id, {
      interpretacao,
      informacaoEmFalta: interpretacao.informacaoEmFalta,
      motivoRevisao: interpretacao.motivoRevisao,
      estado,
      atualizadoEm: new Date(),
    });
    return estado;
  } catch (error) {
    const anteriores = pedido.data["errosProcessamento"];
    await updateDocument("pedidos", id, {
      estado: "erro",
      errosProcessamento: [
        ...(Array.isArray(anteriores) ? anteriores : []),
        { em: new Date(), mensagem: error instanceof Error ? error.message : String(error) },
      ],
      atualizadoEm: new Date(),
    }).catch((e) => console.error("processarPedido: erro não registado", id, e));
    throw error;
  }
}
