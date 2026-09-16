import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchLocations, getValidAccessToken } from "@/lib/google";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const accountId = url.searchParams.get("accountId"); // e.g. accounts/1001
  if (!accountId) return Response.json({ error: "accountId required" }, { status: 400 });

  const ba = await prisma.businessAccount.findFirst({ where: { accountId, googleAccount: { userId: user.id } }, include: { googleAccount: true } });
  if (!ba) return Response.json({ error: "Account not found or not yours" }, { status: 404 });

  let token: string;
  try {
    token = await getValidAccessToken(ba.googleAccount as any);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  try {
    const locs = await fetchLocations(token, accountId);
    // update token if refreshed
    if (token !== ba.googleAccount.accessToken) {
      await prisma.googleAccount.update({ where: { id: ba.googleAccount.id }, data: { accessToken: token, expiryDate: new Date(Date.now()+3600*1000) } });
    }
    return Response.json({ locations: locs });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
