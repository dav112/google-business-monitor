import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LocationsManager } from "@/components/locations-manager";
import { LocationActions } from "@/components/location-actions";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ google_connected?: string; google_error?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [locs, businessAccounts] = await Promise.all([
    prisma.location.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, include: { businessAccount: true } }),
    prisma.businessAccount.findMany({ where: { googleAccount: { userId: user!.id } }, include: { googleAccount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Locations</h1>

      {sp.google_connected && <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">Google connected! Load locations di bawah.</div>}
      {sp.google_error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">Error: {sp.google_error}</div>}

      {/* Google connect + discovery */}
      <LocationsManager initialBAs={businessAccounts.map(b=>({ id: b.id, accountId: b.accountId, accountName: b.accountName, googleAccount: { email: b.googleAccount.email } }))} />

      {/* Owned locations */}
      <div>
        <h2 className="font-medium mb-2">Monitored Locations ({locs.length})</h2>
        {locs.length===0 ? (
          <Card><CardContent className="pt-6 text-sm text-zinc-500">Belum ada lokasi dimonitor. Load locations dari Business Account di atas lalu import.</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {locs.map(l=> (
              <Card key={l.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{l.title}</CardTitle><div className="text-xs text-zinc-500">{l.address || l.name} · {l.businessAccount?.accountName || "-"} · {l.isMonitored ? "🟢 Monitoring" : "⚪ Paused"}</div></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Rating: {l.rating ?? "-"} · Reviews: {l.reviewCount}</div>
                  <div className="text-xs text-zinc-400">Last sync: {l.lastSyncedAt?.toLocaleString() ?? "never"}</div>
                  <LocationActions id={l.id} isMonitored={l.isMonitored} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
