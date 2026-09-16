import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const { field, value } = body as { field: string; value: boolean };
  const allowed = ["isActive","alertOn1","alertOn2","alertOn3","alertOn4","alertOn5"];
  if (!allowed.includes(field)) return Response.json({ error: "Invalid field" }, { status: 400 });
  const cfg = await prisma.telegramConfig.findFirst({ where: { userId: user.id } });
  if (!cfg) return Response.json({ error: "No config" }, { status: 404 });
  const updated = await prisma.telegramConfig.update({ where: { id: cfg.id }, data: { [field]: !!value } });
  return Response.json({ ok: true, config: { [field]: (updated as any)[field] } });
}
