import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(200).optional(),
  status: z.enum(["active","suspended"]).optional(),
  role: z.enum(["ADMIN","USER"]).optional(),
});

export async function PATCH(req:Request, {params}:{params:Promise<{id:string}>}){
  const {id} = await params;
  const { error, status, user: admin } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  let body:any;
  try{ body=await req.json(); }catch{ return Response.json({error:"Invalid JSON"}, {status:400}); }
  const parsed = patchSchema.safeParse(body);
  if(!parsed.success) return Response.json({error: parsed.error.issues[0].message}, {status:422});
  const target = await prisma.user.findUnique({where:{id}});
  if(!target) return Response.json({error:"User not found"}, {status:404});

  // protect last admin
  if(parsed.data.role && target.role==="ADMIN" && parsed.data.role==="USER"){
    const adminCount = await prisma.user.count({where:{role:"ADMIN"}});
    if(adminCount<=1) return Response.json({error:"Cannot remove the last administrator"}, {status:409});
  }
  // email uniqueness
  if(parsed.data.email && parsed.data.email!==target.email){
    const ex = await prisma.user.findUnique({where:{email: parsed.data.email}});
    if(ex) return Response.json({error:"Email already exists"}, {status:409});
  }

  const updated = await prisma.user.update({where:{id}, data: parsed.data as any});
  await prisma.activityLog.create({data:{userId: admin!.id, type: parsed.data.role ? "CHANGE_ROLE" : "UPDATE_USER", status:"success", message:`Admin ${admin!.email} updated ${target.email} -> ${JSON.stringify(parsed.data)}`}});
  const { password:_, ...safe } = updated as any;
  return Response.json({user: safe});
}

export async function DELETE(req:Request, {params}:{params:Promise<{id:string}>}){
  const {id} = await params;
  const { error, status, user: admin } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const target = await prisma.user.findUnique({where:{id}});
  if(!target) return Response.json({error:"User not found"}, {status:404});
  if(target.id===admin!.id) return Response.json({error:"Cannot delete yourself"}, {status:409});
  if(target.role==="ADMIN"){
    const adminCount = await prisma.user.count({where:{role:"ADMIN"}});
    if(adminCount<=1) return Response.json({error:"Cannot delete the last administrator"}, {status:409});
  }
  // hard delete — cascades per schema; ponytail: safe with cascade
  await prisma.user.delete({where:{id}});
  await prisma.activityLog.create({data:{userId: admin!.id, type:"DELETE_USER", status:"success", message:`Admin ${admin!.email} deleted ${target.email}`}});
  return Response.json({ok:true});
}

export async function GET(req:Request, {params}:{params:Promise<{id:string}>}){
  const {id} = await params;
  const { error, status } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const u = await prisma.user.findUnique({where:{id}, select:{id:true,name:true,email:true,role:true,status:true,lastActiveAt:true,createdAt:true,avatar:true,avatarPosX:true,avatarPosY:true,avatarZoom:true}});
  if(!u) return Response.json({error:"User not found"}, {status:404});
  return Response.json({user: u});
}
