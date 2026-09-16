import { clearAuthCookie, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (user) await prisma.activityLog.create({ data: { userId: user.id, type: "user_logout", status: "success", message: `User ${user.email} logged out` } });
  await clearAuthCookie();
  return Response.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), 302);
}
export async function GET() {
  await clearAuthCookie();
  return Response.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), 302);
}
