import { getCurrentUser } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Check per-user config or env
  const { getGoogleConfigForUser } = await import("@/lib/google");
  const cfg = await getGoogleConfigForUser(user.id);
  if (!cfg.clientId) {
    return Response.json({ error: "Belum ada Google Client ID. Isi di Settings → Google Config (per-user) atau .env." }, { status: 400 });
  }

  const state = crypto.randomBytes(16).toString("hex") + "." + user.id;
  const url = await getGoogleAuthUrl(state, user.id);
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, { httpOnly: true, maxAge: 600, path: "/", sameSite: "lax" });
  return res;
}
