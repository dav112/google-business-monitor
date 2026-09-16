import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AnalyticsCharts } from "@/components/analytics-charts";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const locations = await prisma.location.findMany({ where: { userId: user!.id }, select: { id: true, title: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <AnalyticsCharts locations={locations} />
    </div>
  );
}
