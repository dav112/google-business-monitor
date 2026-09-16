import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { AdminSyncButton } from "@/components/admin-sync-button";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage(){
  const user = await getCurrentUser();
  if (!user) return <div className="p-6">Login dulu</div>;
  if (!isAdminUser(user)) return <div className="p-6 rounded-xl border-2 bg-white"><h1 className="font-black">403 — Forbidden</h1><p className="text-sm">Hanya ADMIN yang bisa akses. Role Anda: {(user as any).role}. Hubungi admin.</p></div>;
  const sheetUrl = "https://docs.google.com/spreadsheets/d/15DamHskowz8-_Xji_KqrXpm-u_TykAOYGfTcfisPhM4";
  const webhook = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/sheet-pull`;
  const users = await prisma.user.findMany({select:{status:true, role:true, lastActiveAt:true}});
  const now = Date.now();
  const total = users.length;
  const suspended = users.filter(u=>u.status==="suspended").length;
  const active = total - suspended;
  const online = users.filter(u=> u.status!=="suspended" && u.lastActiveAt && (now - new Date(u.lastActiveAt).getTime() < 2*60*1000)).length;
  const offline = active - online;
  const adminCount = users.filter(u=> (u as any).role==="ADMIN").length;
  const recent = await prisma.activityLog.findMany({orderBy:{createdAt:"desc"}, take:6, include:{user:{select:{email:true,name:true}}}});
  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border-[3px] p-5 flex gap-2 flex-wrap" style={{background:"#0F1E3A", borderColor:"#0F1E3A"}}>
        <Link href="/admin" className="px-4 py-2 rounded-full text-xs font-black bg-white" style={{color:"#0F1E3A"}}>Dashboard</Link>
        <Link href="/admin/users" className="px-4 py-2 rounded-full text-xs font-black bg-white/20 text-white border border-white">Users</Link>
        <Link href="/admin/activity" className="px-4 py-2 rounded-full text-xs font-black bg-white/20 text-white border border-white">Activity</Link>
        <a href="/menu" className="ml-auto px-4 py-2 rounded-full text-xs font-black bg-white" style={{color:"#0F1E3A"}}>← Back to App</a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"TOTAL USERS", value: total, bg:"#FF6A00"},
          {label:"ONLINE", value: online, bg:"#00B894"},
          {label:"OFFLINE", value: offline, bg:"#636E72"},
          {label:"SUSPEND", value: suspended, bg:"#D63031"},
          {label:"ADMIN", value: adminCount, bg:"#6C5CE7"},
        ].map(c=>(
          <div key={c.label} className="rounded-[16px] border-[3px] p-4 bg-white" style={{borderColor:"#0F1E3A"}}>
            <div className="text-xs font-black tracking-widest text-[#0F1E3A]">{c.label}</div>
            <div className="text-2xl font-black" style={{color:c.bg}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[16px] border-[3px] p-4 bg-white" style={{borderColor:"#0F1E3A"}}>
        <h3 className="font-black text-sm text-black">Recent Activity</h3>
        <div className="mt-3 space-y-2">
          {recent.length===0 ? <p className="text-xs text-black font-black">No activity yet</p> : recent.map(a=>(
            <div key={a.id} className="flex gap-2 text-xs border-b py-2 last:border-0 items-center text-black">
              <span className="font-black text-black">{a.user?.name || a.userId.slice(0,6)}</span>
              <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-black leading-none border-2 border-black">{a.type}</span>
              <span className="flex-1 truncate text-black font-bold">{a.message}</span>
              <span className="text-black font-black whitespace-nowrap text-[11px]">{new Date(a.createdAt).toLocaleString("id-ID")}</span>
            </div>
          ))}
          <Link href="/admin/activity" className="text-xs underline font-black text-black">View all →</Link>
        </div>
      </div>

      <div className="rounded-[20px] border-[3px] p-5 bg-white" style={{borderColor:"#0F1E3A"}}>
        <h1 className="font-black text-xl text-[#0F1E3A]">Master Control — Sheets</h1>
        <p className="text-sm mt-1 text-zinc-900">Sheet <a href={`${sheetUrl}/edit?gid=1988652960`} target="_blank" className="underline" style={{color:"#0057FF"}}>Users gid 1988652960</a> ↔ DB sinkron 2-arah realtime.</p>
        <ul className="text-xs mt-2 list-disc pl-5 space-y-1 text-zinc-900">
          <li><b>A1:J1 Status</b> di kiri (kolom J) — dropdown <code>AKTIF / SUSPEND / HAPUS</code> per baris. Ubah di Sheet → Import.</li>
          <li><b>Warna baris:</b> <span style={{background:"#D9F0D9", padding:"2px 6px", border:"1px solid #999"}}>hijau muda</span> = online (&lt;5m terakhir aktif), <span style={{background:"#FADADD", padding:"2px 6px", border:"1px solid #999"}}>merah muda</span> = offline, <span style={{background:"#FFF", padding:"2px 6px", border:"1px solid #999"}}>putih</span> = SUSPEND.</li>
          <li>Suspend = user tidak bisa login (diblock di <code>src/lib/auth.ts:53</code>). Hapus = delete permanen (admin tidak ikut terhapus).</li>
        </ul>
        <p className="text-xs mt-2 text-zinc-700 font-medium">Realtime: cron 2-menit push warna + pull status, atau Apps Script onEdit di bawah untuk instan.</p>
      </div>
      <AdminSyncButton />
      <div className="rounded-xl border-[3px] p-4 bg-white space-y-3" style={{borderColor:"#0F1E3A"}}>
        <h2 className="font-black text-sm text-[#0F1E3A]">Otomatis realtime (opsional) — Apps Script</h2>
        <p className="text-xs text-zinc-900 font-medium">Biar tiap edit di Sheet langsung ngaruh tanpa klik Import, pasang trigger:</p>
        <ol className="text-xs list-decimal pl-5 space-y-1 text-zinc-900">
          <li>Buka Sheet → Extensions → Apps Script</li>
          <li>Paste code di bawah → Save → Run → Authorize</li>
          <li>Triggers (jam) → Add Trigger → onEdit → Time-driven tidak perlu, pilih onEdit</li>
        </ol>
        <pre className="text-xs bg-white border rounded p-3 overflow-auto">{`function onEdit(e){
  try{
    var sheet = e.source.getActiveSheet();
    if(sheet.getName()!=="Users") return;
    UrlFetchApp.fetch("${webhook}?token=${process.env.CRON_SECRET||"dev-cron-secret"}", {method:"post", muteHttpExceptions:true});
  }catch(err){}
}`}</pre>
        <p className="text-xs text-zinc-700 font-medium">Atau biarkan cron 5-menitan (vercel.json) yang poll otomatis — tanpa Apps Script juga akan sinkron maks 5 menit.</p>
      </div>
    </div>
  );
}
