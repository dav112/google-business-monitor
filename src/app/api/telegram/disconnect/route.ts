import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.telegramConfig.deleteMany({ where: { userId: user.id } });
  await prisma.activityLog.create({ data: { userId: user.id, type: "telegram_disconnected", status: "success", message: "Telegram disconnected" } });
  return Response.json({ ok: true });
}
