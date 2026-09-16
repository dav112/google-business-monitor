import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ botToken: z.string().min(10), chatId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const { botToken, chatId } = parsed.data;
  const { encrypt } = await import("@/lib/crypto");

  const existing = await prisma.telegramConfig.findFirst({ where: { userId: user.id } });
  let cfg;
  if (existing) {
    cfg = await prisma.telegramConfig.update({ where: { id: existing.id }, data: { botToken: encrypt(botToken), chatId: encrypt(chatId), isActive: true } });
  } else {
    cfg = await prisma.telegramConfig.create({ data: { userId: user.id, botToken: encrypt(botToken), chatId: encrypt(chatId) } });
  }
  await prisma.activityLog.create({ data: { userId: user.id, type: "telegram_connected", status: "success", message: `Telegram config chat ${chatId}` } });
  return Response.json({ ok: true, config: { id: cfg.id, chatId: cfg.chatId, isActive: cfg.isActive } });
}
