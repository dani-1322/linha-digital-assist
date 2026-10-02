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
