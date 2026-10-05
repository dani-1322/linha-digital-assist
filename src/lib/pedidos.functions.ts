import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PedidoInput = z.object({
  // Generated in the browser once per form, so resubmitting never creates a duplicate.
  id: z.string().regex(/^[a-f0-9]{32}$/),
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  pedido: z.string().trim().min(20).max(3000),
});

export const submitPedido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PedidoInput.parse(input))
  .handler(async ({ data }) => {
    const { savePedido } = await import("./pedidos.server");
    try {
      await savePedido(data);
      return { ok: true, error: null as string | null };
    } catch (error) {
      console.error("submitPedido failed", error instanceof Error ? error.message : error);
      return {
        ok: false,
        error:
          "Não foi possível enviar o pedido neste momento. Tente outra vez dentro de instantes ou escreva para daniel.alves.132203@gmail.com.",
      };
    }
  });

// Called by the browser right after a successful submit, without the client waiting for it:
// interpretation can take tens of seconds. Each request is processed at most once (only while
// "recebido") and its random 128-bit id is known only to whoever submitted it.
export const processPedido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PedidoInput.pick({ id: true }).parse(input))
  .handler(async ({ data }) => {
    const { processarPedido } = await import("./pedidos.server");
    try {
      return { estado: await processarPedido(data.id) };
    } catch (error) {
      console.error(
        "processPedido failed",
        data.id,
        error instanceof Error ? error.message : error,
      );
      return { estado: "erro" as const };
    }
  });
