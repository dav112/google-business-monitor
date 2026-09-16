import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";
import { z } from "zod";
const schema = z.object({ token: z.string().min(10), password: z.string().min(6).max(128) });
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (process.env.NODE_ENV === "production") {
    const rl = rateLimit(`reset:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid input" }, { status: 400 }); }
  const p = schema.safeParse(body);
  if (!p.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const hash = crypto.createHash("sha256").update(p.data.token).digest("hex");
  let user = await prisma.user.findFirst({ where: { resetToken: hash } });
  // fallback plaintext for old tokens (migration)
  if (!user) user = await prisma.user.findFirst({ where: { resetToken: p.data.token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) return Response.json({ error: "Token invalid or expired" }, { status: 400 });
  const hashed = await hashPassword(p.data.password);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetTokenExpiry: null, sessionInvalidBefore: new Date() } });
  await prisma.activityLog.create({ data: { userId: user.id, type: "password_reset", status: "success", message: "Password reset" } });
  return Response.json({ ok: true });
}
