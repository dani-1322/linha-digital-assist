import { createDocument } from "./firestore.server";

export type EstadoPedido =
  "recebido" | "em_analise" | "necessita_revisao" | "proposta_criada" | "erro";

export type NovoPedido = { id: string; nome: string; email: string; pedido: string };

export async function savePedido(input: NovoPedido): Promise<void> {
  const agora = new Date();
  const estado: EstadoPedido = "recebido";
  await createDocument("pedidos", input.id, {
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
