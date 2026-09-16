import { prisma } from "@/lib/db";
import { syncAllReviewsForUser } from "@/lib/review-sync";
import { syncAllPerformanceForUser } from "@/lib/performance-sync";

// Fallback polling — safe 15min interval, not aggressive
// Call via cron: GET /api/cron/sync?token=CRON_SECRET  OR  POST without auth in dev

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    if (url.searchParams.get("token") !== secret && req.headers.get("x-cron-token") !== secret) {
      return Response.json({ error: "Unauthorized cron" }, { status: 401 });
    }
  }

  // Find users with monitored locations that haven't synced in last 14 minutes (avoid aggressive)
  const cutoff = new Date(Date.now() - 14 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: { locations: { some: { isMonitored: true, OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: cutoff } }] } } },
    select: { id: true, email: true },
  });

  const results: any[] = [];
  for (const u of users) {
    try {
      const reviews = await syncAllReviewsForUser(u.id);
      // performance is heavier: only sync if no metrics in last 1h
      const hasRecentPerf = await prisma.performanceMetric.findFirst({ where: { location: { userId: u.id }, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
      let perf = null;
      if (!hasRecentPerf) perf = await syncAllPerformanceForUser(u.id, "7d");
      results.push({ userId: u.id, reviews, perf });
    } catch (e: any) {
      results.push({ userId: u.id, error: e.message });
    }
  }

  if (results.length === 0) return Response.json({ ok: true, message: "No users need sync (recent sync <14m)" });
  return Response.json({ ok: true, results });
}

export async function POST(req: Request) {
  return GET(req);
}
