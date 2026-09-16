import { getCurrentUser } from "@/lib/auth";
import { testTelegram } from "@/lib/telegram";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await testTelegram(user.id);
    return Response.json({ ok: true, ...r });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
