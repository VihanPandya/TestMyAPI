/**
 * Guards the proxy against Server-Side Request Forgery.
 *
 * The proxy forwards arbitrary user-supplied URLs from the server, so without
 * a guard a deployed instance could be coerced into reaching internal services
 * (cloud metadata endpoints, databases on the private network, etc.). We reject
 * non-http(s) schemes and any hostname that resolves to a private, loopback,
 * link-local or otherwise non-public address.
 */

/** Validate the scheme and shape of a URL before we attempt to resolve it. */
export function validateUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "Invalid URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: `Unsupported protocol "${url.protocol}". Use http or https.` };
  }

  if (!url.hostname) {
    return { ok: false, reason: "URL is missing a hostname." };
  }

  return { ok: true, url };
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    value = value * 256 + n;
  }
  return value >>> 0;
}

function inRange(ip: number, cidrBase: string, bits: number): boolean {
  const base = ipv4ToInt(cidrBase);
  if (base === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (base & mask);
}

/** True for IPv4 addresses that are not safe to reach from a public proxy. */
export function isPrivateIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return false;

  return (
    inRange(value, "0.0.0.0", 8) || // "this" network
    inRange(value, "10.0.0.0", 8) || // RFC1918 private
    inRange(value, "100.64.0.0", 10) || // carrier-grade NAT
    inRange(value, "127.0.0.0", 8) || // loopback
    inRange(value, "169.254.0.0", 16) || // link-local (incl. cloud metadata)
    inRange(value, "172.16.0.0", 12) || // RFC1918 private
    inRange(value, "192.0.0.0", 24) || // IETF protocol assignments
    inRange(value, "192.168.0.0", 16) || // RFC1918 private
    inRange(value, "198.18.0.0", 15) || // benchmarking
    inRange(value, "224.0.0.0", 4) || // multicast
    inRange(value, "240.0.0.0", 4) // reserved / broadcast
  );
}

/** True for IPv6 addresses that are not safe to reach from a public proxy. */
export function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // strip zone id

  if (addr === "::1" || addr === "::") return true; // loopback / unspecified

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible addresses.
  const mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  const first = parseInt(addr.split(":")[0] || "0", 16);
  if (Number.isNaN(first)) return false;

  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local

  return false;
}

export function isPrivateAddress(ip: string): boolean {
  return ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip);
}
