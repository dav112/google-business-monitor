"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminSyncButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [csv, setCsv] = useState("");
  const sheetUrl = "https://docs.google.com/spreadsheets/d/15DamHskowz8-_Xji_KqrXpm-u_TykAOYGfTcfisPhM4";
  async function sync() {
    setLoading(true); setMsg(""); setCsv("");
    const r = await fetch("/api/admin/sync-sheet", { method: "POST" });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) { setMsg(`❌ ${d.error}`); if(d.csv) setCsv(d.csv); return; }
    if (d.mock) {
      setMsg(`✅ Mock — ${d.count} users siap. ${d.message}`);
      setCsv(d.csv);
    } else {
      setMsg(`✅ Synced ${d.count} users ke ${d.sheetUrl} sheet Users!A1`);
    }
  }
  async function pull() {
    setLoading(true); setMsg(""); setCsv("");
    const r = await fetch("/api/admin/sheet-pull", { method: "POST" });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) { setMsg(`❌ ${d.error}`); return; }
    setMsg(`✅ Pull ${d.created} dibuat, ${d.deleted} dihapus, ${d.updated} update — Sheet ↔ DB sinkron. ${d.deleted? "Hapus di Sheet = hapus di web (admin tidak ikut terhapus).": ""}`);
  }
  return (
    <div className="rounded-xl border-2 p-4 bg-white space-y-3" style={{ borderColor: "#0F1E3A" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={sync} disabled={loading}>{loading?"Syncing...":"🔄 Sync DB → Sheet"}</Button>
        <Button onClick={pull} disabled={loading} variant="outline">{loading?"...":"⬇️ Import Sheet → DB"}</Button>
        <a href={sheetUrl} target="_blank" className="text-xs underline" style={{ color: "#0057FF" }}>Buka Sheet 15Dam… →</a>
        <span className="text-xs opacity-60">Hapus/tambah baris di Users (gid 1988652960) lalu Import — langsung terdaftar/terhapus. Admin tidak ikut terhapus.</span>
      </div>
      {msg && <div className="text-xs p-2 bg-zinc-100 rounded break-words">{msg}</div>}
      {csv && (
        <div className="space-y-1">
          <div className="text-xs font-bold">CSV siap paste manual (mock mode):</div>
          <textarea readOnly value={csv} className="w-full h-32 text-xs font-mono border rounded p-2" />
          <div className="text-xs opacity-60">Copy → buka Sheets → Users!A1 → Paste. Real API aktif setelah Connect Google + GOOGLE_CLIENT_ID terisi + sheet di-share ke googleAccount email sebagai Editor.</div>
        </div>
      )}
    </div>
  );
}
