import { prisma } from "@/lib/db";
import { decodePubSubData, extractLocationFromNotification } from "@/lib/pubsub";
import { syncReviewsForLocation } from "@/lib/review-sync";
import { syncSheetsForUser } from "@/lib/sheets";

export async function POST(req: Request) {
  // Pub/Sub push has no auth cookie; verify via query token or header if configured
  const url = new URL(req.url);
  const verify = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
  if (verify) {
    const got = url.searchParams.get("token") || req.headers.get("x-pubsub-token");
    if (got !== verify) return Response.json({ error: "Invalid verification token" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle Pub/Sub push format OR direct test { locationName: "accounts/.../locations/..." }
  let locationName: string | null = null;
  let rawPayload: any = null;

  if (body.message?.data) {
    rawPayload = decodePubSubData(body.message.data);
    locationName = extractLocationFromNotification(rawPayload) || extractLocationFromNotification(body.message.attributes || {});
    // fallback: if data is plain location string
    if (!locationName && typeof rawPayload === "string" && rawPayload.includes("/locations/")) locationName = rawPayload;
  } else if (body.locationName) {
    locationName = body.locationName;
    rawPayload = body;
  } else if (body.location) {
    locationName = body.location;
    rawPayload = body;
  } else {
    // Try direct
    locationName = extractLocationFromNotification(body);
    rawPayload = body;
  }

  if (!locationName) {
    console.warn("[pubsub] no locationName found", JSON.stringify(body).slice(0, 500));
    // Still ack to avoid retry loop, but log activity as failed
    // We don't have user context, so just return 200 with warning
    return Response.json({ ok: true, warning: "No locationName extracted, acked anyway", received: body });
  }

  // Find location(s) matching name (across all users - but multi-tenant: only owner's location)
  let locations: any[] = await prisma.location.findMany({ where: { name: locationName } });
  if (locations.length === 0) {
    console.warn(`[pubsub] location not found: ${locationName}`);
    // Try fuzzy: find by suffix
    const suffix = locationName.split("/").pop();
    const alt = await prisma.location.findMany({ where: { name: { contains: suffix! } } });
    if (alt.length === 0) return Response.json({ ok: true, warning: `Location ${locationName} not monitored, acked` });
    locationName = alt[0].name;
    locations = [alt[0]];
  }

  const results: any[] = [];
  for (const loc of locations) {
    try {
      const r = await syncReviewsForLocation(loc.id, loc.userId);
      results.push({ locationId: loc.id, locationName: loc.name, ...r });
      // Auto Sheets sync if user has active sheet (non-blocking best effort)
      try {
        const hasSheet = await prisma.googleSheet.findFirst({ where: { userId: loc.userId, isActive: true } });
        if (hasSheet) await syncSheetsForUser(loc.userId);
      } catch (e: any) {
        console.warn("[pubsub] sheets after sync failed:", e.message);
      }
      await prisma.activityLog.create({ data: { userId: loc.userId, locationId: loc.id, type: "pubsub_notification_processed", status: "success", message: `Pub/Sub ${locationName} → ${r.newCount} new reviews` } });
    } catch (e: any) {
      results.push({ locationId: loc.id, error: e.message });
      await prisma.activityLog.create({ data: { userId: loc.userId, locationId: loc.id, type: "pubsub_notification_failed", status: "failed", message: e.message } });
    }
  }

  // Always return 200 to ack Pub/Sub (retry would duplicate)
  return Response.json({ ok: true, locationName, results, rawPayload });
}

// Allow GET for health check / manual test
export async function GET() {
  return Response.json({ ok: true, message: "Pub/Sub webhook ready. POST Pub/Sub push JSON or { locationName }." });
}
