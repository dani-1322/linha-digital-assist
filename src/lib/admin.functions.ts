import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Every admin operation verifies the Firebase login token and the ADMIN_UID on the server,
// whatever the browser shows or hides.

const Token = z.object({ idToken: z.string().min(1).max(5000) });
const ComPedido = Token.extend({ id: z.string().regex(/^[a-f0-9]{32}$/) });

type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

async function comAdmin<T>(idToken: string, acao: () => Promise<T>): Promise<Resultado<T>> {
  const { exigirAdmin } = await import("./auth.server");
  try {
    await exigirAdmin(idToken);
  } catch (error) {
    console.error("admin: acesso recusado", error instanceof Error ? error.message : error);
    return { ok: false, erro: "Sem autorização. Saia e volte a entrar." };
  }
  try {
    return { ok: true, dados: await acao() };
  } catch (error) {
    console.error("admin: operação falhou", error instanceof Error ? error.message : error);
    return { ok: false, erro: "Não foi possível concluir a operação. Tente novamente." };
  }
}

/** Who is logged in and whether they are the administrator (shows the uid to set ADMIN_UID). */
export const adminSessao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Token.parse(input))
  .handler(async ({ data }) => {
    const { verificarToken } = await import("./auth.server");
    try {
      const { uid } = await verificarToken(data.idToken);
      const admin = process.env["ADMIN_UID"]?.trim();
      return { valido: true, autorizado: Boolean(admin) && uid === admin, uid };
    } catch {
      return { valido: false, autorizado: false, uid: null as string | null };
    }
  });

export const adminListarPedidos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Token.parse(input))
  .handler(async ({ data }) => {
    const { listarPedidos } = await import("./admin.server");
    return comAdmin(data.idToken, listarPedidos);
  });

export const adminDetalhePedido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ComPedido.parse(input))
  .handler(async ({ data }) => {
    const { detalhePedido } = await import("./admin.server");
    return comAdmin(data.idToken, () => detalhePedido(data.id));
  });

export const adminReprocessar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ComPedido.parse(input))
  .handler(async ({ data }) => {
    const { reprocessarPedido } = await import("./admin.server");
    return comAdmin(data.idToken, () => reprocessarPedido(data.id));
  });

export const adminResolver = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    ComPedido.extend({
      itens: z
        .array(
          z.object({
            catalogoId: z.string().regex(/^[a-z0-9-]{2,40}$/),
            quantidade: z.number().int().min(1).max(100),
          }),
        )
        .min(1)
        .max(20),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { resolverPedido } = await import("./admin.server");
    return comAdmin(data.idToken, () => resolverPedido(data.id, data.itens));
  });

export const adminNotificar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ComPedido.parse(input))
  .handler(async ({ data }) => {
    const { enviarNotificacao } = await import("./admin.server");
    return comAdmin(data.idToken, () => enviarNotificacao(data.id));
  });

export const adminCatalogo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Token.parse(input))
  .handler(async ({ data }) => {
    const { catalogoCompleto } = await import("./admin.server");
    return comAdmin(data.idToken, catalogoCompleto);
  });

export const adminGuardarItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    Token.extend({
      id: z.string().regex(/^[a-z0-9-]{2,40}$/),
      novo: z.boolean(),
      dados: z.unknown(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { guardarItemCatalogo } = await import("./admin.server");
    return comAdmin(data.idToken, () => guardarItemCatalogo(data.id, data.dados, data.novo));
  });
