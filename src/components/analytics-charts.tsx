"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Props = { locations: { id: string; title: string }[] };

export function AnalyticsCharts({ locations }: Props) {
  const [locationId, setLocationId] = useState("");
  const [preset, setPreset] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ preset });
    if (locationId) params.set("locationId", locationId);
    if (preset === "custom" && customStart && customEnd) {
      params.set("start", customStart);
      params.set("end", customEnd);
    }
    const res = await fetch(`/api/performance?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function sync() {
    setLoading(true); setMsg("");
    const body: any = { preset };
    if (locationId) body.locationId = locationId;
    if (preset === "custom" && customStart && customEnd) { body.start = customStart; body.end = customEnd; }
    const res = await fetch("/api/performance/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    setMsg(json.ok ? `Synced ${json.count ?? json.count} • ${json.range?.startDate ?? ""}` : json.error);
    setLoading(false);
    await load();
  }

  useEffect(() => { load(); }, [locationId, preset]);

  const chart = data?.chart || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={locationId} onChange={e=>setLocationId(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">Semua Lokasi</option>
          {locations.map(l=> <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <div className="flex gap-1">
          {[
            ["today","Today"],
            ["7d","7 Days"],
            ["30d","30 Days"],
            ["90d","90 Days"],
            ["custom","Custom"],
          ].map(([k, label])=> (
            <button key={k} onClick={()=>setPreset(k)} className={`px-3 py-1 rounded border text-xs ${preset===k?"bg-zinc-900 text-white":"bg-white"}`}>{label}</button>
          ))}
        </div>
        {preset==="custom" && (
          <>
            <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <Button size="sm" variant="outline" onClick={load}>Apply</Button>
          </>
        )}
        <Button size="sm" onClick={sync} disabled={loading}>{loading?"Syncing...":"Sync Performance"}</Button>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      {msg && <div className="text-xs bg-zinc-100 p-2 rounded">{msg}</div>}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {[
            ["Maps Views", data.total.mapsViews],
            ["Search Views", data.total.searchViews],
            ["Website Clicks", data.total.websiteClicks],
            ["Phone Calls", data.total.phoneCalls],
            ["Directions", data.total.directionRequests],
            ["Reviews", data.reviewCount],
            ["Avg Rating", data.avgRating.toFixed(2)],
          ].map(([label, val])=> (
            <Card key={label as string}><CardHeader className="pb-1"><CardTitle className="text-xs font-normal text-zinc-500">{label}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{val as any}</div><div className="text-[10px] text-zinc-400">{data.start} → {data.end}</div></CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Performance over time</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          {chart.length===0 ? <div className="text-sm text-zinc-500">No data. Klik Sync Performance untuk generate mock metrics (atau hubungkan Google real).</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mapsViews" stroke="#0ea5e9" dot={false} name="Maps" />
                <Line type="monotone" dataKey="searchViews" stroke="#22c55e" dot={false} name="Search" />
                <Line type="monotone" dataKey="websiteClicks" stroke="#f59e0b" dot={false} name="Clicks" />
                <Line type="monotone" dataKey="phoneCalls" stroke="#ef4444" dot={false} name="Calls" />
                <Line type="monotone" dataKey="directionRequests" stroke="#8b5cf6" dot={false} name="Directions" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {chart.length>0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">Maps vs Search</CardTitle></CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/><Line type="monotone" dataKey="mapsViews" stroke="#0ea5e9" dot={false}/><Line type="monotone" dataKey="searchViews" stroke="#22c55e" dot={false}/></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Actions (Clicks/Calls/Directions)</CardTitle></CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend/><Line type="monotone" dataKey="websiteClicks" stroke="#f59e0b" dot={false}/><Line type="monotone" dataKey="phoneCalls" stroke="#ef4444" dot={false}/><Line type="monotone" dataKey="directionRequests" stroke="#8b5cf6" dot={false}/></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
        </div>
      )}
    </div>
  );
}
