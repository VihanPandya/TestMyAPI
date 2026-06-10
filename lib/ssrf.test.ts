import { describe, expect, it } from "vitest";
import {
  isPrivateAddress,
  isPrivateIpv4,
  isPrivateIpv6,
  validateUrl,
} from "./ssrf";

describe("validateUrl", () => {
  it("accepts http and https URLs", () => {
    expect(validateUrl("https://example.com/path").ok).toBe(true);
    expect(validateUrl("http://example.com").ok).toBe(true);
  });

  it("rejects non-http schemes", () => {
    expect(validateUrl("file:///etc/passwd").ok).toBe(false);
    expect(validateUrl("ftp://example.com").ok).toBe(false);
    expect(validateUrl("gopher://example.com").ok).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validateUrl("not a url").ok).toBe(false);
    expect(validateUrl("").ok).toBe(false);
  });
});

describe("isPrivateIpv4", () => {
  it("flags loopback, private and link-local ranges", () => {
    expect(isPrivateIpv4("127.0.0.1")).toBe(true);
    expect(isPrivateIpv4("10.1.2.3")).toBe(true);
    expect(isPrivateIpv4("172.16.5.4")).toBe(true);
    expect(isPrivateIpv4("172.31.255.255")).toBe(true);
    expect(isPrivateIpv4("192.168.0.1")).toBe(true);
    expect(isPrivateIpv4("169.254.169.254")).toBe(true); // cloud metadata
    expect(isPrivateIpv4("100.64.0.1")).toBe(true); // CGNAT
    expect(isPrivateIpv4("0.0.0.0")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isPrivateIpv4("8.8.8.8")).toBe(false);
    expect(isPrivateIpv4("1.1.1.1")).toBe(false);
    expect(isPrivateIpv4("172.32.0.1")).toBe(false); // just outside 172.16/12
    expect(isPrivateIpv4("93.184.216.34")).toBe(false);
  });
});

describe("isPrivateIpv6", () => {
  it("flags loopback, unique-local and link-local", () => {
    expect(isPrivateIpv6("::1")).toBe(true);
    expect(isPrivateIpv6("fc00::1")).toBe(true);
    expect(isPrivateIpv6("fd12:3456::1")).toBe(true);
    expect(isPrivateIpv6("fe80::1")).toBe(true);
  });

  it("unwraps IPv4-mapped addresses", () => {
    expect(isPrivateIpv6("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIpv6("::ffff:8.8.8.8")).toBe(false);
  });

  it("allows public addresses", () => {
    expect(isPrivateIpv6("2606:4700:4700::1111")).toBe(false);
  });
});

describe("isPrivateAddress", () => {
  it("dispatches on address family", () => {
    expect(isPrivateAddress("192.168.1.1")).toBe(true);
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });
});
