import { prisma } from "@/lib/db";
import { requireAdmin, isAdminUser } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  password: z.string().min(6).max(128),
  role: z.enum(["ADMIN","USER"]).default("USER"),
  status: z.enum(["active","suspended"]).default("active"),
});

export async function GET(req: Request){
  const { error, status, user } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase() || "";
  const filterStatus = url.searchParams.get("status"); // active/suspended
  const filterRole = url.searchParams.get("role"); // ADMIN/USER
  const filterPresence = url.searchParams.get("presence"); // online/offline
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(url.searchParams.get("page")||"1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit")||"20")));

  const where:any = {};
  if(search) where.OR = [{name:{contains:search, mode:"insensitive"}},{email:{contains:search, mode:"insensitive"}}];
  // filterStatus now means config: sudah/belum (new) — keep backward compat for active/suspended if sent
  if(filterStatus==="active" || filterStatus==="suspended") where.status = filterStatus;
  if(filterRole) where.role = filterRole;

  let orderBy:any = { createdAt:"desc" };
  if(sort==="oldest") orderBy={createdAt:"asc"};
  if(sort==="name") orderBy={name:"asc"};
  if(sort==="lastActive") orderBy={lastActiveAt:"desc"};

  const users = await prisma.user.findMany({
    where, orderBy,
    select:{id:true,name:true,email:true,role:true,status:true,lastActiveAt:true,createdAt:true,avatar:true,avatarPosX:true,avatarPosY:true,avatarZoom:true, googleAccounts:{select:{id:true, email:true}}, telegramConfigs:{select:{id:true, isActive:true}}, googleConfig:{select:{id:true}}, locations:{select:{id:true, title:true, placeId:true, address:true, name:true}}},
    skip:(page-1)*limit, take: limit,
  });
  const total = await prisma.user.count({where});

  // presence filter after fetch (needs lastActiveAt calc)
  let filtered = users;
  if(filterPresence==="online" || filterPresence==="offline"){
    const now = Date.now();
    filtered = users.filter(u=>{
      if(u.status==="suspended") return filterPresence==="offline"; // suspended considered offline
      const online = u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime() < 2*60*1000);
      return filterPresence==="online" ? online : !online;
    });
  }

  let withPresence = filtered.map(u=>{
    const online = u.status!=="suspended" && u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime() < 2*60*1000);
    const hasGmaps = ((u as any).googleAccounts?.length > 0) || !!(u as any).googleConfig;
    const hasTele = ((u as any).telegramConfigs?.some((t:any)=>t.isActive));
    const isConfigured = hasGmaps && hasTele;
    const locs = (u as any).locations || [];
    // build gmaps links: prefer placeId, fallback to title/address search
    const gmapsLinks = locs.map((l:any)=>({
      title: l.title,
      url: l.placeId ? `https://www.google.com/maps/search/?api=1&query_place_id=${l.placeId}` : l.name ? `https://www.google.com/maps/search/${encodeURIComponent(l.title || l.address || l.name)}` : null,
    })).filter((x:any)=>x.url);
    return {...u, presence: u.status==="suspended" ? "SUSPENDED" : (online?"ONLINE":"OFFLINE"), hasGmaps, hasTele, isConfigured, configLabel: isConfigured ? "SUDAH" : "BELUM", gmapsLinks, locations: locs};
  });
  if(filterStatus==="sudah") withPresence = withPresence.filter((u:any)=>u.isConfigured);
  if(filterStatus==="belum") withPresence = withPresence.filter((u:any)=>!u.isConfigured);

  return Response.json({users: withPresence, total: filterStatus==="sudah"||filterStatus==="belum" ? withPresence.length : total, page, limit});
}

export async function POST(req:Request){
  const { error, status, user: admin } = await requireAdmin();
  if(error) return Response.json({error}, {status});
  let body:any;
  try{ body=await req.json(); }catch{ return Response.json({error:"Invalid JSON"}, {status:400}); }
  const parsed = createSchema.safeParse(body);
  if(!parsed.success) return Response.json({error: parsed.error.issues[0].message}, {status:422});
  const { name,email,password,role,status: st } = parsed.data;

  // only ADMIN can create ADMIN — require confirmation header? ponytail: allow but log warning
  if(role==="ADMIN"){
    const adminCount = await prisma.user.count({where:{role:"ADMIN"}});
    // allow, but log
  }

  const exists = await prisma.user.findUnique({where:{email}});
  if(exists) return Response.json({error:"Email already exists"}, {status:409});

  const hashed = await hashPassword(password);
  const u = await prisma.user.create({data:{name,email,password:hashed, role: role as any, status: st}});
  await prisma.activityLog.create({data:{userId: admin!.id, type:"CREATE_USER", status:"success", message:`Admin ${admin!.email} created user ${email} (${role}/${st})`}});
  const { password:_, ...safe } = u as any;
  return Response.json({user: safe}, {status:201});
}
