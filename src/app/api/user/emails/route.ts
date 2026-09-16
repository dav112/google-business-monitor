import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const emails = await prisma.userEmail.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  // include current active email as well if not in history yet
  const hasActive = emails.some((e) => e.email === user.email && e.isActive);
  let list = emails;
  if (!hasActive) {
    // show current as active virtual
    list = [{ id: "current", userId: user.id, email: user.email, isActive: true, createdAt: user.createdAt } as any, ...emails];
  }
  return Response.json({ emails: list, active: user.email });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action, email, id } = body as { action?: "activate" | "delete"; email?: string; id?: string };
  // invite flow: { email } without action -> create pending entry
  if (!action && email) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) return Response.json({ error: "Email tidak valid" }, { status: 400 });
    const exists = await prisma.userEmail.findFirst({ where: { userId: user.id, email: trimmed } });
    if (exists) return Response.json({ error: "Email sudah diundang" }, { status: 409 });
    const created = await prisma.userEmail.create({ data: { userId: user.id, email: trimmed, isActive: false } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "team_invited", status: "success", message: `Invite ${trimmed}` } });
    return Response.json({ ok: true, email: created });
  }

  if (action === "activate" && email) {
    const target = await prisma.userEmail.findFirst({ where: { userId: user.id, email } });
    if (!target) return Response.json({ error: "Email tidak ditemukan di histori" }, { status: 404 });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists && exists.id !== user.id) return Response.json({ error: "Email sudah dipakai user lain" }, { status: 409 });
    // deactivate all
    await prisma.userEmail.updateMany({ where: { userId: user.id }, data: { isActive: false } });
    await prisma.userEmail.update({ where: { id: target.id }, data: { isActive: true } });
    await prisma.user.update({ where: { id: user.id }, data: { email } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "email_activated", status: "success", message: `Email aktif: ${email}` } });
    return Response.json({ ok: true, active: email });
  }

  if (action === "delete" && (email || id)) {
    const where: any = { userId: user.id };
    if (id) where.id = id;
    else where.email = email;
    const target = await prisma.userEmail.findFirst({ where });
    if (!target) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
    if (target.isActive) return Response.json({ error: "Tidak bisa hapus email aktif. Aktifkan yang lain dulu." }, { status: 400 });
    await prisma.userEmail.delete({ where: { id: target.id } });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || id === "current") return Response.json({ error: "Invalid id" }, { status: 400 });
  const target = await prisma.userEmail.findFirst({ where: { id, userId: user.id } });
  if (!target) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (target.isActive) return Response.json({ error: "Tidak bisa hapus email aktif" }, { status: 400 });
  await prisma.userEmail.delete({ where: { id } });
  return Response.json({ ok: true });
}
