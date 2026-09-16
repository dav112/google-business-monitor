import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractSpreadsheetId } from "@/lib/sheets";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(()=>({}));
  const url = (body.spreadsheetUrl || body.url || "").toString();
  const id = extractSpreadsheetId(url);
  if (!id) return Response.json({ error: "Invalid Spreadsheet URL. Contoh: https://docs.google.com/spreadsheets/d/XXXXX" }, { status: 400 });

  const existing = await prisma.googleSheet.findFirst({ where: { userId: user.id, spreadsheetId: id } });
  if (existing) {
    const upd = await prisma.googleSheet.update({ where: { id: existing.id }, data: { spreadsheetUrl: url, isActive: true, status: "connected", errorMessage: null } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "sheets_connected", status: "success", message: `Sheets re-connected ${id}` } });
    return Response.json({ ok: true, sheet: upd });
  }
  const sheet = await prisma.googleSheet.create({ data: { userId: user.id, spreadsheetId: id, spreadsheetUrl: url, isActive: true, status: "connected" } });
  await prisma.activityLog.create({ data: { userId: user.id, type: "sheets_connected", status: "success", message: `Sheets connected ${id}` } });
  return Response.json({ ok: true, sheet });
}
