import { getCurrentUser } from "@/lib/auth";
import { syncReviewsForLocation, syncAllReviewsForUser } from "@/lib/review-sync";
import { syncPerformanceForLocation, syncAllPerformanceForUser } from "@/lib/performance-sync";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { locationId, withPerformance } = await req.json().catch(()=>({} as any));
  if (locationId) {
    const loc = await prisma.location.findFirst({ where: { id: locationId, userId: user.id } });
    if (!loc) return Response.json({ error: "Not found" }, { status: 404 });
    try {
      const r = await syncReviewsForLocation(locationId, user.id);
      let perf = null;
      if (withPerformance) perf = await syncPerformanceForLocation(locationId, user.id, "30d");
      return Response.json({ ok: true, ...r, performance: perf });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }
  // sync all monitored → reviews + optional performance
  const results = await syncAllReviewsForUser(user.id);
  if (withPerformance) await syncAllPerformanceForUser(user.id, "30d");
  return Response.json({ ok: true, results, count: results.length });
}
