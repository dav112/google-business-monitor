import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptIfNeeded } from "@/lib/crypto";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const cfg = await prisma.userGoogleConfig.findUnique({ where: { userId: user.id } });
  if (!cfg) return Response.json({ ok: false, error: "Belum ada config. Isi dulu Client ID & Secret." }, { status: 400 });
  const cid = cfg.clientId;
  const sec = decryptIfNeeded(cfg.clientSecret);
  // basic format check
  const idOk = cid.endsWith(".apps.googleusercontent.com") && cid.length > 20;
  const secOk = sec.startsWith("GOCSPX-") && sec.length > 20;
  if (!idOk) return Response.json({ ok: false, error: "Client ID tidak mirip format Google (harus xxx.apps.googleusercontent.com)" });
  if (!secOk) return Response.json({ ok: false, error: "Secret tidak mirip format Google (harus awalan GOCSPX-)" });
  // try to build auth url (does not call Google, just validates)
  return Response.json({ ok: true, message: "Format Client ID & Secret terlihat benar. Klik Connect Google di /locations untuk test login beneran ke Google." });
}
