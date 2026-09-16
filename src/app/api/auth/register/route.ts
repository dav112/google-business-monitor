import { prisma } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2).max(100), email: z.string().email().max(200), password: z.string().min(6).max(128), avatar: z.string().min(10).max(5000000) });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (process.env.NODE_ENV === "production") {
    const rl = rateLimit(`register:${ip}`, 20, 60 * 60 * 1000);
    if (!rl.ok) return Response.json({ error: "Too many registrations. Try later." }, { status: 429 });
  }
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid input" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: `${first.path.join(".")}: ${first.message}` }, { status: 400 });
  }
  const { name, email, password, avatar } = parsed.data;
  if (!avatar.startsWith("data:image/")) return Response.json({ error: "Foto profil wajib (upload gambar)" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: "Email already registered" }, { status: 409 });
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, password: hashed, avatar } });
  await prisma.activityLog.create({ data: { userId: user.id, type: "user_registered", status: "success", message: `User ${email} registered` } });
  // ponytail: auto rekap ke master sheet 15DamH... (baru + yang sudah terdaftar) — fire-and-forget, jangan blokir register
  try {
    const { syncMasterUserSheet } = await import("@/lib/sheets");
    void syncMasterUserSheet(user.id).catch(() => {});
  } catch {}
  const token = await signToken({ userId: user.id, email: user.email, role: (user as any).role || "USER" });
  await setAuthCookie(token);
  return Response.json({ ok: true });
}
