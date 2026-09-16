import { getCurrentUser } from "@/lib/auth";
import { syncAllPerformanceForUser, syncPerformanceForLocation } from "@/lib/performance-sync";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const { locationId, preset, start, end } = body as { locationId?: string; preset?: string; start?: string; end?: string };
  const p = preset || "30d";
  try {
    if (locationId) {
      const r = await syncPerformanceForLocation(locationId, user.id, p, start && end ? { start, end } : undefined);
      return Response.json({ ok: true, ...r });
    }
    const results = await syncAllPerformanceForUser(user.id, p);
    return Response.json({ ok: true, results, count: results.length });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
