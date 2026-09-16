import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");
  const start = url.searchParams.get("start"); // YYYY-MM-DD
  const end = url.searchParams.get("end");
  const preset = url.searchParams.get("preset") || "30d";

  let startDate: Date, endDate: Date;
  if (start && end) { startDate = new Date(start); endDate = new Date(end); }
  else {
    endDate = new Date();
    startDate = new Date();
    if (preset === "today") {/* same */}
    else if (preset === "7d") startDate.setDate(endDate.getDate() - 6);
    else if (preset === "30d") startDate.setDate(endDate.getDate() - 29);
    else if (preset === "90d") startDate.setDate(endDate.getDate() - 89);
    else startDate.setDate(endDate.getDate() - 29);
  }

  const where: any = { location: { userId: user.id }, date: { gte: startDate, lte: endDate } };
  if (locationId) where.locationId = locationId;

  const [metrics, reviewStats] = await Promise.all([
    prisma.performanceMetric.findMany({ where, orderBy: { date: "asc" }, include: { location: true } }),
    prisma.review.groupBy({ by: ["rating"], where: { location: { userId: user.id }, ...(locationId ? { locationId } : {}), createTime: { gte: startDate, lte: endDate } }, _count: true, _avg: { rating: true } }),
  ]);

  // aggregate per date across locations
  const byDate: Record<string, any> = {};
  for (const m of metrics) {
    const k = m.date.toISOString().slice(0, 10);
    if (!byDate[k]) byDate[k] = { date: k, mapsViews: 0, searchViews: 0, websiteClicks: 0, phoneCalls: 0, directionRequests: 0 };
    byDate[k].mapsViews += m.mapsViews;
    byDate[k].searchViews += m.searchViews;
    byDate[k].websiteClicks += m.websiteClicks;
    byDate[k].phoneCalls += m.phoneCalls;
    byDate[k].directionRequests += m.directionRequests;
  }
  const chart = Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));

  const total = chart.reduce((acc: any, cur: any) => ({
    mapsViews: acc.mapsViews + cur.mapsViews,
    searchViews: acc.searchViews + cur.searchViews,
    websiteClicks: acc.websiteClicks + cur.websiteClicks,
    phoneCalls: acc.phoneCalls + cur.phoneCalls,
    directionRequests: acc.directionRequests + cur.directionRequests,
  }), { mapsViews: 0, searchViews: 0, websiteClicks: 0, phoneCalls: 0, directionRequests: 0 });

  const reviewCount = (reviewStats as any[]).reduce((a, r) => a + r._count, 0);
  const avgRating = reviewCount ? ((reviewStats as any[]).reduce((a, r) => a + (r._avg.rating || 0) * r._count, 0) / reviewCount) : 0;

  return Response.json({ chart, total, reviewCount, avgRating, start: startDate.toISOString().slice(0,10), end: endDate.toISOString().slice(0,10) });
}
