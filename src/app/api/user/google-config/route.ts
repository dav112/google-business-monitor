import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, decryptIfNeeded } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({
  clientId: z.string().min(3).max(500).trim(),
  clientSecret: z.string().min(3).max(500).trim(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const cfg = await prisma.userGoogleConfig.findUnique({ where: { userId: user.id } });
  if (!cfg) return Response.json({ config: null, hasEnv: !!process.env.GOOGLE_CLIENT_ID });
  // never expose secret plaintext
  const masked = (s: string) => {
    const plain = decryptIfNeeded(s);
    return plain ? `${plain.slice(0, 8)}...${plain.slice(-4)}` : "••••";
  };
  return Response.json({
    config: {
      clientId: cfg.clientId, // clientId not secret, show plain
      clientSecretMasked: masked(cfg.clientSecret),
      redirectUri: cfg.redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
      hasSecret: !!cfg.clientSecret,
      updatedAt: cfg.updatedAt,
    },
    hasEnv: !!process.env.GOOGLE_CLIENT_ID,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid input" }, { status: 400 }); }
  // allow delete
  if (body.delete) {
    await prisma.userGoogleConfig.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.create({ data: { userId: user.id, type: "google_config_deleted", status: "success", message: "User Google config deleted" } });
    return Response.json({ ok: true });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: `${first.path.join(".")}: ${first.message} (isi minimal 3 huruf)` }, { status: 400 });
  }
  const { clientId, clientSecret } = parsed.data;
  const encSecret = encrypt(clientSecret);
  const cfg = await prisma.userGoogleConfig.upsert({
    where: { userId: user.id },
    update: { clientId, clientSecret: encSecret, redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback` },
    create: { userId: user.id, clientId, clientSecret: encSecret, redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback` },
  });
  await prisma.activityLog.create({ data: { userId: user.id, type: "google_config_saved", status: "success", message: "User Google config saved" } });
  return Response.json({ ok: true, config: { clientId: cfg.clientId, updatedAt: cfg.updatedAt } });
}
