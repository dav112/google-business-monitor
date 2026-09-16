"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SheetsManager() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/sheets/list");
    const d = await res.json();
    if (d.sheets) setSheets(d.sheets);
  }
  useEffect(()=>{ load(); }, []);

  async function connect() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/sheets/connect", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ spreadsheetUrl: url }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) setMsg(d.error);
    else { setMsg("Connected!"); setUrl(""); load(); }
  }
  async function sync() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/sheets/sync", { method: "POST" });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) setMsg(d.error);
    else setMsg(d.mock ? `Mock sync OK: ${d.reviews} reviews, ${d.metrics} metrics (no real API call — set GOOGLE_CLIENT_ID to enable real Sheets write)` : `Synced ${d.reviews} reviews, ${d.metrics} metrics`);
    load();
  }
  async function disconnect(id: string) {
    await fetch("/api/sheets/disconnect", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Connect Spreadsheet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="https://docs.google.com/spreadsheets/d/XXXXXXXX" value={url} onChange={e=>setUrl(e.target.value)} />
            <Button onClick={connect} disabled={loading || !url}>Connect</Button>
          </div>
          <p className="text-xs text-zinc-500">Masukkan URL spreadsheet. Sistem akan extract ID dan tulis 2 sheet: <b>Reviews</b> & <b>Performance</b>. Pastikan spreadsheet sudah di-share ke Google account yang Connect (atau public editable untuk mock test).</p>
          {msg && <div className="text-sm p-2 bg-zinc-100 rounded">{msg}</div>}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={sync} disabled={loading || sheets.length===0}>Sync Now (Reviews + Performance)</Button>
        <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {sheets.length===0 ? <Card><CardContent className="pt-6 text-sm text-zinc-500">Belum ada spreadsheet terhubung.</CardContent></Card> : sheets.map(s=> (
        <Card key={s.id}>
          <CardHeader className="pb-2"><CardTitle className="text-sm truncate">{s.spreadsheetId} <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${s.status.includes("failed")?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}`}>{s.status}</span></CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="break-all text-zinc-600">{s.spreadsheetUrl}</div>
            <div>Last synced: {s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString("id-ID") : "never"} {s.errorMessage && <span className="text-red-600">· {s.errorMessage}</span>}</div>
            <div className="pt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={sync}>Sync</Button>
              <Button size="sm" variant="ghost" onClick={()=>disconnect(s.id)}>Disconnect</Button>
              <a href={s.spreadsheetUrl} target="_blank" className="text-xs underline flex items-center">Open Sheet →</a>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-zinc-50">
        <CardHeader><CardTitle className="text-xs">Sheet structure (auto-created)</CardTitle></CardHeader>
        <CardContent className="text-xs space-y-2">
          <div><b>Reviews:</b> Location | Reviewer | Rating | Comment | Review Date | Review Time | Created At | Updated At | Review ID | Status</div>
          <div><b>Performance:</b> Date | Location | Maps Views | Search Views | Website Clicks | Phone Calls | Direction Requests | Other Available Metrics</div>
          <div className="text-zinc-500">Database tetap source of truth — gagal sync tidak hapus data DB, status jadi failed + retry.</div>
        </CardContent>
      </Card>
    </div>
  );
}
