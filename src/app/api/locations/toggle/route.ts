import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { locationId, isMonitored } = await req.json();
  if (!locationId) return Response.json({ error: "locationId required" }, { status: 400 });
  const loc = await prisma.location.findFirst({ where: { id: locationId, userId: user.id } });
  if (!loc) return Response.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.location.update({ where: { id: loc.id }, data: { isMonitored: !!isMonitored } });
  await prisma.activityLog.create({ data: { userId: user.id, locationId: loc.id, type: isMonitored ? "location_monitoring_enabled" : "location_monitoring_disabled", status: "success", message: `${loc.title} ${isMonitored ? "enabled" : "disabled"}` } });
  return Response.json({ ok: true, location: updated });
}
