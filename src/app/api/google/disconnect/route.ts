import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const id = body.googleAccountId as string | undefined;
  const revoke = async (token: string) => {
    try { await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }); } catch {}
  };
  const { decryptIfNeeded } = await import("@/lib/crypto");
  if (id) {
    const ga = await prisma.googleAccount.findFirst({ where: { id, userId: user.id } });
    if (!ga) return Response.json({ error: "Not found" }, { status: 404 });
    try { await revoke(decryptIfNeeded(ga.refreshToken)); } catch {}
    await prisma.googleAccount.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_disconnected", status: "success", message: `Google ${ga.email} disconnected & revoked` } });
  } else {
    const all = await prisma.googleAccount.findMany({ where: { userId: user.id } });
    for (const ga of all) try { await revoke(decryptIfNeeded(ga.refreshToken)); } catch {}
    await prisma.googleAccount.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_disconnected", status: "success", message: "All Google accounts disconnected & revoked" } });
  }
  return Response.json({ ok: true });
}
