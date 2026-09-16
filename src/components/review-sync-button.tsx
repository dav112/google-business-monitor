"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ReviewSyncButton({ locationId }: { locationId?: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  async function sync() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/reviews/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(locationId ? { locationId } : {}) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setMsg(data.error || "Sync failed");
    else {
      const txt = data.totalNew !== undefined ? `Synced ${data.count} lokasi, ${data.totalNew} baru` : `Synced ${data.newCount} baru / ${data.total} total`;
      setMsg(txt);
      setTimeout(()=> location.reload(), 900);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={sync} disabled={loading}>{loading ? "Syncing..." : "Sync Now"}</Button>
      {msg && <span className="text-xs text-zinc-600">{msg}</span>}
    </div>
  );
}
