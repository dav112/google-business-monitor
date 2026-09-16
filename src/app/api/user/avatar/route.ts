import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  posX: z.number().min(0).max(100),
  posY: z.number().min(0).max(100),
  zoom: z.number().min(0.5).max(3),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ avatar: user.avatar, posX: user.avatarPosX, posY: user.avatarPosY, zoom: user.avatarZoom, name: user.name });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid" }, { status: 400 }); }
  if (body.avatar) {
    // update avatar image
    if (!body.avatar.startsWith("data:image/")) return Response.json({ error: "Foto harus data:image" }, { status: 400 });
    if (body.avatar.length > 5000000) return Response.json({ error: "Foto terlalu besar (max 5MB)" }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { avatar: body.avatar } });
  }
  if (body.posX !== undefined || body.posY !== undefined || body.zoom !== undefined) {
    const parsed = schema.safeParse({ posX: body.posX ?? user.avatarPosX, posY: body.posY ?? user.avatarPosY, zoom: body.zoom ?? user.avatarZoom });
    if (!parsed.success) return Response.json({ error: "Posisi tidak valid" }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { avatarPosX: parsed.data.posX, avatarPosY: parsed.data.posY, avatarZoom: parsed.data.zoom } });
  }
  const updated = await prisma.user.findUnique({ where: { id: user.id } });
  return Response.json({ ok: true, posX: updated?.avatarPosX, posY: updated?.avatarPosY, zoom: updated?.avatarZoom });
}
