import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
async function handle(req: Request){
  const url = new URL(req.url);
  const cronSecret = req.headers.get("x-cron-secret") || url.searchParams.get("token");
  const isCron = (cronSecret && process.env.CRON_SECRET && cronSecret===process.env.CRON_SECRET) || req.headers.get("x-vercel-cron")==="1";
  let user = await getCurrentUser();
  if (isCron) {
    if (!user) user = await prisma.user.findFirst({orderBy:{createdAt:"asc"}});
    if (!user) return Response.json({error:"No users for cron"},{status:500});
  } else {
    if (!user) return Response.json({error:"Unauthorized"},{status:401});
    if (!isAdminUser(user)) return Response.json({error:"Forbidden — admin only"},{status:403});
  }
  // Apps Script may send POST without auth but with cron secret — allow
  try {
    const { pullUsersFromMasterSheet } = await import("@/lib/sheets");
    const r = await pullUsersFromMasterSheet(user.id);
    return Response.json({ok:true, ...r});
  } catch(e:any){
    return Response.json({error:e.message},{status:500});
  }
}
export async function GET(req:Request){ return handle(req); }
export async function POST(req:Request){ return handle(req); }
