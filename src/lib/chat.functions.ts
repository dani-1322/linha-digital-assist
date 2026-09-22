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
      console.error("askAssistant failed", code);
      const message =
        code === "MISSING_KEY"
          ? "O assistente ainda não está configurado. Escreva para daniel.alves.132203@gmail.com."
          : code === "GEMINI_503" || code === "GEMINI_429"
            ? "O assistente está com muita procura neste momento. Tente outra vez dentro de instantes ou marque o diagnóstico gratuito no botão abaixo."
            : "Não consegui responder neste momento. Tente outra vez dentro de instantes ou marque o diagnóstico gratuito no botão abaixo.";
      return { reply: null as string | null, error: message };
    }
  });
