import { lookup } from "node:dns/promises";
import { isPrivateAddress, validateUrl } from "./ssrf";
import type { ProxyRequest, ProxyResponse } from "./types";

export const DEFAULT_TIMEOUT_MS = 30_000;
export const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB cap on the response we buffer

/**
 * Headers a client is not allowed to set on the forwarded request. Hop-by-hop
 * headers and length/host headers are managed by the runtime and would either
 * be rejected by undici or corrupt the upstream request if we passed them on.
 */
const FORBIDDEN_REQUEST_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "te",
  "trailer",
  "proxy-connection",
]);

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

export interface ProxyOptions {
  /** Permit requests to private / loopback addresses (local development). */
  allowPrivate: boolean;
  timeoutMs?: number;
  maxBodyBytes?: number;
}

export type ProxyOutcome =
  | { ok: true; response: ProxyResponse }
  | { ok: false; status: number; error: string };

function stripZone(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "");
}

async function assertPublicHost(hostname: string): Promise<string | null> {
  const host = stripZone(hostname);
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    return `Could not resolve host "${host}".`;
  }
  if (addresses.length === 0) {
    return `Could not resolve host "${host}".`;
  }
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      return `Requests to private or loopback addresses are blocked (${host} -> ${address}).`;
    }
  }
  return null;
}

function buildHeaders(req: ProxyRequest): Headers {
  const headers = new Headers();
  for (const { key, value } of req.headers) {
    const name = key.trim();
    if (!name || FORBIDDEN_REQUEST_HEADERS.has(name.toLowerCase())) continue;
    try {
      headers.append(name, value);
    } catch {
      // Skip header names/values the runtime rejects rather than failing the request.
    }
  }
  if (!headers.has("user-agent")) {
    headers.set("user-agent", "TestMyAPI/1.0");
  }
  return headers;
}

async function readBody(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; size: number; truncated: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", size: 0, truncated: false };

  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    if (size + value.byteLength > maxBytes) {
      const remaining = maxBytes - size;
      if (remaining > 0) chunks.push(value.subarray(0, remaining));
      size = maxBytes;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }

  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(buffer), size, truncated };
}

function collectHeaders(headers: Headers): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    out.push([key, value]);
  });
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie.call(headers)) {
      out.push(["set-cookie", cookie]);
    }
  }
  return out;
}

/**
 * Forward a single request to the upstream URL and return a normalized result.
 * Redirects are never followed automatically: surfacing the 3xx (with its
 * Location header) keeps the proxy from being tricked into reaching an internal
 * address via a redirect, and matches how a request inspector should behave.
 */
export async function performProxyRequest(
  req: ProxyRequest,
  opts: ProxyOptions,
): Promise<ProxyOutcome> {
  const validated = validateUrl(req.url);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.reason };
  }

  if (!opts.allowPrivate) {
    const blocked = await assertPublicHost(validated.url.hostname);
    if (blocked) {
      return { ok: false, status: 403, error: blocked };
    }
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxBodyBytes ?? MAX_BODY_BYTES;
  const hasBody = req.body != null && !METHODS_WITHOUT_BODY.has(req.method);

  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(validated.url, {
      method: req.method,
      headers: buildHeaders(req),
      body: hasBody ? req.body : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    return { ok: false, status: 502, error: describeFetchError(err, timeoutMs) };
  }

  const { text, size, truncated } = await readBody(response, maxBytes);
  const timeMs = performance.now() - started;

  return {
    ok: true,
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: collectHeaders(response.headers),
      body: text,
      timeMs: Math.round(timeMs),
      size,
      redirected: response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400),
      truncated,
    },
  };
}

function describeFetchError(err: unknown, timeoutMs: number): string {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return `Request timed out after ${Math.round(timeoutMs / 1000)}s.`;
  }
  if (err instanceof Error) {
    const cause = err.cause;
    if (cause && typeof cause === "object" && "code" in cause) {
      return `Network error: ${String((cause as { code: unknown }).code)}.`;
    }
    return err.message || "Request failed.";
  }
  return "Request failed.";
}
