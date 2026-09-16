import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export async function POST(req:Request, {params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const { error, status, user: admin } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const target = await prisma.user.findUnique({where:{id}});
  if(!target) return Response.json({error:"User not found"}, {status:404});
  if(target.id===admin!.id) return Response.json({error:"Cannot suspend yourself"}, {status:409});
  if((target as any).status==="suspended") return Response.json({error:"Already suspended"}, {status:409});
  const updated = await prisma.user.update({where:{id}, data:{status:"suspended"}});
  await prisma.activityLog.create({data:{userId: admin!.id, type:"SUSPEND_USER", status:"success", message:`Admin ${admin!.email} suspended ${target.email}`}});
  // invalidate sessions
  const { prisma: p2 } = await import("@/lib/db");
  await p2.user.update({where:{id}, data:{sessionInvalidBefore: new Date()}});
  return Response.json({ok:true, user: {id: updated.id, status: updated.status}});
}
