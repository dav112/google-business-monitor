import { prisma } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (process.env.NODE_ENV === "production") {
    const rl = rateLimit(`login:${ip}`, 20, 5 * 60 * 1000);
    if (!rl.ok) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } });
  }
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid input" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.activityLog.create({ data: { userId: "unknown", type: "login_failed", status: "failed", message: `Login failed for ${email} (no user)` } }).catch(()=>{});
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if ((user as any).status === "suspended") {
    await prisma.activityLog.create({ data: { userId: user.id, type: "login_failed", status: "failed", message: `Login ditolak — akun ${email} sedang ditangguhkan` } }).catch(()=>{});
    return Response.json({ error: "Akun Anda sedang ditangguhkan oleh admin. Hubungi developer untuk aktivasi kembali.", code: "SUSPENDED" }, { status: 403 });
  }
  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    await prisma.activityLog.create({ data: { userId: user.id, type: "login_failed", status: "failed", message: `Login failed for ${email}` } });
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await signToken({ userId: user.id, email: user.email, role: (user as any).role || "USER" });
  await setAuthCookie(token);
  await prisma.activityLog.create({ data: { userId: user.id, type: "user_login", status: "success", message: `User ${email} logged in` } });
  return Response.json({ ok: true });
}
