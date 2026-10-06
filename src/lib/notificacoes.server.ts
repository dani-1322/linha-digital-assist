import { getDocument, updateDocument } from "./firestore.server";
import { euros } from "./propostas.server";

// Internal notification to the student when a proposal is created ("O Resend envia a
// notificação"). It goes only to EMAIL_ALUNO, from onboarding@resend.dev: without its own
// domain, Resend only delivers to the account's own address, so clients never get emails.
//
// States: por_enviar → aceite (Resend returned an id) | falhou (Resend answered with an error)
// | nao_configurado (missing settings). "a_enviar" means the outcome is unknown (e.g. the
// connection dropped): retrying then reuses the same Idempotency-Key, so Resend cannot send
// the same email twice. Accepted by Resend is not the same as delivered to the inbox.

export type EstadoNotificacao = "por_enviar" | "a_enviar" | "aceite" | "falhou" | "nao_configurado";

const REMETENTE = "Linha Digital <onboarding@resend.dev>";
const BASE_URL_PADRAO = "https://linha-digital-assist.lovable.app";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Conteudo = {
  numero: string;
  nome: string;
  email: string;
  resumo: string;
  valor: string;
  link: string;
  admin: string;
  demonstracao: boolean;
};

/** Subject, HTML and text of the notification. Client and AI text is always escaped. */
export function montarEmail(c: Conteudo): { subject: string; html: string; text: string } {
  const aviso = c.demonstracao ? "Proposta de demonstração: os preços são fictícios." : "";
  const linhas = [
    `Foi criada a proposta ${c.numero}.`,
    `Cliente: ${c.nome} (${c.email})`,
    `Pedido: ${c.resumo}`,
    `Valor (sem IVA): ${c.valor}`,
    ...(aviso ? [aviso] : []),
    `Proposta: ${c.link}`,
    `Área de administração: ${c.admin}`,
    "",
    "Notificação interna da Linha Digital. O cliente não recebe este email.",
  ];
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1b2b2e">
<p style="margin:0 0 12px"><strong>Foi criada a proposta ${escapar(c.numero)}.</strong></p>
<p style="margin:0 0 4px">Cliente: ${escapar(c.nome)} (${escapar(c.email)})</p>
<p style="margin:0 0 4px">Pedido: ${escapar(c.resumo)}</p>
<p style="margin:0 0 12px">Valor (sem IVA): <strong>${escapar(c.valor)}</strong></p>
${aviso ? `<p style="margin:0 0 12px;color:#9a4a2e">${escapar(aviso)}</p>` : ""}
<p style="margin:0 0 4px"><a href="${escapar(c.link)}">Abrir a proposta</a></p>
<p style="margin:0 0 16px"><a href="${escapar(c.admin)}">Área de administração</a></p>
<p style="margin:0;font-size:12px;color:#5b6b6e">Notificação interna da Linha Digital. O cliente não recebe este email.</p>
</div>`;
  return {
    subject: `Nova proposta ${c.numero} — ${c.valor}`,
    html,
    text: linhas.join("\n"),
  };
}

function valorTexto(unico: number, mensal: number): string {
  const partes: string[] = [];
  if (unico > 0) partes.push(euros.format(unico / 100));
  if (mensal > 0) partes.push(`${euros.format(mensal / 100)}/mês`);
  return partes.join(" + ") || euros.format(0);
}

/**
 * Sends (or retries) the notification of a proposal. Never sends again once Resend accepted
 * it. Returns the resulting state; problems are stored on the proposal, not thrown, because
 * the notification is independent from the request's own state.
 */
export async function notificarProposta(propostaId: string): Promise<EstadoNotificacao> {
  const proposta = await getDocument("propostas", propostaId);
  if (!proposta) throw new Error("PROPOSTA_NAO_ENCONTRADA");
  const p = proposta.data;
  const estadoAtual = p["estadoNotificacao"] as EstadoNotificacao | undefined;
  if (estadoAtual === "aceite") return "aceite";

  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const para = process.env["EMAIL_ALUNO"]?.trim();
  if (!apiKey || !para) {
    await updateDocument("propostas", propostaId, {
      estadoNotificacao: "nao_configurado",
      erroNotificacao: "RESEND_API_KEY ou EMAIL_ALUNO não definidos.",
    });
    return "nao_configurado";
  }

  const pedido = await getDocument("pedidos", String(p["pedidoId"] ?? propostaId));
  const base = (process.env["APP_BASE_URL"]?.trim() || BASE_URL_PADRAO).replace(/\/+$/, "");
  const email = montarEmail({
    numero: String(p["numero"] ?? propostaId),
    nome: String(pedido?.data["nome"] ?? "—"),
    email: String(pedido?.data["email"] ?? "—"),
    resumo: String(p["resumo"] ?? ""),
    valor: valorTexto(Number(p["totalUnicoCentimos"] ?? 0), Number(p["totalMensalCentimos"] ?? 0)),
    link: String(p["link"] ?? ""),
    admin: `${base}/admin`,
    demonstracao: p["demonstracao"] === true,
  });

  // Same attempt number (and so the same Idempotency-Key) while the last outcome is unknown.
  const anteriores = Number(p["tentativasNotificacao"] ?? 0);
  const tentativa = estadoAtual === "a_enviar" && anteriores > 0 ? anteriores : anteriores + 1;
  await updateDocument("propostas", propostaId, {
    estadoNotificacao: "a_enviar",
    tentativasNotificacao: tentativa,
    notificacaoTentadaEm: new Date(),
  });

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": `proposta-${propostaId}-${tentativa}`,
      },
      body: JSON.stringify({ from: REMETENTE, to: [para], ...email }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    // Unknown outcome: stays "a_enviar", and the next attempt reuses the same key.
    const mensagem = error instanceof Error ? error.message : String(error);
    await updateDocument("propostas", propostaId, {
      erroNotificacao: `Sem resposta do Resend: ${mensagem}`,
    });
    return "a_enviar";
  }

  if (response.ok) {
    const { id } = (await response.json()) as { id?: string };
    await updateDocument("propostas", propostaId, {
      estadoNotificacao: "aceite",
      resendId: id ?? null,
      erroNotificacao: null,
    });
    return "aceite";
  }
  const detalhe = (await response.text()).slice(0, 300);
  console.error("Resend error", response.status, detalhe);
  await updateDocument("propostas", propostaId, {
    estadoNotificacao: "falhou",
    erroNotificacao: `Resend respondeu ${response.status}: ${detalhe}`,
  });
  return "falhou";
}

/** For the processing flow: a notification problem must never turn the request into "erro". */
export async function notificarSemFalhar(propostaId: string): Promise<void> {
  try {
    await notificarProposta(propostaId);
  } catch (error) {
    console.error("Notificação falhou", propostaId, error instanceof Error ? error.message : error);
  }
}
