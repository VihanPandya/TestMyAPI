import { describe, expect, it } from "vitest";
import { parseCurl } from "./curl";

describe("parseCurl", () => {
  it("parses a bare URL as a GET", () => {
    const r = parseCurl("curl https://api.test/users");
    expect(r?.method).toBe("GET");
    expect(r?.url).toBe("https://api.test/users");
  });

  it("parses method, headers and a JSON body", () => {
    const r = parseCurl(
      `curl -X POST 'https://api.test/charges' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Key: abc' \\\n  --data '{"amount":4200}'`,
    );
    expect(r?.method).toBe("POST");
    expect(r?.bodyMode).toBe("json");
    expect(r?.body).toBe('{"amount":4200}');
    const headers = r!.headers.filter((h) => h.key !== "");
    expect(headers).toContainEqual(expect.objectContaining({ key: "Content-Type", value: "application/json" }));
    expect(headers).toContainEqual(expect.objectContaining({ key: "X-Key", value: "abc" }));
  });

  it("infers POST when a body is present without -X", () => {
    const r = parseCurl("curl https://api.test --data 'x=1'");
    expect(r?.method).toBe("POST");
    expect(r?.bodyMode).toBe("text");
  });

  it("maps -u to basic auth", () => {
    const r = parseCurl("curl https://api.test -u alice:secret");
    expect(r?.auth.mode).toBe("basic");
    expect(r?.auth.username).toBe("alice");
    expect(r?.auth.password).toBe("secret");
  });

  it("handles -XPOST and double-quoted values", () => {
    const r = parseCurl('curl -XPUT "https://api.test/items/1" -H "Accept: */*"');
    expect(r?.method).toBe("PUT");
    expect(r?.url).toBe("https://api.test/items/1");
  });

  it("ignores cosmetic flags and consumes value flags", () => {
    const r = parseCurl("curl --compressed -L -A 'my-agent' https://api.test/end");
    expect(r?.url).toBe("https://api.test/end");
    const headers = r!.headers.filter((h) => h.key !== "");
    expect(headers).toHaveLength(0); // -A value must not become a header or the URL
  });

  it("returns null without a URL", () => {
    expect(parseCurl("curl -X POST")).toBeNull();
    expect(parseCurl("")).toBeNull();
  });
});
