"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "./confirm-dialog";

export function TelegramManager() {
  const [cfg, setCfg] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  async function load() {
    const res = await fetch("/api/telegram/list");
    const d = await res.json();
    if (d.configs?.[0]) setCfg(d.configs[0]);
    if (d.recent) setRecent(d.recent);
  }
  useEffect(()=>{ load(); }, []);

  async function connect() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/telegram/connect", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ botToken, chatId }) });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) setMsg(d.error || JSON.stringify(d.error));
    else { setMsg("Connected! Token disimpan aman (tidak expose ke frontend)."); setBotToken(""); load(); }
  }
  async function test() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/telegram/test", { method: "POST" });
    const d = await res.json();
    setLoading(false);
    setMsg(d.ok ? "✅ Test OK — cek Telegram" : d.mock ? `Mock: ${d.message}` : d.error);
    load();
  }
  async function toggle(field: string, value: boolean) {
    await fetch("/api/telegram/toggle", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ field, value }) });
    load();
  }
  async function disconnect() {
    await fetch("/api/telegram/disconnect", { method: "POST" });
    setShowDisconnect(false);
    setCfg(null); load();
  }
  async function retry(id: string) {
    const res = await fetch("/api/telegram/retry", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ notificationId: id }) });
    const d = await res.json();
    setMsg(d.ok ? "Retried OK" : d.error);
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Connect Telegram</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-xs font-medium">Bot Token</label><Input type="password" placeholder="123456:ABC..." value={botToken} onChange={e=>setBotToken(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs font-medium">Chat ID</label><Input placeholder="-100xxx / 123456" value={chatId} onChange={e=>setChatId(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={connect} disabled={loading || !botToken || !chatId}>Save & Connect</Button>
            <Button variant="outline" onClick={test} disabled={loading || !cfg}>Test Telegram</Button>
            {cfg && <Button variant="ghost" onClick={()=>setShowDisconnect(true)}>Disconnect</Button>}
          </div>
          {cfg && <div className="text-xs p-2 bg-green-50 border border-green-200 rounded">Status: 🟢 Connected — {cfg.tokenMasked} · Chat {cfg.chatId} · Token tidak di-expose ke browser</div>}
          {msg && <div className="text-sm p-2 bg-zinc-100 rounded break-words">{msg}</div>}
          <p className="text-xs text-zinc-500">Bot Token & Chat ID disimpan aman di DB column <code>botToken @db.Text</code>, endpoint list hanya return masked token. Jangan share token.</p>
        </CardContent>
      </Card>

      {cfg && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Alert Toggles (⭐1-3 default ON)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["alertOn1","⭐1 alert"],
              ["alertOn2","⭐2 alert"],
              ["alertOn3","⭐3 alert"],
              ["alertOn4","⭐4 alert (off default)"],
              ["alertOn5","⭐5 alert (off default)"],
            ].map(([field, label])=> (
              <label key={field} className="flex items-center justify-between border rounded px-3 py-2">
                <span>{label}</span>
                <input type="checkbox" checked={!!cfg[field]} onChange={e=>toggle(field, e.target.checked)} />
              </label>
            ))}
            <label className="flex items-center justify-between border rounded px-3 py-2">
              <span>Enabled</span><input type="checkbox" checked={cfg.isActive} onChange={e=>toggle("isActive", e.target.checked)} />
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Telegram Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.length===0 ? <p className="text-sm text-zinc-500">Belum ada notifikasi. Sync review baru ⭐1-3 akan trigger otomatis (dedup by reviewId).</p> : recent.map((n:any)=> (
            <div key={n.id} className="flex justify-between items-center border rounded px-3 py-2 text-sm">
              <span>⭐{n.review.rating} {n.review.location.title} · {n.status} {n.error && <span className="text-red-600">· {n.error.slice(0,60)}</span>}</span>
              <span className="flex gap-2 items-center text-xs">
                {new Date(n.createdAt).toLocaleString("id-ID")}
                {n.status==="failed" && <Button size="sm" variant="outline" onClick={()=>retry(n.id)}>Retry</Button>}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog open={showDisconnect} title="Disconnect Telegram?" message="Yakin putuskan koneksi Telegram? Alert akan berhenti." onYes={disconnect} onNo={()=>setShowDisconnect(false)} />
      <Card className="bg-zinc-50"><CardContent className="pt-4 text-xs space-y-1">
        <div>Format alert sesuai spec: 🚨 GOOGLE REVIEW ALERT dengan Location, Rating, Reviewer, Comment, Date/Time, Link. Rating 4/5 tidak kirim kecuali toggle diaktifkan.</div>
        <div>Dedup: `Review.reviewId` unique + `notifications(reviewId, channel)` cegah kirim berkali-kali (lihat `src/lib/telegram.ts:22`).</div>
      </CardContent></Card>
    </div>
  );
}
