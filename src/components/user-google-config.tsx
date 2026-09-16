"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "./confirm-dialog";

const C = { header: "#FF6A00", yellow: "#FFD600", cream: "#FFFBEB", navy: "#0F1E3A", blue: "#4DB8FF" };

export function UserGoogleConfig() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onYes: () => void } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/user/google-config");
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const d = JSON.parse(text);
      if (d.config) {
        setSaved(d.config);
        setClientId(d.config.clientId || "");
        setStatus(d.config.clientSecretMasked || "");
      }
    } catch {}
  }
  useEffect(() => { load(); }, []);

  async function doSave() {
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/user/google-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }) });
      const text = await res.text();
      const d = text ? JSON.parse(text) : {};
      setLoading(false);
      if (!res.ok) setMsg(d.error || "Gagal simpan");
      else {
        setMsg("✅ Berhasil terupdate!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        load();
        setClientSecret("");
      }
    } catch (e: any) {
      setLoading(false);
      setMsg("Gagal: " + e.message);
    }
  }
  function save() {
    setConfirm({ open: true, title: "Simpan config?", message: "Yakin simpan Client ID & Secret?", onYes: () => { setConfirm(null); doSave(); } });
  }
  async function doRemove() {
    await fetch("/api/user/google-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: true }) });
    setSaved(null); setClientId(""); setStatus(null); setMsg("✅ Dihapus");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  }
  function remove() {
    setConfirm({ open: true, title: "Hapus config?", message: "Yakin hapus config Google ini?", onYes: () => { setConfirm(null); doRemove(); } });
  }

  return (
    <>
      {showPopup && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border-2 font-black text-sm shadow-lg" style={{ background: "#00C853", borderColor: "#0F1E3A", color: "#FFFFFF" }}>✅ Berhasil terupdate!</div>}
      <div className="rounded-[20px] border-[3px] overflow-hidden" style={{ borderColor: "#000000", background: C.cream }}>
      <div className="px-5 py-3 border-b-[3px] flex items-center justify-between" style={{ background: C.header, borderColor: "#000000" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>🔧</div>
          <div className="font-black text-sm text-white">Konfigurasi Google</div>
          <span className="hidden md:inline text-xs font-bold px-2 py-1 rounded-full bg-white border-2" style={{ borderColor: C.navy, color: C.navy }}>per-user • terenkripsi</span>
        </div>
        <span className="text-xs font-black px-2 py-1 rounded-full bg-white border-2 hidden md:inline" style={{ borderColor: C.navy, color: C.navy }}>Tanpa akses server</span>
      </div>

      <div className="p-4 space-y-4" style={{ background: C.yellow }}>
        <div className="rounded-xl border-2 p-3 text-xs font-bold bg-white" style={{ borderColor: C.header, color: C.navy }}>
          Isi <b>Client ID & Secret kamu sendiri</b> di sini — tidak perlu buka <code className="px-1.5 py-0.5 rounded-full border-2 font-black" style={{ background: C.yellow, borderColor: C.header, color: C.navy }}>.env</code> di server. Disimpan terenkripsi per-user, hanya kamu yang bisa pakai. Jika kosong, akan pakai config global dari server (jika ada).
        </div>

        {saved && <div className="rounded-xl border-2 p-3 text-xs font-bold flex items-center gap-2" style={{ background: "#C8F7C5", borderColor: C.navy, color: "#000000" }}><span>✅</span> Tersimpan: {saved.clientId.slice(0, 22)}... • Secret: {status} • <a href="/locations" className="underline" style={{ color: "#0057FF" }}>Connect →</a></div>}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-[16px] border-[3px] p-3 flex gap-3 items-center shadow-[3px_3px_0px_rgba(255,106,0,0.3)]" style={{ background: "#FFFFFF", borderColor: C.header }}>
            <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0" style={{ background: "#FFE66D", borderColor: C.header }}>🆔</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black px-2 py-1 rounded-full border-2" style={{ background: C.header, borderColor: C.header, color: "#FFFFFF" }}>GOOGLE_CLIENT_ID</div>
              <Input className="mt-1.5 border-2 bg-white placeholder:text-zinc-400 font-bold h-9" style={{ borderColor: C.header, color: C.navy, background: "#FFFFFF" }} placeholder="xxx.apps.googleusercontent.com" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            </div>
          </div>
          <div className="rounded-[16px] border-[3px] p-3 flex gap-3 items-center shadow-[3px_3px_0px_rgba(255,106,0,0.3)]" style={{ background: "#FFFFFF", borderColor: C.header }}>
            <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0" style={{ background: "#A8E6CF", borderColor: C.header }}>🔑</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black px-2 py-1 rounded-full border-2" style={{ background: C.header, borderColor: C.header, color: "#FFFFFF" }}>GOOGLE_CLIENT_SECRET</div>
              <Input className="mt-1.5 border-2 bg-white placeholder:text-zinc-400 font-bold h-9" style={{ borderColor: C.header, color: C.navy, background: "#FFFFFF" }} type="password" placeholder="GOCSPX-..." value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 p-2.5 text-xs font-bold bg-white" style={{ borderColor: C.header, color: C.navy }}>Secret terenkripsi AES-256-GCM, tidak pernah tampil plain. Kosongkan Secret jika hanya mau update ID.</div>

        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={loading} className="px-5 py-2.5 rounded-full text-xs font-black border-[3px] shadow-[3px_3px_0px_rgba(255,106,0,0.3)]" style={{ background: C.header, borderColor: C.header, color: "#FFFFFF" }}>{loading ? "..." : "Simpan Config Saya →"}</button>
          <button onClick={async () => {
            const r = await fetch("/api/user/google-config/test", { method: "POST" });
            const d = await r.json();
            setMsg(d.ok ? "✅ " + d.message : "❌ " + (d.error || "Gagal"));
          }} className="px-4 py-2.5 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.header, color: C.navy }}>Test Sinkron</button>
          {saved && <button onClick={remove} className="px-4 py-2.5 rounded-full text-xs font-black border-[3px] bg-white" style={{ borderColor: C.header, color: C.navy }}>Hapus</button>}
          <span className="text-xs font-black px-3 py-2 rounded-full border-2 bg-white self-center" style={{ borderColor: C.header, color: C.navy }}>Min 3 karakter</span>
        </div>

        {msg && <div className="rounded-xl border-2 p-3 text-xs font-bold bg-white" style={{ borderColor: C.header, color: C.navy }}>{msg}</div>}

        <div className="rounded-xl border-2 p-3 text-xs font-bold bg-white flex flex-wrap gap-2 items-center" style={{ borderColor: C.header, color: C.navy }}>
          <span>Redirect URI GCP:</span> <code className="px-2 py-1 rounded-full border-2 font-bold" style={{ background: "#FFFFFF", borderColor: C.header, color: C.navy }}>http://localhost:3000/api/google/callback</code>
          <span style={{ color: C.navy, opacity: 0.6 }}>(atau domain prod)</span>
        </div>
      </div>
      {confirm && <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
    </div>
    </>
  );
}
