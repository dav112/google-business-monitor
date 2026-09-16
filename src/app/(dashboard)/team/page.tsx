import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeamClient } from "@/components/team-client";

export default async function TeamPage() {
  const user = await getCurrentUser();
  const emails = await prisma.userEmail.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="text-sm text-zinc-600">Undang rekan dengan email. Role disimpan sederhana (Viewer/Editor/Admin) — ponytail: single table, add RBAC when needed.</p>
      <TeamClient initial={emails} ownerEmail={user!.email} />
    </div>
  );
}
