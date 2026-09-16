"use client";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

export function ProfileEditor() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [activeEmail, setActiveEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onYes: () => void } | null>(null);

  async function load() {
    const r = await fetch("/api/user/profile");
    const d = await r.json();
    if (d.user) {
      setName(d.user.name);
      setEmail(d.user.email);
      setAvatar(d.user.avatar);
      setPreview(d.user.avatar);
    }
    const er = await fetch("/api/user/emails");
    const ed = await er.json();
    if (ed.emails) { setEmails(ed.emails); setActiveEmail(ed.active); }
  }
  useEffect(() => { load(); }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.size > 2 * 1024 * 1024) { setMsg("Maks 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function doSaveProfile() {
    setLoading(true); setMsg("");
    const body: any = {};
    if (name) body.name = name;
    if (email) body.email = email;
    if (preview && preview !== avatar) body.avatar = preview;
    const r = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) {
      setMsg("✅ Profil berhasil terupdate!");
      setShowPopup(true);
      setAvatar(preview);
      setTimeout(() => setShowPopup(false), 3000);
      load();
    } else setMsg(d.error);
  }
  function saveProfile() {
    setConfirm({ open: true, title: "Simpan profil?", message: "Yakin simpan perubahan profil (nama/email/foto)?", onYes: () => { setConfirm(null); doSaveProfile(); } });
  }

  async function doSavePassword() {
    setLoading(true);
    const r = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) {
      setMsg("✅ Password berhasil terupdate!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setCurrentPassword(""); setNewPassword("");
    } else setMsg(d.error);
  }
  function savePassword() {
    if (!currentPassword || !newPassword) { setMsg("Isi password lama & baru"); return; }
    setConfirm({ open: true, title: "Ganti password?", message: "Yakin ganti password?", onYes: () => { setConfirm(null); doSavePassword(); } });
  }

  async function doActivateEmail(e: string) {
    const r = await fetch("/api/user/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "activate", email: e }) });
    const d = await r.json();
    if (d.ok) {
      setMsg(`✅ Aktif: ${e} — login pakai ini`);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      setEmail(e); load();
    } else setMsg(d.error);
  }
  function activateEmail(e: string) {
    setConfirm({ open: true, title: "Aktifkan email?", message: `Yakin aktifkan ${e} sebagai email login?`, onYes: () => { setConfirm(null); doActivateEmail(e); } });
  }
  async function doDeleteEmail(e: string, id: string) {
    const r = await fetch("/api/user/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", email: e, id }) });
    const d = await r.json();
    if (d.ok) {
      setMsg("✅ Dihapus");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      load();
    } else setMsg(d.error);
  }
  function deleteEmail(e: string, id: string) {
    setConfirm({ open: true, title: "Hapus email?", message: `Yakin hapus ${e}?`, onYes: () => { setConfirm(null); doDeleteEmail(e, id); } });
  }

  return (
    <>
      {showPopup && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border-2 font-black text-sm shadow-lg" style={{ background: "#00C853", borderColor: "#0F1E3A", color: "#FFFFFF" }}>✅ Berhasil terupdate!</div>}
      <div className="rounded-[20px] border-[3px] overflow-hidden" style={{ borderColor: "#0F1E3A", background: "#FFFBEB" }}>
      <div className="px-5 py-3 border-b-[3px] flex items-center justify-between" style={{ background: "#FF6A00", borderColor: "#0F1E3A" }}>
        <div className="font-black text-sm flex items-center gap-2" style={{ color: "#FFFFFF" }}><span className="w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: "#0F1E3A" }}>👤</span> Edit Profil</div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border-2" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Foto • Nama • Password</span>
      </div>
      <div className="p-4 space-y-4" style={{ background: "#FFD600" }}>
        <div className="grid md:grid-cols-[140px_1fr] gap-4">
          <div className="space-y-2">
            <div className="w-full h-[140px] rounded-xl border-2 overflow-hidden bg-white flex items-center justify-center" style={{ borderColor: "#0F1E3A" }}>
              {preview ? <img src={preview} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
            </div>
            <label className="block text-xs font-black" style={{ color: "#0F1E3A" }}>Ganti Foto</label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="px-3 py-1.5 rounded-full text-xs font-black border-2 shadow-[2px_2px_0px_rgba(15,30,58,1)] group-hover:shadow-[3px_3px_0px_rgba(15,30,58,1)] group-hover:-translate-y-0.5 transition-all" style={{ background: "#FF6A00", borderColor: "#0F1E3A", color: "#FFFFFF" }}>Choose File</span>
              <span className="text-xs font-medium truncate flex-1" style={{ color: fileName ? "#0F1E3A" : "#64748B" }}>{fileName || "No file chosen"}</span>
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
            <div className="text-xs font-bold p-2 rounded border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#000000" }}>Foto tampil di Menu hero & header. Wajib saat register, bisa ganti di sini.</div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black" style={{ color: "#0F1E3A" }}>Nama</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border-2 bg-white text-sm font-bold" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }} placeholder="Nama" />
            </div>
            <div>
              <label className="text-xs font-black" style={{ color: "#0F1E3A" }}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border-2 bg-white text-sm font-bold" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }} placeholder="email" />
            </div>
            <button onClick={saveProfile} disabled={loading} className="w-full py-2.5 rounded-full text-xs font-black border-2" style={{ background: "#0F1E3A", borderColor: "#0F1E3A", color: "#FFFFFF" }}>{loading ? "..." : "Simpan Profil →"}</button>
            {emails.length > 0 && (
              <div className="pt-3 border-t-2 border-dashed space-y-2" style={{ borderColor: "#0F1E3A" }}>
                <div className="text-xs font-black" style={{ color: "#0F1E3A" }}>Email histori (lama nonaktif di bawah):</div>
                {emails.map((e: any) => (
                  <div key={e.email} className="flex items-center gap-2 p-2 rounded-xl border-2 bg-white" style={{ borderColor: e.isActive ? "#0F1E3A" : "#E2E8F0", background: e.isActive ? "#C8F7C5" : "#FFFFFF" }}>
                    <span className={`w-2 h-2 rounded-full ${e.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                    <span className="flex-1 text-xs font-bold truncate" style={{ color: e.isActive ? "#0F1E3A" : "#64748B" }}>{e.email} {e.isActive && "(aktif • dipakai login)"} {!e.isActive && "(nonaktif)"}</span>
                    {!e.isActive ? (
                      <><button onClick={() => activateEmail(e.email)} className="text-xs font-black px-2 py-1 rounded-full border" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Aktifkan</button><button onClick={() => deleteEmail(e.email, e.id)} className="text-xs px-2 py-1 rounded-full border bg-white" style={{ borderColor: "#EF4444", color: "#EF4444" }}>Hapus</button></>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-white border font-bold" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Aktif</span>
                    )}
                  </div>
                ))}
                <div className="text-xs p-2 rounded border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#000000" }}>Email aktif dipakai login. Email lama nonaktif tetap di sini, bisa diaktifkan kembali atau dihapus.</div>
              </div>
            )}
            <div className="pt-3 border-t-2 border-dashed" style={{ borderColor: "#0F1E3A" }}>
              <div className="text-xs font-black mb-2" style={{ color: "#0F1E3A" }}>Ganti Password</div>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} placeholder="Password lama" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 pr-9 rounded-xl border-2 bg-white text-sm" style={{ borderColor: "#0F1E3A" }} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-xs" style={{ borderColor: "#0F1E3A" }}>{showCurrent ? "🙈" : "👁️"}</button>
              </div>
              <div className="relative mt-2">
                <input type={showNew ? "text" : "password"} placeholder="Password baru (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 pr-9 rounded-xl border-2 bg-white text-sm" style={{ borderColor: "#0F1E3A" }} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-xs" style={{ borderColor: "#0F1E3A" }}>{showNew ? "🙈" : "👁️"}</button>
              </div>
              <button onClick={savePassword} disabled={loading} className="w-full mt-2 py-2 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Ganti Password</button>
            </div>
            {msg && <div className="text-xs font-bold p-2 rounded-xl border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#000000" }}>{msg}</div>}
          </div>
        </div>
      </div>
      {confirm && <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
    </div>
    </>
  );
}
