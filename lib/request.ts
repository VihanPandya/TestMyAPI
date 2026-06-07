import type {
  AuthState,
  BodyMode,
  KeyValue,
  ProxyRequest,
  RequestState,
} from "./types";

export function uid(): string {
  return crypto.randomUUID();
}

export function emptyRow(): KeyValue {
  return { id: uid(), key: "", value: "", enabled: true };
}

const DEFAULT_AUTH: AuthState = {
  mode: "none",
  token: "",
  username: "",
  password: "",
};

export function createRequestState(): RequestState {
  return {
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/todos/1",
    params: [emptyRow()],
    headers: [emptyRow()],
    bodyMode: "none",
    body: "",
    auth: { ...DEFAULT_AUTH },
  };
}

/** Keep a single trailing blank row so there's always somewhere to type. */
export function withTrailingRow(rows: KeyValue[]): KeyValue[] {
  const last = rows[rows.length - 1];
  if (!last || last.key !== "" || last.value !== "") {
    return [...rows, emptyRow()];
  }
  return rows;
}

/** Parse the query string of a URL into editable rows. */
export function paramsFromUrl(url: string): KeyValue[] {
  const queryStart = url.indexOf("?");
  if (queryStart === -1) return [emptyRow()];

  const search = new URLSearchParams(url.slice(queryStart + 1));
  const rows: KeyValue[] = [];
  for (const [key, value] of search) {
    rows.push({ id: uid(), key, value, enabled: true });
  }
  return withTrailingRow(rows);
}

/** Rebuild a URL by replacing its query string with the enabled param rows. */
export function buildUrl(url: string, params: KeyValue[]): string {
  const queryStart = url.indexOf("?");
  const hashStart = url.indexOf("#");
  const hash = hashStart === -1 ? "" : url.slice(hashStart);
  const base = (queryStart === -1 ? (hashStart === -1 ? url : url.slice(0, hashStart)) : url.slice(0, queryStart));

  const pairs = params
    .filter((row) => row.enabled && row.key.trim() !== "")
    .map((row) => `${encodeURIComponent(row.key)}=${encodeURIComponent(row.value)}`);

  const query = pairs.length > 0 ? `?${pairs.join("&")}` : "";
  return `${base}${query}${hash}`;
}

const CONTENT_TYPE_FOR_MODE: Partial<Record<BodyMode, string>> = {
  json: "application/json",
};

/** Collapse the UI request state into the payload the proxy route expects. */
export function toProxyRequest(state: RequestState): ProxyRequest {
  const headers = state.headers
    .filter((row) => row.enabled && row.key.trim() !== "")
    .map((row) => ({ key: row.key.trim(), value: row.value }));

  const hasHeader = (name: string) =>
    headers.some((h) => h.key.toLowerCase() === name.toLowerCase());

  if (state.auth.mode === "bearer" && state.auth.token.trim() !== "" && !hasHeader("authorization")) {
    headers.push({ key: "Authorization", value: `Bearer ${state.auth.token.trim()}` });
  } else if (state.auth.mode === "basic" && (state.auth.username || state.auth.password) && !hasHeader("authorization")) {
    const encoded = base64(`${state.auth.username}:${state.auth.password}`);
    headers.push({ key: "Authorization", value: `Basic ${encoded}` });
  }

  const sendsBody = state.bodyMode !== "none" && state.body.trim() !== "";
  const contentType = CONTENT_TYPE_FOR_MODE[state.bodyMode];
  if (sendsBody && contentType && !hasHeader("content-type")) {
    headers.push({ key: "Content-Type", value: contentType });
  }

  return {
    method: state.method,
    url: state.url.trim(),
    headers,
    body: sendsBody ? state.body : null,
  };
}

function base64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
