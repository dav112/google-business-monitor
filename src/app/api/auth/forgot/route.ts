import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import crypto from "crypto";
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (process.env.NODE_ENV === "production") {
    const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid email" }, { status: 400 }); }
  const p = schema.safeParse(body);
  if (!p.success) return Response.json({ error: "Invalid email" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: p.data.email } });
  if (!user) return Response.json({ message: "If email exists, reset link will be sent." });
  const raw = crypto.randomBytes(32).toString("hex");
  // Store hash of token for better security (if DB leaked)
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: hash, resetTokenExpiry: new Date(Date.now() + 1000*60*30) } });
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${raw}`;
  console.log(`[RESET] ${user.email} -> token hash stored`);
  // Only expose raw in dev, not prod
  if (process.env.NODE_ENV !== "production") return Response.json({ message: `Reset link (dev): ${url}` });
  return Response.json({ message: "If email exists, reset link will be sent." });
}
