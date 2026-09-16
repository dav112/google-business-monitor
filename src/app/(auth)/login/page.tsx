"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const r = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  useEffect(()=>{ if(typeof window!=="undefined" && new URLSearchParams(window.location.search).get("suspended")) setErr("Akun Anda sedang ditangguhkan oleh admin. Hubungi developer untuk aktivasi kembali."); },[]);
  const isSuspended = err.toLowerCase().includes("ditangguhkan") || err.toLowerCase().includes("suspend");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setErr(data.error || "Login failed");
    else r.push("/menu");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Login</CardTitle><CardDescription>Masuk ke Google Business Monitor</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required placeholder="you@example.com" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" name="password" type={showPw ? "text" : "password"} required className="pr-9" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-xs" style={{ borderColor: "#0F1E3A" }}>{showPw ? "🙈" : "👁️"}</button></div></div>
            {err && !isSuspended && <p className="text-sm text-red-600">{err}</p>}
            {isSuspended && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setErr("")}>
                <div className="bg-white rounded-2xl border-[3px] p-6 max-w-sm w-full text-center space-y-3" style={{borderColor:"#0F1E3A"}} onClick={e=>e.stopPropagation()}>
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl border-2" style={{background:"#FADADD", borderColor:"#0F1E3A"}}>⛔</div>
                  <h3 className="font-black" style={{color:"#0F1E3A"}}>Akun Ditangguhkan</h3>
                  <p className="text-sm leading-relaxed" style={{color:"#0F1E3A"}}>{err}</p>
                  <p className="text-xs opacity-60">Status di Sheet: <b>SUSPEND</b> → baris putih. Hubungi admin di sheet 15Dam… untuk diaktifkan kembali (ubah jadi AKTIF → Import).</p>
                  <Button className="w-full" onClick={()=>setErr("")}>Mengerti</Button>
                </div>
              </div>
            )}
            <Button className="w-full" disabled={loading} type="submit">{loading ? "..." : "Login"}</Button>
            <div className="text-sm text-center space-y-1">
              <Link href="/register" className="text-zinc-600 underline">Belum punya akun? Register</Link>
              <div><Link href="/forgot-password" className="text-zinc-500 underline">Forgot Password?</Link></div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
