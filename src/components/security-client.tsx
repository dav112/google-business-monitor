"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "./confirm-dialog";
import { useState } from "react";

export function SecurityClient({ user, google, telegramCount, sheetsCount, recent }: any) {
  const [msg, setMsg] = useState("");
  const [showDisc, setShowDisc] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  async function logoutAll() {
    const r = await fetch("/api/auth/logout-all", { method: "POST" });
    const d = await r.json();
    setMsg(d.ok ? "Logged out all devices" : d.error);
    if (d.ok) location.href = "/login";
  }
  async function disconnectGoogle() {
    await fetch("/api/google/disconnect", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({}) });
    setShowDisc(false);
    setMsg("Google disconnected"); location.reload();
  }
  async function deleteAccount() {
    if (!deletePw) { setMsg("Isi password untuk DELETE"); return; }
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ confirm: "DELETE", password: deletePw }) });
    const d = await r.json();
    if (!r.ok) setMsg(d.error); else location.href = "/register";
  }
  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-sm">Account Security</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <div>🟢 Email: {user.email} {user.emailVerified ? "(verified)" : "(not verified)"}</div>
        <div>Created: {new Date(user.createdAt).toLocaleString("id-ID")}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Connections</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <div>Google: {google.length ? `🟢 Connected (${google.map((g:any)=>g.email).join(", ")})` : "⚪ Not connected"}</div>
        <div>Telegram: {telegramCount ? "🟢 Connected" : "⚪ Not connected"}</div>
        <div>Google Sheets: {sheetsCount ? "🟢 Connected" : "⚪ Not connected"}</div>
        <div className="text-xs text-zinc-500">Refresh token & bot token terenkripsi AES-256-GCM, masked di UI (••••).</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Active Sessions</CardTitle></CardHeader><CardContent className="space-y-2">
        <div className="text-sm text-zinc-500">Session cookie HttpOnly Secure SameSite=Lax, exp 7d. Invalidate via logout.</div>
        <Button size="sm" variant="outline" onClick={logoutAll}>Logout All Devices</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Recent Security Activity</CardTitle></CardHeader><CardContent className="space-y-1">
        {recent.length===0 ? <p className="text-sm text-zinc-500">No activity</p> : recent.map((r:any,i:number)=> <div key={i} className="flex justify-between text-xs border-b py-1"><span>{r.type} · {r.status}</span><span className="text-zinc-400">{new Date(r.at).toLocaleString("id-ID")}</span></div>)}
      </CardContent></Card>
      <div className="flex gap-2">
        <Button variant="outline" onClick={()=>setShowDisc(true)}>Disconnect Google</Button>
        <Button variant="outline" onClick={()=>setShowDelete(true)} className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200">Delete Account</Button>
      </div>
      <ConfirmDialog open={showDisc} title="Disconnect Google?" message="Yakin putuskan Google? Credential akan dihapus." onYes={disconnectGoogle} onNo={()=>setShowDisc(false)} />
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-[3px] bg-white p-5" style={{ borderColor: "#0F1E3A" }}>
            <div className="font-black text-sm" style={{ color: "#0F1E3A" }}>DELETE account?</div>
            <div className="text-xs mt-2" style={{ color: "#0F1E3A" }}>Ketik password untuk konfirmasi DELETE — data akan hilang permanen.</div>
            <Input type="password" placeholder="Password" value={deletePw} onChange={e=>setDeletePw(e.target.value)} className="mt-3" />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={()=>setShowDelete(false)} className="px-4 py-2 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Batal</button>
              <button onClick={deleteAccount} className="px-4 py-2 rounded-full text-xs font-black border-2 text-white" style={{ background: "#EF4444", borderColor: "#0F1E3A" }}>DELETE</button>
            </div>
          </div>
        </div>
      )}
      {msg && <div className="text-sm p-2 bg-zinc-100 rounded">{msg}</div>}
      <div className="text-xs text-zinc-500"><a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a></div>
    </div>
  );
}
