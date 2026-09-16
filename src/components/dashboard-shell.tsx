"use client";
import { useTheme } from "./theme-provider";
import { Sidebar } from "./sidebar";

export function DashboardShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; avatar?: string | null; avatarPosX?: number; avatarPosY?: number } }) {
  const { colors: C } = useTheme();
  return (
    <div className="min-h-screen flex p-3 md:p-4" style={{ background: C.outer }}>
      <div className="flex flex-1 min-h-[calc(100vh-24px)] rounded-[24px] overflow-hidden border-[3px] bg-white" style={{ borderColor: C.navy }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 shrink-0 flex items-center px-6 justify-between border-b-[3px]" style={{ background: C.header, borderColor: C.navy }}>
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
              <span className="w-7 h-7 rounded-full bg-white border-2 overflow-hidden flex items-center justify-center" style={{ borderColor: C.navy }}>
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: `${user.avatarPosX || 50}% ${user.avatarPosY || 50}%` }} /> : <span className="text-xs">👤</span>}
              </span>
              Hi, {user.name} ({user.email})
            </span>
            <span className="text-xs font-black px-2 py-1 rounded-full bg-white border-2 hidden md:inline" style={{ borderColor: C.navy, color: C.navy }}>© 2026 • MONITOR</span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto" style={{ background: C.yellow }}>{children}</main>
        </div>
      </div>
    </div>
  );
}
