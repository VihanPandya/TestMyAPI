import { toProxyRequest } from "./request";
import type { RequestState } from "./types";

export type CodegenTarget = "curl" | "fetch";

export const CODEGEN_TARGETS: { id: CodegenTarget; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "fetch", label: "fetch (JS)" },
];

/** Escape a value for safe inclusion inside shell single quotes. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

/** Render the request as a copy-pasteable `curl` command. */
export function toCurl(state: RequestState): string {
  const req = toProxyRequest(state);
  const parts = ["curl"];
  if (req.method !== "GET") parts.push(`-X ${req.method}`);
  parts.push(shellQuote(req.url));
  for (const header of req.headers) {
    parts.push(`-H ${shellQuote(`${header.key}: ${header.value}`)}`);
  }
  if (req.body != null) parts.push(`--data ${shellQuote(req.body)}`);
  return parts.join(" \\\n  ");
}

/** Render the request as a `fetch` call. */
export function toFetch(state: RequestState): string {
  const req = toProxyRequest(state);
  const lines = [`await fetch(${JSON.stringify(req.url)}, {`, `  method: ${JSON.stringify(req.method)},`];

  if (req.headers.length > 0) {
    lines.push("  headers: {");
    for (const header of req.headers) {
      lines.push(`    ${JSON.stringify(header.key)}: ${JSON.stringify(header.value)},`);
    }
    lines.push("  },");
  }
  if (req.body != null) lines.push(`  body: ${JSON.stringify(req.body)},`);

  lines.push("});");
  return lines.join("\n");
}

export function generate(target: CodegenTarget, state: RequestState): string {
  return target === "curl" ? toCurl(state) : toFetch(state);
}
