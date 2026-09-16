import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function handleSync(req: Request) {
  const url = new URL(req.url);
  const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("x-cron-token") || url.searchParams.get("cron_secret") || url.searchParams.get("token") || url.searchParams.get("cronToken");
  const cronSecretEnv = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isCron = (cronSecret && cronSecretEnv && cronSecret === cronSecretEnv) || isVercelCron || (!cronSecret && !cronSecretEnv);
  let user = await getCurrentUser();
  if (isCron) {
    if (!user) user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user) return Response.json({ error: "No users for cron" }, { status: 500 });
  } else {
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminUser(user)) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  try {
    const { syncMasterUserSheet, MASTER_SHEET_ID, MASTER_SHEET_URL } = await import("@/lib/sheets");
    const result = await syncMasterUserSheet(user.id);
    if ((result as any).mock) return Response.json({ ...result, sheetId: MASTER_SHEET_ID, sheetUrl: MASTER_SHEET_URL, message: "Mock mode — GOOGLE_CLIENT_ID kosong atau belum Connect Google. Share sheet 15DamH... ke email Google yang Connect sebagai Editor lalu Sync lagi untuk real API." });
    return Response.json(result);
  } catch (e:any) {
    const { MASTER_SHEET_ID } = await import("@/lib/sheets");
    return Response.json({ error: e.message, sheetId: MASTER_SHEET_ID }, { status: 500 });
  }
}
export async function POST(req: Request){ return handleSync(req); }
export async function GET(req: Request){ return handleSync(req); }
