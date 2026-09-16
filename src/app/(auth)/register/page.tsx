"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const r = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.size > 2 * 1024 * 1024) { setErr("Foto maksimal 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); 
    if (!preview) { setErr("Foto profil wajib diisi"); return; }
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), avatar: preview }) });
      let data: any = {};
      try { data = await res.json(); } catch { data = { error: `Server error ${res.status}` }; }
      if (!res.ok) setErr(typeof data.error === "string" ? data.error : JSON.stringify(data.error) || `Gagal ${res.status}`);
      else window.location.href = "/menu";
    } catch (e: any) {
      setErr(e?.message ? `Network error: ${e.message} — cek http://192.168.10.169:3000 bisa dibuka?` : "Network error, coba lagi");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#E6F0FF" }}>
      <Card className="w-full max-w-sm border-[3px]" style={{ borderColor: "#0F1E3A" }}>
        <CardHeader><CardTitle>Register</CardTitle><CardDescription>Buat akun baru — foto profil wajib</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Foto Profil *</Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl border-[3px] bg-white flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: "#0F1E3A" }}>
                  {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : <span className="text-xl">📷</span>}
                </div>
                <label className="flex-1 flex items-center gap-2 cursor-pointer group">
                  <span className="px-3 py-2 rounded-full text-xs font-black border-2 shadow-[2px_2px_0px_rgba(15,30,58,1)] group-hover:shadow-[3px_3px_0px_rgba(15,30,58,1)] group-hover:-translate-y-0.5 transition-all" style={{ background: "#FF6A00", borderColor: "#0F1E3A", color: "#FFFFFF" }}>Choose File</span>
                  <span className="text-xs font-medium truncate flex-1" style={{ color: fileName ? "#0F1E3A" : "#64748B" }}>{fileName || "No file chosen"}</span>
                  <input type="file" accept="image/*" onChange={onFile} required className="hidden" />
                </label>
              </div>
              <p className="text-xs" style={{ color: "#0F1E3A" }}>Wajib upload foto — akan tampil di pojok kanan Menu Utama</p>
            </div>
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="John Doe" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password (min 6)</Label><div className="relative"><Input id="password" name="password" type={showPw ? "text" : "password"} required className="pr-9" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-xs" style={{ borderColor: "#0F1E3A" }}>{showPw ? "🙈" : "👁️"}</button></div></div>
            {err && <p className="text-sm text-red-600 break-words">{err}</p>}
            <Button className="w-full" disabled={loading} type="submit" style={{ background: "#FF6A00", color: "#FFFFFF", borderColor: "#0F1E3A" }}>{loading ? "..." : "Register"}</Button>
            <div className="text-sm text-center"><Link href="/login" className="underline">Sudah punya akun? Login</Link></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
