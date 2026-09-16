import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sheets = await prisma.googleSheet.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return Response.json({ sheets });
}
