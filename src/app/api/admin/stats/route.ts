import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export async function GET(){
  const { error, status } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const now = Date.now();
  const users = await prisma.user.findMany({select:{status:true,role:true,lastActiveAt:true}});
  const total = users.length;
  const suspended = users.filter(u=>u.status==="suspended").length;
  const active = total - suspended;
  const online = users.filter(u=> u.status!=="suspended" && u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime() < 2*60*1000)).length;
  const offline = active - online;
  const admin = users.filter(u=> (u as any).role==="ADMIN").length;
  const recent = await prisma.activityLog.findMany({orderBy:{createdAt:"desc"}, take:8, include:{user:{select:{email:true,name:true}}}});
  return Response.json({total, active, suspended, online, offline, admin, recent});
}
