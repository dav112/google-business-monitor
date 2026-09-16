import { getCurrentUser, invalidateAllSessions, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await invalidateAllSessions(user.id);
  await clearAuthCookie();
  await prisma.activityLog.create({ data: { userId: user.id, type: "logout_all", status: "success", message: "Logout all devices" } });
  return Response.json({ ok: true });
}
