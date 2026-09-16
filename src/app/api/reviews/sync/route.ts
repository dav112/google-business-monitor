import { getCurrentUser } from "@/lib/auth";
import { syncAllReviewsForUser, syncReviewsForLocation } from "@/lib/review-sync";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const locationId = body.locationId as string | undefined;

  try {
    if (locationId) {
      const r = await syncReviewsForLocation(locationId, user.id);
      return Response.json({ ok: true, ...r });
    }
    const results = await syncAllReviewsForUser(user.id);
    const totalNew = results.reduce((a, r: any) => a + (r.newCount || 0), 0);
    return Response.json({ ok: true, results, totalNew, count: results.length });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
export async function GET(req: Request) {
  // also allow GET for simple trigger via link
  return POST(req);
}
