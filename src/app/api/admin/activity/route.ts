import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export async function GET(req:Request){
  const { error, status } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase() || "";
  const type = url.searchParams.get("type") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page")||"1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit")||"20"));
  const where:any={};
  if(type) where.type=type;
  if(search) where.message={contains:search, mode:"insensitive"};
  const logs = await prisma.activityLog.findMany({where, orderBy:{createdAt:"desc"}, skip:(page-1)*limit, take:limit, include:{user:{select:{email:true,name:true}}}});
  const total = await prisma.activityLog.count({where});
  return Response.json({logs, total, page, limit});
}
