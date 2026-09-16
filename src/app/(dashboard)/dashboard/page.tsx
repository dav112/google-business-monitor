import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [locations, reviews, recentReviews, lowReviews, activities, perfAgg] = await Promise.all([
    prisma.location.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { location: { userId: user.id } } }),
    prisma.review.findMany({ where: { location: { userId: user.id } }, orderBy: { createTime: "desc" }, take: 5, include: { location: true } }),
    prisma.review.findMany({ where: { location: { userId: user.id }, rating: { in: [1,2,3] } }, orderBy: { createTime: "desc" }, take: 5, include: { location: true } }),
    prisma.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.performanceMetric.aggregate({ where: { location: { userId: user.id } }, _sum: { mapsViews: true, searchViews: true, websiteClicks: true, phoneCalls: true, directionRequests: true } }),
  ]);
  const ratingGroups = await prisma.review.groupBy({ by: ["rating"], where: { location: { userId: user.id } }, _count: true });
  const dist = Object.fromEntries(ratingGroups.map(g => [g.rating, g._count]));

  const overview = [
    { label: "Maps Views", value: perfAgg._sum.mapsViews ?? 0 },
    { label: "Search Views", value: perfAgg._sum.searchViews ?? 0 },
    { label: "Website Clicks", value: perfAgg._sum.websiteClicks ?? 0 },
    { label: "Phone Calls", value: perfAgg._sum.phoneCalls ?? 0 },
    { label: "Direction Requests", value: perfAgg._sum.directionRequests ?? 0 },
    { label: "Total Reviews", value: reviews },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Dashboard</h1><Link href="/locations" className="text-sm underline">Manage Locations</Link></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {overview.map(c => <Card key={c.label}><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-zinc-500">{c.label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent></Card>)}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[5,4,3,2,1].map(star => {
              const count = dist[star] ?? 0;
              const max = Math.max(1, ...Object.values(dist) as number[]);
              const pct = max ? (count / max) * 100 : 0;
              return <div key={star} className="flex items-center gap-2 text-sm"><span className="w-8">⭐{star}</span><div className="flex-1 h-2 bg-zinc-100 rounded"><div className="h-2 bg-zinc-900 rounded" style={{width: `${pct}%`}} /></div><span className="w-6 text-right">{count}</span></div>;
            })}
            {reviews===0 && <p className="text-sm text-zinc-500">Belum ada review. Hubungkan Google & sync lokasi.</p>}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Recent Reviews</CardTitle></CardHeader><CardContent className="space-y-3">
          {recentReviews.length===0 ? <p className="text-sm text-zinc-500">No reviews yet</p> : recentReviews.map(r=>
            <div key={r.id} className="text-sm border-b pb-2 last:border-0"><div className="font-medium">{r.reviewerName ?? "Anonymous"} · ⭐{r.rating} · {r.location.title}</div><div className="text-zinc-600 line-clamp-2">{r.comment || "-"}</div></div>
          )}
          <Link href="/reviews" className="text-xs underline">View all reviews →</Link>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Negative Reviews (⭐1-3)</CardTitle></CardHeader><CardContent className="space-y-3">
          {lowReviews.length===0 ? <p className="text-sm text-zinc-500">No negative reviews 🎉</p> : lowReviews.map(r=>
            <div key={r.id} className="text-sm border-b pb-2 last:border-0"><div className="font-medium">{r.reviewerName ?? "Anonymous"} · ⭐{r.rating}</div><div className="text-zinc-600 line-clamp-2">{r.comment || "-"}</div></div>
          )}
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm text-black">Recent Activity</CardTitle></CardHeader><CardContent className="space-y-2">
        {activities.length===0 ? <p className="text-sm text-black font-bold">No activity yet</p> : activities.map(a=> <div key={a.id} className="flex justify-between text-sm border-b py-1 last:border-0 text-black"><span className="font-bold text-black">{a.type} · {a.status}</span><span className="text-black font-bold text-xs">{a.createdAt.toLocaleString("id-ID")}</span></div>)}
        <Link href="/activities" className="text-xs underline text-black font-bold">View all →</Link>
      </CardContent></Card>

      {locations===0 && <Card className="border-dashed"><CardContent className="pt-6 text-sm text-zinc-600">Belum ada lokasi. <Link href="/locations" className="underline font-medium">Tambah lokasi</Link> untuk mulai monitoring. Google OAuth akan tersedia di Phase 2.</CardContent></Card>}
    </div>
  );
}
