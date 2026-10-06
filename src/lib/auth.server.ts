import { firebaseProjectId } from "./firestore.server";

// Verifies Firebase Authentication ID tokens without firebase-admin (same reason as
// firestore.server.ts): the RS256 signature is checked against Google's public keys with Web
// Crypto, then the claims Firebase documents for ID tokens. Every admin operation calls
// exigirAdmin, so hiding buttons in the browser is never what protects the data.

const JWKS_URL =
  "https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com";

type Jwk = JsonWebKey & { kid?: string };

let cachedKeys: { keys: Jwk[]; expiresAt: number } | undefined;

async function publicKeys(): Promise<Jwk[]> {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) return cachedKeys.keys;
  const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`AUTH_KEYS_${response.status}`);
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1]);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  cachedKeys = { keys, expiresAt: Date.now() + (maxAge || 3600) * 1000 };
  return keys;
}

function fromBase64Url(part: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

function decodeJson(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(part))) as Record<string, unknown>;
}

export type Utilizador = { uid: string; email: string | null };

export async function verificarToken(idToken: string): Promise<Utilizador> {
  const [h, c, s] = idToken.split(".");
  if (!h || !c || !s) throw new Error("TOKEN_INVALIDO");
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = decodeJson(h);
    claims = decodeJson(c);
  } catch {
    throw new Error("TOKEN_INVALIDO");
  }
  if (header["alg"] !== "RS256" || typeof header["kid"] !== "string")
    throw new Error("TOKEN_INVALIDO");

  const jwk = (await publicKeys()).find((k) => k.kid === header["kid"]);
  if (!jwk) throw new Error("TOKEN_INVALIDO");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    fromBase64Url(s),
    new TextEncoder().encode(`${h}.${c}`),
  );
  if (!valid) throw new Error("TOKEN_INVALIDO");

  const projectId = firebaseProjectId();
  const now = Math.floor(Date.now() / 1000);
  const { aud, iss, sub, exp, iat, auth_time, email } = claims;
  if (
    aud !== projectId ||
    iss !== `https://securetoken.google.com/${projectId}` ||
    typeof sub !== "string" ||
    sub === "" ||
    typeof exp !== "number" ||
    exp <= now ||
    typeof iat !== "number" ||
    iat > now + 60 ||
    (typeof auth_time === "number" && auth_time > now + 60)
  ) {
    throw new Error("TOKEN_INVALIDO");
  }
  return { uid: sub, email: typeof email === "string" ? email : null };
}

/** A valid login is not enough: only the account whose uid is ADMIN_UID is the administrator. */
export async function exigirAdmin(idToken: string): Promise<Utilizador> {
  const utilizador = await verificarToken(idToken);
  const admin = process.env["ADMIN_UID"]?.trim();
  if (!admin || utilizador.uid !== admin) throw new Error("NAO_AUTORIZADO");
  return utilizador;
}
