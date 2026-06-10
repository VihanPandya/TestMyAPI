import { emptyRow, paramsFromUrl, uid, withTrailingRow } from "./request";
import { isHttpMethod, type AuthState, type BodyMode, type KeyValue, type RequestState } from "./types";

/** Flags that consume the following token as their value (so it isn't mistaken for the URL). */
const VALUE_FLAGS = new Set([
  "-A",
  "--user-agent",
  "-e",
  "--referer",
  "-b",
  "--cookie",
  "-m",
  "--max-time",
  "--connect-timeout",
  "-o",
  "--output",
  "-w",
  "--write-out",
  "-T",
  "--upload-file",
  "--retry",
  "-c",
  "--cookie-jar",
]);

const DATA_FLAGS = new Set([
  "-d",
  "--data",
  "--data-raw",
  "--data-ascii",
  "--data-binary",
  "--data-urlencode",
]);

/** Split a command line into tokens, honoring single/double quotes and escapes. */
function tokenize(input: string): string[] {
  const s = input.replace(/\\\r?\n/g, " "); // fold line continuations
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i += 1;
      continue;
    }
    let token = "";
    while (i < s.length && !/\s/.test(s[i])) {
      const c = s[i];
      if (c === "'") {
        i += 1;
        while (i < s.length && s[i] !== "'") token += s[i++];
        i += 1;
      } else if (c === '"') {
        i += 1;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\" && i + 1 < s.length) {
            token += s[i + 1];
            i += 2;
          } else {
            token += s[i++];
          }
        }
        i += 1;
      } else if (c === "\\" && i + 1 < s.length) {
        token += s[i + 1];
        i += 2;
      } else {
        token += c;
        i += 1;
      }
    }
    tokens.push(token);
  }
  return tokens;
}

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  if (t[0] !== "{" && t[0] !== "[") return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a `curl` command into a request. Returns null when no URL is present.
 * Supports the flags people actually paste: -X, -H, -d/--data*, -u, --url,
 * and ignores cosmetic flags like --compressed, -L, -k, -s.
 */
export function parseCurl(input: string): RequestState | null {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) return null;

  let i = tokens[0] === "curl" ? 1 : 0;
  let method: string | null = null;
  let url: string | null = null;
  let body: string | null = null;
  let user: string | null = null;
  const headers: { key: string; value: string }[] = [];

  for (; i < tokens.length; i += 1) {
    const t = tokens[i];

    if (t === "-X" || t === "--request") {
      method = tokens[++i] ?? method;
    } else if (/^-X./.test(t)) {
      method = t.slice(2);
    } else if (t === "-H" || t === "--header") {
      const h = tokens[++i] ?? "";
      const idx = h.indexOf(":");
      if (idx > 0) headers.push({ key: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim() });
    } else if (DATA_FLAGS.has(t)) {
      const d = tokens[++i] ?? "";
      body = body == null ? d : `${body}&${d}`;
    } else if (t === "-u" || t === "--user") {
      user = tokens[++i] ?? null;
    } else if (t === "--url") {
      url = tokens[++i] ?? url;
    } else if (VALUE_FLAGS.has(t)) {
      i += 1; // consume and ignore the value
    } else if (t.startsWith("-")) {
      // cosmetic / no-arg flag (e.g. --compressed, -L, -k, -s) — ignore
    } else if (!url) {
      url = t;
    }
  }

  if (!url) return null;

  const resolvedMethod = (method ?? (body != null ? "POST" : "GET")).toUpperCase();
  const finalMethod = isHttpMethod(resolvedMethod)
    ? resolvedMethod
    : body != null
      ? "POST"
      : "GET";

  const headerRows: KeyValue[] = headers.map((h) => ({
    id: uid(),
    key: h.key,
    value: h.value,
    enabled: true,
  }));

  let bodyMode: BodyMode = "none";
  if (body != null) {
    const hasJsonHeader = headers.some(
      (h) => h.key.toLowerCase() === "content-type" && h.value.toLowerCase().includes("json"),
    );
    bodyMode = hasJsonHeader || looksLikeJson(body) ? "json" : "text";
  }

  const auth: AuthState = { mode: "none", token: "", username: "", password: "" };
  if (user != null) {
    const sep = user.indexOf(":");
    auth.mode = "basic";
    auth.username = sep === -1 ? user : user.slice(0, sep);
    auth.password = sep === -1 ? "" : user.slice(sep + 1);
  }

  return {
    method: finalMethod,
    url,
    params: paramsFromUrl(url),
    headers: withTrailingRow(headerRows.length > 0 ? headerRows : [emptyRow()]),
    bodyMode,
    body: body ?? "",
    auth,
  };
}
