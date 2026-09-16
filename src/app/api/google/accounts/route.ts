import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchBusinessAccounts, getValidAccessToken } from "@/lib/google";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const gAccounts = await prisma.googleAccount.findMany({ where: { userId: user.id }, include: { businessAccounts: true } });
  // also try live refresh fetch to ensure latest
  for (const ga of gAccounts) {
    try {
      const token = await getValidAccessToken(ga as any);
      const accounts = await fetchBusinessAccounts(token);
      for (const a of accounts) {
        await prisma.businessAccount.upsert({
          where: { googleAccountId_accountId: { googleAccountId: ga.id, accountId: a.name } },
          update: { accountName: a.accountName },
          create: { googleAccountId: ga.id, accountId: a.name, accountName: a.accountName },
        });
      }
      // update token if refreshed
      if (token !== ga.accessToken) {
        await prisma.googleAccount.update({ where: { id: ga.id }, data: { accessToken: token, expiryDate: new Date(Date.now() + 3600 * 1000) } });
      }
    } catch {}
  }
  const fresh = await prisma.businessAccount.findMany({ where: { googleAccount: { userId: user.id } }, include: { googleAccount: true } });
  return Response.json({ businessAccounts: fresh, googleAccounts: gAccounts.map(g=>({ id: g.id, email: g.email, createdAt: g.createdAt })) });
}
