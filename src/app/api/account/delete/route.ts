import { getCurrentUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ confirm: z.literal("DELETE"), password: z.string().min(1) });
import { verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid input" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Type DELETE and provide password" }, { status: 400 });
  const ok = await verifyPassword(parsed.data.password, user.password);
  if (!ok) return Response.json({ error: "Invalid password" }, { status: 401 });

  // Revoke: delete all credentials and data per ownership
  await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
  await prisma.telegramConfig.deleteMany({ where: { userId: user.id } });
  await prisma.googleSheet.deleteMany({ where: { userId: user.id } });
  // Keep activity logs? delete user cascades via locations etc, but keep audit for 30d? For now cascade delete via user delete
  await prisma.user.delete({ where: { id: user.id } });
  await clearAuthCookie();
  // Note: cannot log after delete, but log before? Already deleted. Use console for audit.
  console.log(`[ACCOUNT DELETE] ${user.email} deleted`);
  return Response.json({ ok: true });
}
