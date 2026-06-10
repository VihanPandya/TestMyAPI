import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDuration,
  mediaType,
  statusKind,
  tryPrettyJson,
} from "./format";

describe("formatBytes", () => {
  it("formats across units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("handles invalid input", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(NaN)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("uses ms below a second and s above", () => {
    expect(formatDuration(250)).toBe("250 ms");
    expect(formatDuration(1830)).toBe("1.83 s");
  });
});

describe("statusKind", () => {
  it("buckets status codes", () => {
    expect(statusKind(200)).toBe("success");
    expect(statusKind(301)).toBe("redirect");
    expect(statusKind(404)).toBe("client-error");
    expect(statusKind(500)).toBe("server-error");
    expect(statusKind(100)).toBe("info");
    expect(statusKind(0)).toBe("unknown");
  });
});

describe("tryPrettyJson", () => {
  it("pretty-prints valid JSON", () => {
    const { pretty, isJson } = tryPrettyJson('{"a":1}');
    expect(isJson).toBe(true);
    expect(pretty).toBe('{\n  "a": 1\n}');
  });

  it("leaves non-JSON untouched", () => {
    const { pretty, isJson } = tryPrettyJson("<html></html>");
    expect(isJson).toBe(false);
    expect(pretty).toBe("<html></html>");
  });

  it("does not throw on truncated JSON", () => {
    const { isJson } = tryPrettyJson('{"a":');
    expect(isJson).toBe(false);
  });
});

describe("mediaType", () => {
  it("strips parameters", () => {
    expect(mediaType("application/json; charset=utf-8")).toBe("application/json");
    expect(mediaType(undefined)).toBe("");
  });
});
