import { z } from "zod";
import { listDocuments } from "./firestore.server";

// The `catalogo` collection is the only source of prices. Documents are validated on read,
// so a malformed entry edited by hand in the Firebase console is skipped instead of breaking
// every proposal.
const ItemSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string(),
  unidade: z.enum(["pacote", "unidade", "hora"]),
  precoUnitarioCentimos: z.number().int().nonnegative(),
  moeda: z.literal("EUR"),
  recorrencia: z.enum(["unica", "mensal"]),
  ativo: z.boolean(),
  condicoes: z.string(),
  precoFicticio: z.boolean(),
});

export type ItemCatalogo = z.infer<typeof ItemSchema> & { id: string };

export async function listarCatalogoAtivo(): Promise<ItemCatalogo[]> {
  const documents = await listDocuments("catalogo");
  const itens: ItemCatalogo[] = [];
  for (const doc of documents) {
    const parsed = ItemSchema.safeParse(doc.data);
    if (!parsed.success) {
      console.error("Catalogo: item inválido ignorado", doc.id, parsed.error.issues[0]?.message);
      continue;
    }
    if (parsed.data.ativo) itens.push({ id: doc.id, ...parsed.data });
  }
  return itens;
}
