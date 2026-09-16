"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type U = { id:string; name:string; email:string; role:string; status:string; presence:string; lastActiveAt:string|null; createdAt:string; avatar?:string|null; avatarPosX?:number; avatarPosY?:number; avatarZoom?:number; hasGmaps?:boolean; hasTele?:boolean; isConfigured?:boolean; configLabel?:string; gmapsLinks?:{title:string;url:string}[]; locations?:{title:string;placeId:string;address:string;name:string}[] };

function FancySelect({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[] }){
  const [open,setOpen]=useState(false);
  const label = options.find(o=>o.value===value)?.label ?? options[0]?.label ?? "";
  return (
    <div className="relative">
      <button type="button" onClick={()=>setOpen(o=>!o)} className="bg-[#FF6A00] text-white border-2 border-black rounded-full px-3 py-1.5 text-xs font-black flex items-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-all shadow-sm">
        {label} <span className={`transition-transform duration-200 ${open?"rotate-180":""}`}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={()=>setOpen(false)} />
            <motion.div initial={{opacity:0, y:-6, scale:0.97}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:-6, scale:0.97}} transition={{duration:0.18, ease:"easeOut"}} className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[150px] bg-white border-2 border-black rounded-xl overflow-hidden shadow-xl">
              {options.map(o=>(
                <button key={o.value} onClick={()=>{ onChange(o.value); setOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#FF6A00] hover:text-white transition-colors ${value===o.value?"bg-black text-white":"text-[#0F1E3A] bg-white"}`}>{o.label}</button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersClient(){
  const [users, setUsers] = useState<U[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterPresence, setFilterPresence] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<U|null>(null);
  const [previewUser, setPreviewUser] = useState<U|null>(null);
  const [msg, setMsg] = useState("");

  async function load(){
    setLoading(true);
    const p = new URLSearchParams();
    if(q) p.set("search", q);
    if(filterStatus) p.set("status", filterStatus);
    if(filterRole) p.set("role", filterRole);
    if(filterPresence) p.set("presence", filterPresence);
    if(sort) p.set("sort", sort);
    const r = await fetch(`/api/admin/users?${p.toString()}`);
    const d = await r.json();
    if(r.ok){ setUsers(d.users); setTotal(d.total); }
    else setMsg(d.error||"Failed");
    setLoading(false);
  }
  useEffect(()=>{ load(); },[filterStatus,filterRole,filterPresence,sort]);
  // debounce search
  useEffect(()=>{ const t=setTimeout(load,400); return ()=>clearTimeout(t); },[q]);

  async function createUser(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const body={ name:fd.get("name"), email:fd.get("email"), password:fd.get("password"), role:fd.get("role"), status:fd.get("status") };
    const r=await fetch("/api/admin/users",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){ setMsg(`❌ ${d.error}`); return; }
    setMsg(`✅ Created ${d.user.email}`);
    setShowCreate(false); load();
  }
  async function updateUser(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!editUser) return;
    const fd=new FormData(e.currentTarget);
    const body:any={};
    if(fd.get("name")) body.name=fd.get("name");
    if(fd.get("email")) body.email=fd.get("email");
    if(fd.get("status")) body.status=fd.get("status");
    if(fd.get("role")) body.role=fd.get("role");
    const r=await fetch(`/api/admin/users/${editUser.id}`,{method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok){ setMsg(`❌ ${d.error}`); return; }
    setMsg(`✅ Updated ${editUser.email}`);
    setEditUser(null); load();
  }
  async function doAction(id:string, action:string){
    if(action==="suspend" && !confirm("Suspend user? Tidak bisa login selama suspended.")) return;
    if(action==="unsuspend" && !confirm("Aktifkan kembali user?")) return;
    if(action==="delete" && !confirm("Delete permanen? Tidak dapat dibatalkan!")) return;
    let url=`/api/admin/users/${id}`;
    let method="DELETE";
    if(action==="suspend"){ url+=`/suspend`; method="POST"; }
    if(action==="unsuspend"){ url+=`/unsuspend`; method="POST"; }
    if(action==="delete"){ method="DELETE"; }
    const r=await fetch(url,{method});
    const d=await r.json();
    if(!r.ok){ setMsg(`❌ ${d.error}`); return; }
    setMsg(`✅ ${action} ok`);
    load();
  }
  async function changeRole(u:U, newRole:string){
    if(!confirm(`Ubah ${u.email} ${u.role} → ${newRole}?`)) return;
    const r=await fetch(`/api/admin/users/${u.id}/role`,{method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({role:newRole})});
    const d=await r.json();
    if(!r.ok){ setMsg(`❌ ${d.error}`); return; }
    setMsg(`✅ Role ${u.email} → ${newRole}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] flex gap-2">
          <Input placeholder="🔎 Search name/email" value={q} onChange={e=>setQ(e.target.value)} className="border-2 !border-black" />
          <Button onClick={load} variant="outline" className="border-2 !border-black bg-white text-black font-black">Search</Button>
        </div>
        <Button onClick={()=>setShowCreate(true)} className="bg-[#0F1E3A] text-white border-2 border-black font-black">+ CREATE USER</Button>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <FancySelect value={filterStatus} onChange={setFilterStatus} options={[{value:"",label:"All status"},{value:"sudah",label:"Sudah"},{value:"belum",label:"Belum"}]} />
        <FancySelect value={filterRole} onChange={setFilterRole} options={[{value:"",label:"All role"},{value:"ADMIN",label:"Admin"},{value:"USER",label:"User"}]} />
        <FancySelect value={filterPresence} onChange={setFilterPresence} options={[{value:"",label:"All presence"},{value:"online",label:"Online"},{value:"offline",label:"Offline"}]} />
        <FancySelect value={sort} onChange={setSort} options={[{value:"newest",label:"Newest"},{value:"oldest",label:"Oldest"},{value:"name",label:"Name"},{value:"lastActive",label:"Last Active"}]} />
        <span className="ml-auto text-xs text-[#0F1E3A] font-bold">{total} users {loading?"(loading...)":""}</span>
      </div>
      {msg && <div className="text-xs p-2 bg-white border-2 border-black text-black font-black rounded break-words">{msg}</div>}

      <div className="rounded-xl border-[3px] border-black overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1E3A] border-b-2 border-black"><tr className="text-xs text-white font-black tracking-widest"><th className="p-2 text-left">User</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">GMaps Link</th><th className="p-2">Presence</th><th className="p-2">Created</th><th className="p-2">Action</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-b border-black last:border-0 hover:bg-zinc-50">
                  <td className="p-2"><div className="flex items-center gap-2">{u.avatar ? <button onClick={()=>setPreviewUser(u)} className="w-9 h-9 rounded-full border-2 border-black overflow-hidden bg-white shrink-0 flex items-center justify-center hover:brightness-95 active:scale-95 transition-all cursor-pointer" title="Lihat foto full"><img src={u.avatar} alt={u.name} className="w-full h-full pointer-events-none" style={{objectFit:"cover", objectPosition:`${u.avatarPosX ?? 50}% ${u.avatarPosY ?? 50}%`, transform: u.avatarZoom && u.avatarZoom!==1 ? `scale(${u.avatarZoom})` : undefined}} /></button> : <div className="w-9 h-9 rounded-full border-2 border-black bg-white shrink-0 flex items-center justify-center"><span className="text-sm">👤</span></div>}<div><div className="font-bold text-[#0F1E3A] leading-tight">{u.name}</div><div className="text-xs text-zinc-700 font-medium">{u.email}</div></div></div></td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-black border-2 border-black ${u.role==="ADMIN"?"bg-purple-100 text-purple-800":"bg-[#FF6A00] text-white"}`}>{u.role}</span></td>
                  <td className="p-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-black ${u.hasGmaps?"bg-[#FF6A00] text-white":"bg-white text-[#0F1E3A]"}`}>GMaps {u.hasGmaps?"✓":"✗"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border-2 border-black ${u.hasTele?"bg-[#FF6A00] text-white":"bg-white text-[#0F1E3A]"}`}>Tele {u.hasTele?"✓":"✗"}</span>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {u.gmapsLinks && u.gmapsLinks.length>0 ? (
                      <div className="flex flex-col gap-1 items-center">
                        {u.gmapsLinks.slice(0,2).map((l,i)=>(
                          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#0057FF] underline hover:text-[#FF6A00] break-all max-w-[160px] truncate" title={l.title}>{l.title || "Buka GMaps →"}</a>
                        ))}
                        {u.gmapsLinks.length>2 && <span className="text-[10px] text-zinc-700">+{u.gmapsLinks.length-2} lagi</span>}
                      </div>
                    ) : u.hasGmaps ? (
                      <span className="text-[11px] font-bold text-[#0F1E3A]">Terhubung (belum ada lokasi)</span>
                    ) : (
                      <span className="text-[11px] text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border-2 border-black ${u.presence==="ONLINE"?"bg-green-600 text-white":u.presence==="SUSPENDED"?"bg-red-50 text-red-700": "bg-zinc-800 text-white"}`}>{u.presence==="ONLINE"?"🟢":u.presence==="SUSPENDED"?"⚪":"🔴"} {u.presence}</span>
                  </td>
                  <td className="p-2 text-xs text-zinc-800 font-medium">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="p-2"><div className="flex gap-1 flex-wrap">
                    <button onClick={()=>setEditUser(u)} className="px-2 py-1 rounded border-2 border-black text-xs bg-white text-[#D63031] font-black">Edit</button>
                    {u.status==="active" ? <button onClick={()=>doAction(u.id,"suspend")} className="px-2 py-1 rounded bg-[#D63031] text-white text-xs font-black border-2 border-black">Suspend</button> : <button onClick={()=>doAction(u.id,"unsuspend")} className="px-2 py-1 rounded bg-green-600 text-white text-xs font-black border-2 border-black">Unsuspend</button>}
                    <button onClick={()=>doAction(u.id,"delete")} className="px-2 py-1 rounded border-2 border-black text-xs bg-white text-[#D63031] font-black">Delete</button>
                  </div></td>
                </tr>
              ))}
              {users.length===0 && !loading && <tr><td colSpan={7} className="p-6 text-center text-sm text-zinc-700 font-bold">No users</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowCreate(false)}>
          <form onSubmit={createUser} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-0 w-full max-w-md space-y-0 border-[3px] border-black overflow-hidden shadow-2xl">
            <div className="bg-[#0F1E3A] px-5 py-4 border-b-[3px] border-black">
              <h3 className="font-black text-white text-sm tracking-wide">＋ CREATE NEW USER</h3>
            </div>
            <div className="p-5 space-y-3">
              <div><Label className="font-black text-[#0F1E3A] text-xs tracking-widest">Name</Label><Input name="name" required className="border-2 !border-black bg-white text-[#0F1E3A] font-medium mt-1" /></div>
              <div><Label className="font-black text-[#0F1E3A] text-xs tracking-widest">Email</Label><Input name="email" type="email" required className="border-2 !border-black bg-white text-[#0F1E3A] font-medium mt-1" /></div>
              <div><Label className="font-black text-[#0F1E3A] text-xs tracking-widest">Password</Label><Input name="password" type="password" required minLength={6} className="border-2 !border-black bg-white text-[#0F1E3A] font-medium mt-1" /></div>
              <div className="flex gap-2"><div className="flex-1"><Label className="font-black text-[#0F1E3A] text-xs tracking-widest">Role</Label><select name="role" className="w-full border-2 border-black rounded-md px-2 py-2 text-sm font-black bg-white text-[#0F1E3A] mt-1"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div><div className="flex-1"><Label className="font-black text-[#0F1E3A] text-xs tracking-widest">Status</Label><select name="status" className="w-full border-2 border-black rounded-md px-2 py-2 text-sm font-black bg-white text-[#0F1E3A] mt-1"><option value="active">ACTIVE</option><option value="suspended">SUSPENDED</option></select></div></div>
              <div className="flex gap-2 pt-2"><Button type="button" variant="outline" className="flex-1 border-2 !border-black bg-white text-[#D63031] font-black" onClick={()=>setShowCreate(false)}>Cancel</Button><Button type="submit" className="flex-1 bg-[#FF6A00] text-white border-2 border-black font-black hover:brightness-110">Create</Button></div>
              <p className="text-xs text-zinc-700 font-bold">Password di-hash, tidak tampil di log.</p>
            </div>
          </form>
        </div>
      )}
      {previewUser && previewUser.avatar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={()=>setPreviewUser(null)}>
          <div onClick={e=>e.stopPropagation()} className="relative bg-white rounded-2xl border-[3px] border-black overflow-hidden shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="bg-[#0F1E3A] px-4 py-3 border-b-[3px] border-black flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="font-black text-white text-sm truncate">{previewUser.name}</div><div className="text-xs font-bold text-white/70 truncate">{previewUser.email}</div></div>
              <button onClick={()=>setPreviewUser(null)} className="w-8 h-8 rounded-full bg-white text-black border-2 border-black font-black shrink-0 hover:bg-zinc-100">✕</button>
            </div>
            <div className="p-3 bg-zinc-100 flex items-center justify-center overflow-auto">
              <img src={previewUser.avatar} alt={previewUser.name} className="max-w-[80vw] max-h-[70vh] w-auto h-auto object-contain rounded-xl border-2 border-black bg-white" />
            </div>
            <div className="px-4 py-2 bg-white border-t-2 border-black text-center"><span className="text-xs font-bold text-[#0F1E3A]">Foto asli seperti diupload user — klik luar untuk tutup</span></div>
          </div>
        </div>
      )}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setEditUser(null)}>
          <form onSubmit={updateUser} onClick={e=>e.stopPropagation()} className="bg-[#FF6A00] rounded-2xl p-0 w-full max-w-md space-y-0 border-[3px] border-black overflow-hidden shadow-2xl">
            <div className="bg-[#0F1E3A] px-5 py-4 border-b-[3px] border-black">
              <h3 className="font-black text-white text-sm tracking-wide">✏️ Edit User</h3>
              <p className="text-xs font-bold text-white/80 truncate">{editUser.email}</p>
            </div>
            <div className="p-5 space-y-3">
              <div><Label className="font-black text-white text-xs tracking-widest">Name</Label><Input name="name" defaultValue={editUser.name} className="border-2 !border-black bg-[#0F1E3A] text-white placeholder:text-white/60 font-black mt-1" /></div>
              <div><Label className="font-black text-white text-xs tracking-widest">Email</Label><Input name="email" defaultValue={editUser.email} className="border-2 !border-black bg-[#0F1E3A] text-white placeholder:text-white/60 font-black mt-1" /></div>
              <div className="flex gap-2"><div className="flex-1"><Label className="font-black text-white text-xs tracking-widest">Role</Label><select name="role" defaultValue={editUser.role} className="w-full border-2 border-black rounded-md px-2 py-2 text-sm font-black bg-white text-[#0F1E3A] mt-1"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div><div className="flex-1"><Label className="font-black text-white text-xs tracking-widest">Status</Label><select name="status" defaultValue={editUser.status} className="w-full border-2 border-black rounded-md px-2 py-2 text-sm font-black bg-white text-[#0F1E3A] mt-1"><option value="active">ACTIVE</option><option value="suspended">SUSPENDED</option></select></div></div>
              <div className="flex gap-2 pt-2"><Button type="button" variant="outline" className="flex-1 border-2 !border-black bg-white text-[#D63031] font-black hover:bg-zinc-50" onClick={()=>setEditUser(null)}>Cancel</Button><Button type="submit" className="flex-1 bg-[#0F1E3A] text-white border-2 border-black font-black hover:brightness-110">Save</Button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
