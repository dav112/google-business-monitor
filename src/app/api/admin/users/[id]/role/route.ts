import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
const schema = z.object({role: z.enum(["ADMIN","USER"])});
export async function PATCH(req:Request, {params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const { error, status, user: admin } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  let body:any; try{ body=await req.json(); }catch{ return Response.json({error:"Invalid JSON"}, {status:400}); }
  const parsed = schema.safeParse(body);
  if(!parsed.success) return Response.json({error: parsed.error.issues[0].message}, {status:422});
  const target = await prisma.user.findUnique({where:{id}});
  if(!target) return Response.json({error:"User not found"}, {status:404});
  if(target.role==="ADMIN" && parsed.data.role==="USER"){
    const c = await prisma.user.count({where:{role:"ADMIN"}});
    if(c<=1) return Response.json({error:"Cannot remove the last administrator"}, {status:409});
  }
  const updated = await prisma.user.update({where:{id}, data:{role: parsed.data.role as any}});
  await prisma.activityLog.create({data:{userId: admin!.id, type:"CHANGE_ROLE", status:"success", message:`Admin ${admin!.email} changed ${target.email} role ${target.role} -> ${parsed.data.role}`}});
  return Response.json({ok:true, user:{id:updated.id, role:updated.role}});
}
