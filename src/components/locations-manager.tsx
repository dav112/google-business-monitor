"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "./confirm-dialog";

type BA = { id: string; accountId: string; accountName: string; googleAccount: { email: string } };
type GLoc = { name: string; title: string; address: string };

export function LocationsManager({ initialBAs }: { initialBAs: BA[] }) {
  const [bas, setBas] = useState<BA[]>(initialBAs);
  const [locsByAccount, setLocsByAccount] = useState<Record<string, GLoc[]>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [showDisconnect, setShowDisconnect] = useState(false);

  async function refreshAccounts() {
    setLoading("accounts");
    const res = await fetch("/api/google/accounts");
    const data = await res.json();
    if (data.businessAccounts) setBas(data.businessAccounts);
    setLoading(null);
  }

  async function loadLocations(accountId: string) {
    setLoading(accountId);
    setMsg("");
    const res = await fetch(`/api/google/locations?accountId=${encodeURIComponent(accountId)}`);
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Failed");
    else setLocsByAccount(prev => ({ ...prev, [accountId]: data.locations }));
    setLoading(null);
  }

  async function importSelected(baId: string, accountId: string) {
    const locs = locsByAccount[accountId] || [];
    const toImport = locs.filter(l => selected[l.name]);
    if (toImport.length === 0) { setMsg("Pilih minimal 1 lokasi"); return; }
    setLoading("import");
    const res = await fetch("/api/locations/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessAccountId: baId, locations: toImport }) });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) setMsg(data.error || "Import failed");
    else { setMsg(`Imported ${data.imported} lokasi, monitoring enabled`); setTimeout(()=> location.reload(), 800); }
  }

  async function disconnect() {
    await fetch("/api/google/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setShowDisconnect(false);
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a href="/api/google/auth"><Button>Connect Google</Button></a>
        <Button variant="outline" onClick={refreshAccounts} disabled={!!loading}>{loading==="accounts"?"...":"Refresh Accounts"}</Button>
        <Button variant="ghost" onClick={()=>setShowDisconnect(true)}>Disconnect Google</Button>
      </div>
      {msg && <div className="text-sm p-2 bg-zinc-100 rounded">{msg}</div>}
      <ConfirmDialog open={showDisconnect} title="Disconnect Google?" message="Yakin putuskan semua Google account? Lokasi tetap tapi perlu connect ulang." onYes={disconnect} onNo={()=>setShowDisconnect(false)} />
      {bas.length===0 ? (
        <Card><CardContent className="pt-6 text-sm space-y-2"><div className="text-zinc-600">Belum ada Business Account.</div><div className="text-xs text-zinc-500">Jika sudah Connect tapi tetap kosong: cek <a href="https://business.google.com/" target="_blank" className="underline">business.google.com</a> — pastikan akun <b>{bas[0]?.googleAccount.email || "yang kamu pakai"}</b> sudah punya <b>Profil Bisnis terverifikasi</b>. Kalau baru bikin, verifikasi dulu baru muncul di sini. Klik <b>Disconnect Google</b> di atas untuk ganti akun.</div></CardContent></Card>
      ) : bas.map(ba => (
        <Card key={ba.id}>
          <CardHeader><CardTitle className="text-sm">{ba.accountName} <span className="font-normal text-zinc-500">{ba.accountId} · {ba.googleAccount.email}</span></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button size="sm" variant="outline" onClick={()=>loadLocations(ba.accountId)} disabled={loading===ba.accountId}>{loading===ba.accountId?"Loading...":"Load Locations"}</Button>
            {(locsByAccount[ba.accountId]||[]).map(l=>(
              <label key={l.name} className="flex gap-2 items-start border rounded p-2 text-sm">
                <input type="checkbox" checked={!!selected[l.name]} onChange={e=>setSelected(s=>({...s, [l.name]: e.target.checked}))} className="mt-1" />
                <span className="flex-1"><b>{l.title}</b><br/><span className="text-zinc-500 text-xs">{l.address || l.name}</span></span>
              </label>
            ))}
            {locsByAccount[ba.accountId] && <Button size="sm" onClick={()=>importSelected(ba.id, ba.accountId)} disabled={loading==="import"}>Enable Monitoring (import selected)</Button>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
