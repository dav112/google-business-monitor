"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

const nav = [
  { href: "/menu", label: "MENU UTAMA", icon: "🏠", accent: "#FFD600" },
  { href: "/admin", label: "ADMIN PANEL", icon: "🛡️", accent: "#D63031" },
  { href: "/admin/users", label: "Users", icon: "👤", accent: "#6C5CE7" },
  { href: "/admin/activity", label: "Activity", icon: "📊", accent: "#0984E3" },
  { href: "/dashboard", label: "Dashboard", icon: "📊", accent: "#FF6B6B" },
  { href: "/locations", label: "Locations", icon: "📍", accent: "#4ECDC4" },
  { href: "/reviews", label: "Reviews", icon: "⭐", accent: "#FFE66D" },
  { href: "/analytics", label: "Analytics", icon: "📈", accent: "#A8E6CF" },
  { href: "/activities", label: "Activities", icon: "📝", accent: "#FD79A8" },
  { href: "/integrations/google-sheets", label: "Google Sheets", icon: "📑", accent: "#FF8E53" },
  { href: "/integrations/telegram", label: "Telegram", icon: "✈️", accent: "#6C5CE7" },
  { href: "/billing", label: "Billing", icon: "💳", accent: "#FDCB6E" },
  { href: "/team", label: "Team", icon: "👥", accent: "#74B9FF" },
  { href: "/help", label: "Help", icon: "💡", accent: "#55EFC4" },
  { href: "/settings", label: "Settings", icon: "⚙️", accent: "#00B894" },
  { href: "/settings/security", label: "Security", icon: "🔒", accent: "#FF7675" },
];

export function Sidebar() {
  const path = usePathname();
  const { colors: C } = useTheme();
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(()=>{ fetch("/api/auth/me").then(r=>r.json()).then(d=>{ if(d.user?.role==="ADMIN") setIsAdmin(true); }).catch(()=>{}); },[]);
  const filteredNav = nav.filter(n=> {
    const adminRoutes = ["/admin","/admin/users","/admin/activity"];
    if(adminRoutes.some(a=> n.href===a || n.href.startsWith(a+"/"))) return isAdmin;
    return true;
  });
  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col border-r-[3px]" style={{ background: C.header, borderColor: C.navy }}>
      <div className="p-5 border-b-[3px] flex items-center gap-3" style={{ borderColor: C.navy, background: C.cream }}>
        <div className="w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_rgba(15,30,58,1)] bg-white" style={{ borderColor: C.navy }}><span className="font-black text-xs" style={{ color: C.header }}>GB</span><span className="w-1 h-1 rounded-full ml-0.5" style={{ background: C.navy }} /></div>
        <div className="leading-none">
          <div className="flex items-baseline gap-1"><span className="font-black text-[11px]" style={{ color: C.navy, letterSpacing: "0.12em" }}>GOOGLE</span><span className="text-[8px] font-black px-1 py-0.5 rounded-full border" style={{ background: C.header, color: "#FFFFFF", borderColor: C.navy }}>BUSINESS</span></div>
          <div className="font-black text-sm -mt-0.5" style={{ color: C.navy, letterSpacing: "-0.02em" }}>MONITOR</div>
          <div className="text-[8px] font-bold tracking-[0.16em]" style={{ color: C.navy, opacity: 0.6 }}>© 2026 • EDITORIAL</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filteredNav.map((n) => {
          const active = path === n.href || (n.href !== "/menu" && n.href !== "/settings/security" && path.startsWith(n.href + "/")) || (n.href === "/settings/security" && path === n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-black tracking-wide border-[2.5px] transition-all duration-200",
                "hover:translate-x-1 hover:shadow-[3px_3px_0px_rgba(15,30,58,1)] active:translate-x-0 active:shadow-[1px_1px_0px_rgba(15,30,58,1)] active:scale-[0.98]",
              )}
              style={{
                background: active ? C.navy : C.cream,
                borderColor: C.navy,
                color: active ? C.cream : C.navy,
              }}
            >
              <span
                className="w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[13px] shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95"
                style={{ background: active ? n.accent : "#FFFFFF", borderColor: C.navy }}
              >
                {n.icon}
              </span>
              <span className="flex-1 truncate">{n.label}</span>
              <span className={`text-[10px] transition-all duration-200 ${active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"}`}>→</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t-[3px]" style={{ borderColor: C.navy, background: C.cream }}>
        <form action="/api/auth/logout" method="POST">
          <button className="w-full rounded-xl px-3 py-2 text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>Logout</button>
        </form>
      </div>
    </aside>
  );
}
