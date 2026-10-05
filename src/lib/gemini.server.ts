// Gemini API calls shared by the chatbot and the interpretation of proposal requests:
// GEMINI_MODEL first (optional), then the default models; retries when the service is
// overloaded; a model that returns 404 (wrong or retired name) or has used up its daily quota
// is skipped.

// The free tier allows only 20 requests per day per model, counted per project, so several
// models act as reserves: each one brings its own daily quota.
const DEFAULT_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
];

type GenerateOptions = {
  /** Delay in ms before each round over the models. */
  attempts?: number[];
  timeoutMs?: number;
};

/** Sends a generateContent request and returns the text of the first candidate ("" if empty). */
export async function generateText(
  request: object,
  options: GenerateOptions = {},
): Promise<string> {
  const { attempts = [0, 2000, 5000], timeoutMs = 20_000 } = options;
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("MISSING_KEY");

  const configured = process.env["GEMINI_MODEL"]?.trim();
  const models = configured
    ? [configured, ...DEFAULT_MODELS.filter((m) => m !== configured)]
    : DEFAULT_MODELS;

  const body = JSON.stringify(request);
  let payload: unknown = null;
  let lastStatus = "NO_RESPONSE";
  const skipped = new Set<string>();

  outer: for (const delay of attempts) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    for (const model of models) {
      if (skipped.has(model)) continue;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
            body,
            signal: AbortSignal.timeout(timeoutMs),
          },
        );
        if (response.ok) {
          payload = await response.json();
          break outer;
        }
        lastStatus = String(response.status);
        const detail = await response.text();
        console.error("Gemini error", model, response.status, detail.slice(0, 500));
        // 404: unknown model. 429 "PerDay": daily quota used up until midnight Pacific time,
        // so retrying this model within the same call is pointless.
        if (response.status === 404 || (response.status === 429 && detail.includes("PerDay"))) {
          skipped.add(model);
          if (skipped.size === models.length) break outer;
          continue;
        }
        if (response.status !== 503 && response.status !== 429 && response.status < 500)
          break outer;
      } catch (error) {
        lastStatus = "NETWORK";
        console.error("Gemini fetch failed", model, error instanceof Error ? error.message : error);
      }
    }
  }

  if (!payload) throw new Error(`GEMINI_${lastStatus}`);

  const parsed = payload as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    parsed.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) console.error("Gemini empty reply", JSON.stringify(parsed).slice(0, 500));
  return text;
}
