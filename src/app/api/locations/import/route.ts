import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  businessAccountId: z.string().min(1),
  locations: z.array(z.object({
    name: z.string(), // accounts/xxx/locations/yyy
    title: z.string(),
    address: z.string().optional(),
  }))
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const ba = await prisma.businessAccount.findFirst({ where: { id: parsed.data.businessAccountId, googleAccount: { userId: user.id } } });
  if (!ba) return Response.json({ error: "Business account not yours" }, { status: 404 });

  let imported = 0;
  for (const loc of parsed.data.locations) {
    // name is Google resource name, must be unique per user scope but schema has id cuid; we enforce uniqueness via (userId + name) check manually
    const existing = await prisma.location.findFirst({ where: { userId: user.id, name: loc.name } });
    if (existing) {
      await prisma.location.update({ where: { id: existing.id }, data: { title: loc.title, address: loc.address, businessAccountId: ba.id, isMonitored: true } });
    } else {
      await prisma.location.create({ data: { userId: user.id, businessAccountId: ba.id, name: loc.name, title: loc.title, address: loc.address, isMonitored: true } });
      imported++;
    }
    await prisma.activityLog.create({ data: { userId: user.id, locationId: existing?.id, type: "location_added", status: "success", message: `Location ${loc.title} monitoring enabled` } });
  }
  return Response.json({ ok: true, imported, total: parsed.data.locations.length });
}
