"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "./confirm-dialog";

export function TeamClient({ initial, ownerEmail }: { initial: any[]; ownerEmail: string }) {
  const [emails, setEmails] = useState(initial);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/user/emails");
    const d = await r.json();
    if (d.emails) setEmails(d.emails);
  }
  async function invite() {
    setLoading(true); setMsg("");
    const r = await fetch("/api/user/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) setMsg(d.error || "Gagal");
    else { setMsg("Undangan terkirim (mock) — email masuk tabel."); setEmail(""); load(); }
  }
  async function doRemove() {
    if (!pendingId) return;
    await fetch(`/api/user/emails?id=${pendingId}`, { method: "DELETE" });
    setPendingId(null);
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Undang Anggota</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Button onClick={invite} disabled={loading || !email}>Undang</Button>
          </div>
          <p className="text-xs text-zinc-500">Email akan masuk tabel <code>user_emails</code>. Role default Viewer — upgrade manual di DB jika perlu. Kirim email invite real add when SMTP configured.</p>
          {msg && <div className="text-sm p-2 bg-zinc-100 rounded">{msg}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Anggota ({emails.length + 1})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 border-b"><tr><th className="text-left p-2">Email</th><th className="text-left p-2">Role</th><th className="text-left p-2">Status</th><th className="text-right p-2">Aksi</th></tr></thead>
            <tbody>
              <tr className="border-b bg-zinc-50"><td className="p-2">{ownerEmail} <span className="ml-1 text-xs bg-zinc-900 text-white px-1.5 py-0.5 rounded">Owner</span></td><td className="p-2">Owner</td><td className="p-2">Aktif</td><td className="p-2 text-right">—</td></tr>
              {emails.map((e: any) => (
                <tr key={e.id} className="border-b"><td className="p-2">{e.email}</td><td className="p-2">Viewer</td><td className="p-2">{e.isActive ? "Aktif" : "Pending"}</td><td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setPendingId(e.id)}>Hapus</Button></td></tr>
              ))}
              {emails.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-zinc-500 text-sm">Belum ada anggota. Undang di atas.</td></tr>}
            </tbody>
          </table>
        </CardContent>
        </Card>
      <ConfirmDialog open={!!pendingId} title="Hapus anggota?" message="Yakin hapus email ini dari team?" onYes={doRemove} onNo={()=>setPendingId(null)} />
    </div>
  );
}
