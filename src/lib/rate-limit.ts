// Simple in-memory rate limit — ponytail: no redis, per-instance window
// Not for distributed, sufficient for single-instance dev + small prod; upgrade to redis when needed

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const e = store.get(key);
  if (!e || now > e.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (e.count >= limit) return { ok: false, remaining: 0, resetAt: e.resetAt };
  e.count++;
  return { ok: true, remaining: limit - e.count, resetAt: e.resetAt };
}

// cleanup every 10m
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) if (now > v.resetAt) store.delete(k);
  }, 10 * 60 * 1000).unref?.();
}

export function getClientIp(req: Request): string {
  const fwd = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}
