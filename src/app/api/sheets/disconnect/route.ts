import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const id = body.id || body.spreadsheetId;
  if (id) {
    const s = await prisma.googleSheet.findFirst({ where: { id, userId: user.id } });
    if (s) await prisma.googleSheet.delete({ where: { id: s.id } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "sheets_disconnected", status: "success", message: `Sheets ${id} disconnected` } });
  } else {
    await prisma.googleSheet.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "sheets_disconnected", status: "success", message: "All sheets disconnected" } });
  }
  return Response.json({ ok: true });
}
