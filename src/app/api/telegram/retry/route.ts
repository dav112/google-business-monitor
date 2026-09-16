import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTelegramMessage, formatReviewAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const id = body.notificationId as string;
  if (!id) return Response.json({ error: "notificationId required" }, { status: 400 });
  const n = await prisma.notification.findFirst({ where: { id, review: { location: { userId: user.id } } }, include: { review: { include: { location: true } } } });
  if (!n) return Response.json({ error: "Not found" }, { status: 404 });
  const cfg = await prisma.telegramConfig.findFirst({ where: { userId: user.id } });
  if (!cfg) return Response.json({ error: "No telegram config" }, { status: 400 });
  const r = n.review;
  const d = r.createTime || r.createdAt;
  const text = formatReviewAlert({ location: r.location.title, rating: r.rating, reviewer: r.reviewerName || "Anonymous", comment: r.comment || "-", date: d.toLocaleDateString("id-ID"), time: d.toLocaleTimeString("id-ID"), link: `https://www.google.com/maps/place/?q=place_id:${r.location.placeId || r.location.name}` });
  const { decryptIfNeeded } = await import("@/lib/crypto");
  const token = decryptIfNeeded(cfg.botToken);
  const chat = decryptIfNeeded(cfg.chatId);
  try {
    await sendTelegramMessage(token, chat, text);
    await prisma.notification.update({ where: { id: n.id }, data: { status: "sent", sentAt: new Date(), error: null } });
    return Response.json({ ok: true });
  } catch (e: any) {
    await prisma.notification.update({ where: { id: n.id }, data: { status: "failed", error: e.message } });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
