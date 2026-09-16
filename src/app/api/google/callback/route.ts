import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens, fetchBusinessAccounts } from "@/lib/google";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) return Response.redirect(new URL(`/locations?google_error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL!));
  if (!code) return Response.json({ error: "Missing code" }, { status: 400 });

  // verify state if not mock
  if (process.env.GOOGLE_CLIENT_ID) {
    const cookieStore = await cookies();
    const expected = cookieStore.get("oauth_state")?.value;
    // lenient: if state embeds userId, also check
    if (expected && state !== expected) {
      // still allow if state contains userId (created above)
      const parts = state?.split(".") || [];
      if (parts[1] !== user.id) return Response.json({ error: "Invalid state" }, { status: 400 });
    }
  }

  let tokens: any;
  let googleEmail = "unknown@google.com";

  const { getGoogleConfigForUser } = await import("@/lib/google");
  const cfgCheck = await getGoogleConfigForUser(user.id);
  if (code === "mock_code" || !cfgCheck.clientId) {
    return Response.redirect(new URL(`/locations?google_error=${encodeURIComponent("Belum ada Google Client ID. Isi di Settings → Google Config (isi Client ID & Secret sendiri, tanpa akses server).")}`, process.env.NEXT_PUBLIC_APP_URL!));
  }
  try {
    tokens = await exchangeCodeForTokens(code, user.id);
    const uRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (uRes.ok) {
      const u = await uRes.json();
      googleEmail = u.email || googleEmail;
    }
  } catch (e: any) {
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_connect_failed", status: "failed", message: "Google connection failed" } });
    return Response.redirect(new URL(`/locations?google_error=${encodeURIComponent("Koneksi Google gagal. Cek Client ID/Secret & redirect URI.")}`, process.env.NEXT_PUBLIC_APP_URL!));
  }

  const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
  const { encrypt } = await import("@/lib/crypto");

  // upsert GoogleAccount — encrypt refresh token at rest (3. TOKEN STORAGE)
  const encRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined;
  const ga = await prisma.googleAccount.upsert({
    where: { userId_email: { userId: user.id, email: googleEmail } },
    update: { accessToken: tokens.access_token, ...(encRefresh ? { refreshToken: encRefresh } : {}), expiryDate, scope: tokens.scope },
    create: { userId: user.id, email: googleEmail, accessToken: tokens.access_token, refreshToken: encRefresh || encrypt("mock_refresh"), expiryDate, scope: tokens.scope },
  });

  // fetch & store business accounts
  try {
    const accounts = await fetchBusinessAccounts(tokens.access_token);
    for (const a of accounts) {
      await prisma.businessAccount.upsert({
        where: { googleAccountId_accountId: { googleAccountId: ga.id, accountId: a.name } },
        update: { accountName: a.accountName },
        create: { googleAccountId: ga.id, accountId: a.name, accountName: a.accountName },
      });
    }
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_connected", status: "success", message: `Google ${googleEmail} connected, ${accounts.length} account(s)` } });
  } catch (e: any) {
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_account_fetch_failed", status: "failed", message: e.message } });
  }

  // Next Response redirect already sets location; build mutable response
  const { NextResponse } = await import("next/server");
  const res = NextResponse.redirect(new URL("/locations?google_connected=1", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
