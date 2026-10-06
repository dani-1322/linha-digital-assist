import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoProposta } from "./propostas.server";

export const getProposta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().max(200) }).parse(input))
  .handler(async ({ data }): Promise<ResultadoProposta | { estado: "indisponivel" }> => {
    // A malformed token is answered exactly like an unknown one.
    if (!/^[a-f0-9]{64}$/.test(data.token)) return { estado: "nao_encontrada" };
    const { obterPropostaPublica } = await import("./propostas.server");
    try {
      return await obterPropostaPublica(data.token);
    } catch (error) {
      console.error("getProposta failed", error instanceof Error ? error.message : error);
      return { estado: "indisponivel" };
    }
  });
