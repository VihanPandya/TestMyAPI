import { NextResponse } from "next/server";
import { performProxyRequest } from "@/lib/proxy";
import { isHttpMethod, type ProxyRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Private/loopback hosts are blocked in production so a public deployment can't
 * be turned into an SSRF tool. They're allowed in development so you can test a
 * server running on localhost. Set ALLOW_PRIVATE_HOSTS to override either way.
 */
function privateHostsAllowed(): boolean {
  const flag = process.env.ALLOW_PRIVATE_HOSTS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

type ParseResult = { ok: true; value: ProxyRequest } | { ok: false; error: string };

function parsePayload(payload: unknown): ParseResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "Expected a JSON object." };
  }
  const { method, url, headers, body } = payload as Record<string, unknown>;

  if (typeof method !== "string" || !isHttpMethod(method)) {
    return { ok: false, error: "Unsupported or missing HTTP method." };
  }
  if (typeof url !== "string" || url.trim() === "") {
    return { ok: false, error: "A request URL is required." };
  }
  if (!Array.isArray(headers)) {
    return { ok: false, error: "Headers must be an array." };
  }

  const parsedHeaders: ProxyRequest["headers"] = [];
  for (const entry of headers) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>).key !== "string" ||
      typeof (entry as Record<string, unknown>).value !== "string"
    ) {
      return { ok: false, error: "Each header must have a string key and value." };
    }
    parsedHeaders.push({
      key: (entry as { key: string }).key,
      value: (entry as { value: string }).value,
    });
  }

  if (body != null && typeof body !== "string") {
    return { ok: false, error: "Body must be a string or null." };
  }

  return {
    ok: true,
    value: { method, url: url.trim(), headers: parsedHeaders, body: (body as string) ?? null },
  };
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = parsePayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const outcome = await performProxyRequest(parsed.value, {
    allowPrivate: privateHostsAllowed(),
  });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  return NextResponse.json(outcome.response);
}
