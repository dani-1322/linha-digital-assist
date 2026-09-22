import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { askGemini } = await import("./chat.server");
    try {
      return { reply: await askGemini(data.messages), error: null as string | null };
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      const message =
        code === "MISSING_KEY"
          ? "O assistente ainda não está configurado. Escreva para daniel.alves.132203@gmail.com."
          : "Não consegui responder neste momento. Tente outra vez dentro de instantes.";
      return { reply: null as string | null, error: message };
    }
  });
