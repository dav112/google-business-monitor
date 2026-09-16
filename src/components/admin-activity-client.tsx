"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Log = { id:string; type:string; status:string; message:string; createdAt:string; user:{email:string; name:string}|null; userId:string };

export default function AdminActivityClient(){
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load(){
    const p=new URLSearchParams();
    if(q) p.set("search",q);
    if(type) p.set("type",type);
    p.set("page",String(page));
    const r=await fetch(`/api/admin/activity?${p.toString()}`);
    const d=await r.json();
    if(r.ok){ setLogs(d.logs); setTotal(d.total); }
  }
  useEffect(()=>{ load(); },[type,page]);
  useEffect(()=>{ const t=setTimeout(()=>{ setPage(1); load(); },400); return ()=>clearTimeout(t); },[q]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search message" value={q} onChange={e=>setQ(e.target.value)} className="flex-1 min-w-[200px] border-2 !border-black" />
        <select value={type} onChange={e=>setType(e.target.value)} className="border-2 border-black rounded-full px-3 py-2 text-sm font-black bg-[#FF6A00] text-white">
          <option value="">All actions</option>
          <option value="CREATE_USER">CREATE_USER</option>
          <option value="SUSPEND_USER">SUSPEND_USER</option>
          <option value="UNSUSPEND_USER">UNSUSPEND_USER</option>
          <option value="DELETE_USER">DELETE_USER</option>
          <option value="CHANGE_ROLE">CHANGE_ROLE</option>
          <option value="LOGIN">LOGIN</option>
        </select>
        <Button variant="outline" onClick={load} className="border-2 !border-black">Refresh</Button>
      </div>
      <div className="rounded-xl border-[3px] border-black bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3A] border-b-2 border-black"><tr className="text-xs text-white font-black tracking-widest"><th className="p-2 text-left">User</th><th className="p-2">Action</th><th className="p-2 text-left">Description</th><th className="p-2">Time</th></tr></thead>
          <tbody>
            {logs.map(l=>(
              <tr key={l.id} className="border-b border-black last:border-0">
                <td className="p-2 text-xs font-black text-black">{l.user?.email || l.userId.slice(0,6)}</td>
                <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-white text-black text-xs font-black border-2 border-black">{l.type}</span></td>
                <td className="p-2 text-xs text-black font-bold">{l.message}</td>
                <td className="p-2 text-xs text-black font-bold">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {logs.length===0 && <tr><td colSpan={4} className="p-6 text-center text-black font-black">No logs</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 items-center text-xs font-bold text-[#0F1E3A]">
        <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="border-2 !border-black">Prev</Button>
        <span>Page {page} / {Math.max(1, Math.ceil(total/20))} ({total} logs)</span>
        <Button variant="outline" disabled={page>=Math.ceil(total/20)} onClick={()=>setPage(p=>p+1)} className="border-2 !border-black">Next</Button>
      </div>
    </div>
  );
}
