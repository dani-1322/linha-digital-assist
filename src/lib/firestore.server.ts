// Minimal Firestore client over the REST API, authenticated with the service account in
// FIREBASE_SERVICE_ACCOUNT (base64 of the JSON key). It only uses fetch and Web Crypto:
// Lovable runs the server on Cloudflare Workers (nitro preset cloudflare-module), where
// firebase-admin's gRPC/Node dependencies are not guaranteed to work.

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export type FirestoreValue =
  null | boolean | number | string | Date | FirestoreValue[] | { [key: string]: FirestoreValue };

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

let cachedToken: { value: string; expiresAt: number } | undefined;

function readServiceAccount(): ServiceAccount {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT"]?.trim();
  if (!raw) throw new Error("FIRESTORE_NOT_CONFIGURED");
  try {
    const json = new TextDecoder().decode(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)));
    const account = JSON.parse(json) as Partial<ServiceAccount>;
    if (account.project_id && account.client_email && account.private_key) {
      return {
        project_id: account.project_id,
        client_email: account.client_email,
        private_key: account.private_key,
      };
    }
  } catch {
    // Fall through to the error below.
  }
  throw new Error("FIRESTORE_INVALID_SERVICE_ACCOUNT");
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64Url(
    encoder.encode(
      JSON.stringify({
        iss: account.client_email,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const pem = account.private_key
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(`${header}.${claims}`),
  );
  return `${header}.${claims}.${base64Url(new Uint8Array(signature))}`;
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: await signJwt(account),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("Firestore token error", response.status, (await response.text()).slice(0, 500));
    throw new Error(`FIRESTORE_AUTH_${response.status}`);
  }
  const { access_token, expires_in } = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}

function encodeValue(value: FirestoreValue): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(value) } };
}

function encodeFields(data: { [key: string]: FirestoreValue }): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

/**
 * Creates `collection/id`. Returns "exists" instead of failing when the document is already
 * there, so a repeated submission with the same id is safe to retry.
 */
export async function createDocument(
  collection: string,
  id: string,
  data: { [key: string]: FirestoreValue },
): Promise<"created" | "exists"> {
  const account = readServiceAccount();
  const token = await getAccessToken(account);
  const url =
    `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)` +
    `/documents/${collection}?documentId=${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.ok) return "created";
  if (response.status === 409) return "exists";
  console.error(
    "Firestore write error",
    collection,
    response.status,
    (await response.text()).slice(0, 500),
  );
  throw new Error(`FIRESTORE_${response.status}`);
}
