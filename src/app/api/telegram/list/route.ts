import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const cfgs = await prisma.telegramConfig.findMany({ where: { userId: user.id } });
  // never expose token (decrypt only to mask)
  const { decryptIfNeeded } = await import("@/lib/crypto");
  const safe = cfgs.map(c => {
    const chat = decryptIfNeeded(c.chatId);
    const tok = decryptIfNeeded(c.botToken);
    return {
      id: c.id, chatId: chat, isActive: c.isActive,
      alertOn1: c.alertOn1, alertOn2: c.alertOn2, alertOn3: c.alertOn3, alertOn4: c.alertOn4, alertOn5: c.alertOn5,
      hasToken: !!c.botToken,
      tokenMasked: tok ? `${tok.slice(0,6)}...${tok.slice(-4)}` : null,
    };
  });
  const recent = await prisma.notification.findMany({ where: { review: { location: { userId: user.id } } }, orderBy: { createdAt: "desc" }, take: 10, include: { review: { include: { location: true } } } });
  return Response.json({ configs: safe, recent });
}
