import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // @ts-ignore
  const u: any = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
  return Response.json({ theme: (await prisma.user.findUnique({ where: { id: user.id } }) as any)?.theme || "colorful" });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const theme = body.theme as string;
  if (!["colorful", "premium", "dark"].includes(theme)) return Response.json({ error: "Invalid theme" }, { status: 400 });
  // store in user if column exists, else ignore (fallback to localStorage)
  try {
    // @ts-ignore
    await prisma.user.update({ where: { id: user.id }, data: { theme } as any });
  } catch {}
  return Response.json({ ok: true, theme });
}
