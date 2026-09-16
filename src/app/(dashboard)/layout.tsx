import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // cek apakah token ada tapi akun suspended → popup di login
    const { cookies } = await import("next/headers");
    const { jwtVerify } = await import("jose");
    try {
      const token = (await cookies()).get("token")?.value;
      if (token) {
        const { prisma } = await import("@/lib/db");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me-32-chars-long!!!");
        const { payload } = await jwtVerify(token, secret).catch(()=>({payload:null} as any));
        if (payload?.userId) {
          const u = await prisma.user.findUnique({ where: { id: (payload as any).userId } });
          if ((u as any)?.status === "suspended") {
            const { clearAuthCookie } = await import("@/lib/auth");
            await clearAuthCookie();
            redirect("/login?suspended=1");
          }
        }
      }
    } catch {}
    redirect("/login");
  }
  return <DashboardShell user={{ name: user.name, email: user.email, avatar: user.avatar, avatarPosX: user.avatarPosX, avatarPosY: user.avatarPosY }}>{children}</DashboardShell>;
}
