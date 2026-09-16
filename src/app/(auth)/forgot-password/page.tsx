"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ForgotPage() {
  const [msg, setMsg] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email") }) });
    const data = await res.json();
    setMsg(data.message || data.error);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Forgot Password</CardTitle><CardDescription>Masukkan email, kami kirim link reset (dev: tampil di response)</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <Button className="w-full" type="submit">Send Reset Link</Button>
            {msg && <p className="text-sm text-zinc-600 break-all">{msg}</p>}
            <div className="text-sm text-center"><Link href="/login" className="underline">Kembali ke Login</Link></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
