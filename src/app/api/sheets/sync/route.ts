import { getCurrentUser } from "@/lib/auth";
import { syncSheetsForUser } from "@/lib/sheets";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await syncSheetsForUser(user.id);
    return Response.json({ ok: true, ...r });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
