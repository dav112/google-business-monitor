import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SecurityClient } from "@/components/security-client";

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Unauthorized</div>;
  const [googleAccounts, telegram, sheets, recent] = await Promise.all([
    prisma.googleAccount.findMany({ where: { userId: user.id }, select: { email: true, createdAt: true } }),
    prisma.telegramConfig.findMany({ where: { userId: user.id }, select: { chatId: true } }),
    prisma.googleSheet.findMany({ where: { userId: user.id }, select: { spreadsheetId: true } }),
    prisma.activityLog.findMany({ where: { userId: user.id, type: { in: ["user_login","login_failed","google_connected","google_disconnected","telegram_connected","sheets_connected","password_reset"] } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Security</h1>
      <SecurityClient
        user={{ email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt.toISOString() }}
        google={googleAccounts}
        telegramCount={telegram.length}
        sheetsCount={sheets.length}
        recent={recent.map(r=>({ type: r.type, status: r.status, at: r.createdAt.toISOString(), message: r.message.slice(0,120) }))}
      />
    </div>
  );
}
