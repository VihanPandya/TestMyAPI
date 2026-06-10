import { describe, expect, it } from "vitest";
import { toCurl, toFetch } from "./codegen";
import { parseCurl } from "./curl";
import type { KeyValue, RequestState } from "./types";

function row(key: string, value: string): KeyValue {
  return { id: `${key}`, key, value, enabled: true };
}

function state(overrides: Partial<RequestState> = {}): RequestState {
  return {
    method: "POST",
    url: "https://api.test/charges",
    params: [],
    headers: [row("X-Key", "abc")],
    bodyMode: "json",
    body: '{"amount":4200}',
    auth: { mode: "none", token: "", username: "", password: "" },
    ...overrides,
  };
}

describe("toCurl", () => {
  it("renders method, headers and body", () => {
    const out = toCurl(state());
    expect(out).toContain("curl");
    expect(out).toContain("-X POST");
    expect(out).toContain("'https://api.test/charges'");
    expect(out).toContain("-H 'X-Key: abc'");
    expect(out).toContain("-H 'Content-Type: application/json'");
    expect(out).toContain(`--data '{"amount":4200}'`);
  });

  it("omits -X for a plain GET", () => {
    const out = toCurl(state({ method: "GET", bodyMode: "none", body: "" }));
    expect(out).not.toContain("-X");
    expect(out).not.toContain("--data");
  });

  it("escapes single quotes safely", () => {
    const out = toCurl(state({ body: "it's", bodyMode: "text" }));
    expect(out).toContain(`'it'\\''s'`);
  });

  it("round-trips through parseCurl", () => {
    const original = state();
    const parsed = parseCurl(toCurl(original));
    expect(parsed?.method).toBe("POST");
    expect(parsed?.url).toBe("https://api.test/charges");
    expect(parsed?.body).toBe('{"amount":4200}');
  });
});

describe("toFetch", () => {
  it("renders a fetch call with headers and body", () => {
    const out = toFetch(state());
    expect(out).toContain('await fetch("https://api.test/charges", {');
    expect(out).toContain('method: "POST"');
    expect(out).toContain('"X-Key": "abc"');
    expect(out).toContain('body: "{\\"amount\\":4200}"');
  });

  it("omits headers and body when empty", () => {
    const out = toFetch(state({ headers: [], bodyMode: "none", body: "", method: "GET" }));
    expect(out).not.toContain("headers");
    expect(out).not.toContain("body");
  });
});
