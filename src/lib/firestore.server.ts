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

type RestValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  stringValue?: string;
  timestampValue?: string;
  referenceValue?: string;
  arrayValue?: { values?: RestValue[] };
  mapValue?: { fields?: Record<string, RestValue> };
};

function decodeValue(value: RestValue): FirestoreValue {
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.timestampValue !== undefined) return new Date(value.timestampValue);
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decodeValue);
  if (value.mapValue) return decodeFields(value.mapValue.fields ?? {});
  return null;
}

function decodeFields(fields: Record<string, RestValue>): { [key: string]: FirestoreValue } {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
  );
}

export type FirestoreDocument = { id: string; data: { [key: string]: FirestoreValue } };

type RestDocument = { name: string; fields?: Record<string, RestValue> };

function toDocument(doc: RestDocument): FirestoreDocument {
  return {
    id: doc.name.slice(doc.name.lastIndexOf("/") + 1),
    data: decodeFields(doc.fields ?? {}),
  };
}

/** Authenticated request to `.../documents/<path>`. Non-2xx statuses are returned, not thrown. */
async function request(method: string, path: string, body?: unknown): Promise<Response> {
  const account = readServiceAccount();
  const token = await getAccessToken(account);
  const url =
    `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)` +
    `/documents/${path}`;
  return fetch(url, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10_000),
  });
}

async function fail(action: string, path: string, response: Response): Promise<never> {
  console.error(
    `Firestore ${action} error`,
    path,
    response.status,
    (await response.text()).slice(0, 500),
  );
  throw new Error(`FIRESTORE_${response.status}`);
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
  const path = `${collection}?documentId=${encodeURIComponent(id)}`;
  const response = await request("POST", path, { fields: encodeFields(data) });
  if (response.ok) return "created";
  if (response.status === 409) return "exists";
  return fail("write", path, response);
}

export async function getDocument(
  collection: string,
  id: string,
): Promise<FirestoreDocument | null> {
  const path = `${collection}/${encodeURIComponent(id)}`;
  const response = await request("GET", path);
  if (response.status === 404) return null;
  if (!response.ok) return fail("read", path, response);
  return toDocument((await response.json()) as RestDocument);
}

/** Every document in a collection, optionally ordered (e.g. "criadoEm desc"). */
export async function listDocuments(
  collection: string,
  orderBy?: string,
): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "300" });
    if (orderBy) params.set("orderBy", orderBy);
    if (pageToken) params.set("pageToken", pageToken);
    const path = `${collection}?${params}`;
    const response = await request("GET", path);
    if (!response.ok) return fail("list", path, response);
    const page = (await response.json()) as { documents?: RestDocument[]; nextPageToken?: string };
    documents.push(...(page.documents ?? []).map(toDocument));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}

/** Overwrites only the given fields of an existing document (fails if it does not exist). */
export async function updateDocument(
  collection: string,
  id: string,
  data: { [key: string]: FirestoreValue },
): Promise<void> {
  const params = new URLSearchParams({ "currentDocument.exists": "true" });
  for (const field of Object.keys(data)) params.append("updateMask.fieldPaths", field);
  const path = `${collection}/${encodeURIComponent(id)}?${params}`;
  const response = await request("PATCH", path, { fields: encodeFields(data) });
  if (!response.ok) return fail("update", path, response);
}
