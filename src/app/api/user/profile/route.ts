import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(200).optional(),
  avatar: z.string().min(10).max(5000000).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(128).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, avatarPosX: user.avatarPosX, avatarPosY: user.avatarPosY, avatarZoom: user.avatarZoom } });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const data: any = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.email && parsed.data.email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists && exists.id !== user.id) return Response.json({ error: "Email sudah dipakai" }, { status: 409 });
    // simpan email lama ke histori nonaktif
    await prisma.userEmail.upsert({
      where: { userId_email: { userId: user.id, email: user.email } },
      update: { isActive: false },
      create: { userId: user.id, email: user.email, isActive: false },
    });
    await prisma.userEmail.upsert({
      where: { userId_email: { userId: user.id, email: parsed.data.email } },
      update: { isActive: true },
      create: { userId: user.id, email: parsed.data.email, isActive: true },
    });
    // nonaktifkan email histori lain
    await prisma.userEmail.updateMany({ where: { userId: user.id, email: { not: parsed.data.email } }, data: { isActive: false } });
    data.email = parsed.data.email;
  }
  if (parsed.data.avatar) {
    if (!parsed.data.avatar.startsWith("data:image/")) return Response.json({ error: "Foto harus gambar" }, { status: 400 });
    data.avatar = parsed.data.avatar;
  }
  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) return Response.json({ error: "Password lama wajib" }, { status: 400 });
    const ok = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!ok) return Response.json({ error: "Password lama salah" }, { status: 401 });
    data.password = await hashPassword(parsed.data.newPassword);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  await prisma.activityLog.create({ data: { userId: user.id, type: "profile_updated", status: "success", message: "Profile updated" } });
  return Response.json({ ok: true, user: { id: updated.id, name: updated.name, email: updated.email, avatar: updated.avatar } });
}
