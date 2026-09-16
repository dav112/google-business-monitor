import { prisma } from "./db";
import { fetchPerformanceMetrics, getValidAccessToken } from "./google";

function rangeForPreset(preset: string, custom?: { start: string; end: string }): { startDate: string; endDate: string } {
  if (preset === "custom" && custom) return { startDate: custom.start, endDate: custom.end };
  const end = new Date();
  let start = new Date();
  if (preset === "today") start = new Date();
  else if (preset === "7d") start.setDate(end.getDate() - 6);
  else if (preset === "30d") start.setDate(end.getDate() - 29);
  else if (preset === "90d") start.setDate(end.getDate() - 89);
  else start.setDate(end.getDate() - 29);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

export async function syncPerformanceForLocation(locationId: string, userId: string, preset = "30d", custom?: { start: string; end: string }) {
  const loc = await prisma.location.findFirst({ where: { id: locationId, userId }, include: { businessAccount: { include: { googleAccount: true } } } });
  if (!loc) throw new Error("Location not found");
  if (!loc.businessAccount?.googleAccount) throw new Error("No Google account");

  const ga = loc.businessAccount.googleAccount;
  const token = await getValidAccessToken(ga as any);
  const range = rangeForPreset(preset, custom);
  const metrics = await fetchPerformanceMetrics(token, loc.name, range);

  if (token !== ga.accessToken) await prisma.googleAccount.update({ where: { id: ga.id }, data: { accessToken: token, expiryDate: new Date(Date.now() + 3600 * 1000) } });

  for (const m of metrics) {
    await prisma.performanceMetric.upsert({
      where: { locationId_date: { locationId: loc.id, date: new Date(m.date) } },
      update: { mapsViews: m.mapsViews, searchViews: m.searchViews, websiteClicks: m.websiteClicks, phoneCalls: m.phoneCalls, directionRequests: m.directionRequests, raw: m.raw as any },
      create: { locationId: loc.id, date: new Date(m.date), mapsViews: m.mapsViews, searchViews: m.searchViews, websiteClicks: m.websiteClicks, phoneCalls: m.phoneCalls, directionRequests: m.directionRequests, raw: m.raw as any },
    });
  }

  await prisma.activityLog.create({ data: { userId, locationId: loc.id, type: "performance_synchronized", status: "success", message: `Performance ${range.startDate}→${range.endDate} (${metrics.length} days)` } });
  await prisma.location.update({ where: { id: loc.id }, data: { lastSyncedAt: new Date() } });
  return { count: metrics.length, range };
}

export async function syncAllPerformanceForUser(userId: string, preset = "30d") {
  const locs = await prisma.location.findMany({ where: { userId, isMonitored: true } });
  const results = [];
  for (const l of locs) {
    try {
      const r = await syncPerformanceForLocation(l.id, userId, preset);
      results.push({ locationId: l.id, ...r });
    } catch (e: any) {
      results.push({ locationId: l.id, error: e.message });
    }
  }
  return results;
}
