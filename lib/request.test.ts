import { describe, expect, it } from "vitest";
import { buildUrl, paramsFromUrl, toProxyRequest } from "./request";
import type { KeyValue, RequestState } from "./types";

function row(key: string, value: string, enabled = true): KeyValue {
  return { id: `${key}:${value}`, key, value, enabled };
}

describe("buildUrl", () => {
  it("appends enabled params and encodes them", () => {
    expect(buildUrl("https://api.test/search", [row("q", "a b"), row("n", "1")])).toBe(
      "https://api.test/search?q=a%20b&n=1",
    );
  });

  it("skips disabled and empty rows", () => {
    const params = [row("a", "1"), row("b", "2", false), row("", "3")];
    expect(buildUrl("https://api.test", params)).toBe("https://api.test?a=1");
  });

  it("replaces an existing query string and preserves the hash", () => {
    expect(buildUrl("https://api.test/p?old=1#frag", [row("new", "2")])).toBe(
      "https://api.test/p?new=2#frag",
    );
  });

  it("drops the query when no params remain", () => {
    expect(buildUrl("https://api.test?old=1", [])).toBe("https://api.test");
  });
});

describe("paramsFromUrl", () => {
  it("parses the query into rows with a trailing blank", () => {
    const rows = paramsFromUrl("https://api.test?a=1&b=two");
    expect(rows.slice(0, 2).map((r) => [r.key, r.value])).toEqual([
      ["a", "1"],
      ["b", "two"],
    ]);
    expect(rows[rows.length - 1]).toMatchObject({ key: "", value: "" });
  });

  it("returns a single blank row when there is no query", () => {
    const rows = paramsFromUrl("https://api.test");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: "", value: "" });
  });
});

function baseState(overrides: Partial<RequestState> = {}): RequestState {
  return {
    method: "POST",
    url: "https://api.test/resource",
    params: [],
    headers: [row("X-Custom", "1"), row("", "")],
    bodyMode: "json",
    body: '{"hello":"world"}',
    auth: { mode: "none", token: "", username: "", password: "" },
    ...overrides,
  };
}

describe("toProxyRequest", () => {
  it("forwards enabled headers and adds a JSON content-type", () => {
    const req = toProxyRequest(baseState());
    expect(req.headers).toContainEqual({ key: "X-Custom", value: "1" });
    expect(req.headers).toContainEqual({ key: "Content-Type", value: "application/json" });
    expect(req.body).toBe('{"hello":"world"}');
  });

  it("does not override an existing content-type", () => {
    const req = toProxyRequest(
      baseState({ headers: [row("Content-Type", "application/ld+json")] }),
    );
    const contentTypes = req.headers.filter((h) => h.key.toLowerCase() === "content-type");
    expect(contentTypes).toHaveLength(1);
    expect(contentTypes[0].value).toBe("application/ld+json");
  });

  it("injects a bearer token", () => {
    const req = toProxyRequest(
      baseState({ auth: { mode: "bearer", token: "abc123", username: "", password: "" } }),
    );
    expect(req.headers).toContainEqual({ key: "Authorization", value: "Bearer abc123" });
  });

  it("encodes basic auth", () => {
    const req = toProxyRequest(
      baseState({ auth: { mode: "basic", token: "", username: "user", password: "pass" } }),
    );
    expect(req.headers).toContainEqual({
      key: "Authorization",
      value: `Basic ${Buffer.from("user:pass").toString("base64")}`,
    });
  });

  it("omits the body when the mode is none", () => {
    const req = toProxyRequest(baseState({ bodyMode: "none" }));
    expect(req.body).toBeNull();
  });
});
