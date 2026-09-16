import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
export default async function ActivitiesPage() {
  const user = await getCurrentUser();
  const logs = await prisma.activityLog.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-black">Activities</h1>
      {logs.length===0 ? <Card><CardContent className="pt-6 text-sm text-black font-bold">No activities yet</CardContent></Card> : (
        <div className="space-y-1">
          {logs.map(l=> <div key={l.id} className="flex justify-between text-sm border-2 border-black rounded px-3 py-2 bg-white text-black"><span className="font-medium text-black"><b className="font-black text-black">{l.type}</b> · <span className="text-black">{l.status}</span> · <span className="text-black">{l.message}</span></span><span className="text-xs font-bold text-black">{l.createdAt.toLocaleString()}</span></div>)}
        </div>
      )}
    </div>
  );
}
