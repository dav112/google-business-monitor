"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function ResetForm() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const r = useRouter();
  const [msg, setMsg] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: fd.get("password") }) });
    const data = await res.json();
    if (!res.ok) setMsg(data.error); else { setMsg("Password updated, redirecting..."); setTimeout(()=>r.push("/login"),1000); }
  }
  if (!token) return <p className="text-sm text-red-600">Token hilang. Buka link dari email/forgot response.</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2"><Label>New Password</Label><Input name="password" type="password" required /></div>
      <Button className="w-full" type="submit">Reset</Button>
      {msg && <p className="text-sm text-zinc-600">{msg}</p>}
    </form>
  );
}

export default function ResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Reset Password</CardTitle></CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm">Loading...</p>}><ResetForm /></Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
