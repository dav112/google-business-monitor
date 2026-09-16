"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LocationActions({ id, isMonitored }: { id: string; isMonitored: boolean }) {
  const [loading, setLoading] = useState(false);
  async function toggle() {
    setLoading(true);
    await fetch("/api/locations/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: id, isMonitored: !isMonitored }) });
    setLoading(false); location.reload();
  }
  async function sync() {
    setLoading(true);
    await fetch("/api/locations/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: id }) });
    setLoading(false); location.reload();
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={toggle} disabled={loading}>{isMonitored ? "Disable" : "Enable"} Monitoring</Button>
      <Button size="sm" onClick={sync} disabled={loading}>Sync Now</Button>
      <a href="/dashboard" className="text-xs underline flex items-center px-2">View Dashboard</a>
    </div>
  );
}
