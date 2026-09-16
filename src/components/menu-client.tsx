"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";

type Menu = { id: string; title: string; desc: string; emoji: string; accent: string; href: string };

const MENUS: Menu[] = [
  { id: "dashboard", title: "DASHBOARD", desc: "Ringkasan performa & ulasan", emoji: "📊", accent: "#FF6B6B", href: "/dashboard" },
  { id: "locations", title: "LOCATIONS", desc: "Kelola semua cabang bisnis", emoji: "📍", accent: "#4ECDC4", href: "/locations" },
  { id: "reviews", title: "REVIEWS", desc: "Monitor & balas ulasan", emoji: "⭐", accent: "#FFE66D", href: "/reviews" },
  { id: "analytics", title: "ANALYTICS", desc: "Grafik kunjungan harian", emoji: "📈", accent: "#A8E6CF", href: "/analytics" },
  { id: "sheets", title: "GOOGLE SHEETS", desc: "Sinkron ke spreadsheet", emoji: "📑", accent: "#FF8E53", href: "/integrations/google-sheets" },
  { id: "telegram", title: "TELEGRAM", desc: "Alert ⭐1-3 ke HP", emoji: "✈️", accent: "#6C5CE7", href: "/integrations/telegram" },
  { id: "activities", title: "ACTIVITIES", desc: "Log aktivitas sistem", emoji: "📝", accent: "#FD79A8", href: "/activities" },
  { id: "settings", title: "SETTINGS", desc: "Akun & preferensi", emoji: "⚙️", accent: "#00B894", href: "/settings" },
  { id: "billing", title: "BILLING", desc: "Langganan & pembayaran", emoji: "💳", accent: "#FDCB6E", href: "/billing" },
  { id: "team", title: "TEAM", desc: "Undang tim & akses", emoji: "👥", accent: "#74B9FF", href: "/team" },
  { id: "help", title: "HELP CENTER", desc: "Panduan tutorial", emoji: "💡", accent: "#55EFC4", href: "/help" },
  { id: "security", title: "SECURITY", desc: "Privacy & sesi", emoji: "🔒", accent: "#FF7675", href: "/settings/security" },
];

export default function MenuPage({ avatar, name, posX = 50, posY = 50, zoom = 1 }: { avatar?: string | null; name?: string; posX?: number; posY?: number; zoom?: number }) {
  const [query, setQuery] = useState("");
  const [showTut, setShowTut] = useState(false);
  const [activeCat, setActiveCat] = useState("ALL MENU");
  const { colors: C } = useTheme();
  const filtered = MENUS.filter((m) => {
    const q = query.toLowerCase();
    const catOk = activeCat === "ALL MENU" || (activeCat === "FAVORIT" && ["dashboard", "reviews", "analytics"].includes(m.id)) || (activeCat === "TERBARU" && ["sheets", "telegram"].includes(m.id)) || activeCat === "ALL MENU";
    return catOk && (m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen p-3 md:p-6" style={{ background: C.outer }}>
      <div className="min-h-[calc(100vh-24px)] md:min-h-[calc(100vh-48px)] flex flex-col rounded-[24px] overflow-hidden border-[3px] bg-white" style={{ borderColor: C.navy }}>
        <header className="shrink-0 flex items-center justify-between px-4 md:px-8 py-4 border-b-[3px]" style={{ background: C.header, borderColor: C.navy }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border-[2.5px] shadow-[2px_2px_0px_rgba(15,30,58,1)]" style={{ background: "#FFFFFF", borderColor: C.navy }}>
              <span className="font-black text-sm" style={{ color: C.header }}>GB</span><span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: C.navy }} />
            </div>
            <div className="leading-none">
              <div className="flex items-baseline gap-1.5">
                <span className="font-black tracking-tight text-[13px]" style={{ color: C.navy, letterSpacing: "0.14em" }}>GOOGLE</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border" style={{ background: C.cream, borderColor: C.navy, color: C.navy }}>BUSINESS</span>
              </div>
              <div className="font-black tracking-tight text-[19px] -mt-0.5" style={{ color: "#FFFFFF", letterSpacing: "-0.03em", textShadow: `1px 1px 0 ${C.navy}` }}>MONITOR</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy }}>
              <div className="w-6 h-6 rounded-full border overflow-hidden bg-white flex items-center justify-center" style={{ borderColor: C.navy }}>
                {avatar ? <img src={avatar} alt={name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: `${posX}% ${posY}%` }} /> : <span className="text-xs">👤</span>}
              </div>
              <span className="text-xs font-bold" style={{ color: C.navy }}>Hi, {name || "User"}</span>
            </div>
            <a href="/api/auth/logout" className="px-3 py-1.5 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>Keluar</a>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="mx-4 md:mx-6 mt-4 rounded-2xl border-2 p-6 md:p-7 flex flex-col md:flex-row gap-6 items-center overflow-hidden" style={{ background: C.heroBlue, borderColor: C.navy }}>
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-[0.14em] mb-3" style={{ color: C.navy, opacity: 0.7 }}>GOOGLE BUSINESS INSIGHT</div>
              <h1 className="font-bold tracking-tight leading-[0.9]" style={{ color: C.navy, fontSize: "clamp(32px, 4.5vw, 44px)", letterSpacing: "-0.03em", fontWeight: 700 }}>PANTAU BISNIS.<br />PAHAMI PERFORMA.</h1>
              <p className="text-[15px] leading-relaxed mt-3 max-w-[480px]" style={{ color: C.navy }}>Kelola insight, ulasan, dan performa Google Business dari satu tempat.</p>
              <p className="text-sm mt-3 font-medium" style={{ color: C.navy, opacity: 0.6 }}>Semua tools yang kamu butuhkan untuk memantau dan mengelola performa bisnis.</p>
            </div>
            <div className="w-full md:w-[320px] h-[140px] md:h-[160px] rounded-xl border-2 overflow-hidden bg-white shrink-0 relative" style={{ borderColor: C.navy, backgroundImage: avatar ? `url(${avatar})` : undefined, backgroundSize: `${zoom * 100}%`, backgroundPosition: `${posX}% ${posY}%`, backgroundRepeat: "no-repeat", backgroundColor: "#FFFFFF" }}>
              {!avatar && <div className="w-full h-full flex flex-col items-center justify-center gap-1"><span className="text-4xl">👤</span><span className="text-xs font-medium" style={{ color: C.navy }}>Foto profil</span></div>}
            </div>
          </div>

          <div className="mx-4 md:mx-6 mt-3 rounded-full border-[3px] flex items-center gap-1 px-2 py-1.5 overflow-x-auto" style={{ background: C.accentBar, borderColor: C.navy }}>
            {["ALL MENU", "FAVORIT", "TERBARU", "POPULER", "GRATIS"].map((t) => (
              <button key={t} onClick={() => setActiveCat(t)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border-2 transition-colors ${activeCat === t ? "bg-white border-white" : "bg-white/20 border-transparent"}`} style={{ color: activeCat === t ? C.navy : C.cream }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border" style={{ background: activeCat === t ? C.accentBar : "rgba(255,255,255,0.2)", borderColor: activeCat === t ? C.navy : "transparent", color: activeCat === t ? "#FFFFFF" : C.cream }}>✦</span> {t}
              </button>
            ))}
            <span className="ml-auto hidden md:inline text-xs font-bold opacity-80 shrink-0" style={{ color: C.cream }}>12 menu • klik BUKA untuk halaman real + input</span>
          </div>

          <div className="flex-1 m-3 md:m-4 rounded-[20px] border-[3px] p-4 md:p-6" style={{ background: C.yellow, borderColor: C.navy }}>
            <div className="flex flex-col md:flex-row gap-3 mb-5">
              <div className="flex-1 flex items-center gap-2 rounded-full border-[3px] px-4 py-2.5 bg-white" style={{ borderColor: C.navy, background: C.yellowLight }}>
                <span className="text-sm">🔍</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari menu… (misal Reviews, Analytics)" className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-black/40" style={{ color: C.navy }} />
                {query && <button onClick={() => setQuery("")} className="text-xs font-black">✕</button>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setQuery("")} className="px-4 py-2.5 rounded-full text-xs font-black border-[3px] bg-white" style={{ borderColor: C.navy, color: C.navy }}>Semua</button>
                <button className="px-4 py-2.5 rounded-full text-xs font-black border-[3px] text-white" style={{ background: C.header, borderColor: C.navy, color: C.navy }}>Filter ⭐</button>
              </div>
            </div>

            <div className="mb-4 rounded-[20px] border-[3px] p-4" style={{ background: C.cream, borderColor: C.navy }}>
              <button onClick={() => setShowTut(!showTut)} className="w-full flex items-center justify-between text-left">
                <div className="font-black text-sm" style={{ color: C.navy }}>{showTut ? "▼" : "▶"} Tutorial: Cara Konek Google Asli (klik untuk buka)</div>
                <span className="text-xs font-bold px-2 py-1 rounded-full border-2" style={{ background: C.yellow, borderColor: C.navy, color: C.navy }}>{showTut ? "Tutup" : "Buka"}</span>
              </button>
              {showTut && (
                <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: C.navy }}>
                  <div className="p-3 rounded-xl text-xs font-medium border-2" style={{ background: C.yellowLight, borderColor: C.navy }}>Kamu cuma izinkan aplikasi <b>melihat</b> data toko. <b>Password Google tetap di Google</b>.</div>
                  <ol className="list-decimal pl-5 space-y-2 text-xs">
                    <li>Klik <a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold" style={{ color: "#0057FF" }}>console.cloud.google.com</a> → login email toko → New Project <code>gb-monitor</code></li>
                    <li>Nyalakan API: <a href="https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Saklar 1</a> • <a href="https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Saklar 2</a> • <a href="https://console.cloud.google.com/apis/library/businessprofileperformance.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Saklar 3</a> → Enable</li>
                    <li>Klik <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="underline" style={{ color: "#0057FF" }}>OAuth consent</a> → Get Started → App <code>Google Business Monitor</code> → Test users → Add email kamu</li>
                    <li>Klik <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline" style={{ color: "#0057FF" }}>Credentials → Create → OAuth Client ID</a> → Web → Add URI <code className="px-1 rounded text-white text-[11px]" style={{ background: C.navy }}>http://localhost:3000/api/google/callback</code> → Create → copy ID & Secret</li>
                    <li>Buka <code>Settings → Konfigurasi Google</code> → isi Client ID & Secret (per-user, tanpa .env) atau isi <code>.env</code></li>
                    <li>Restart: <code>lsof -ti:3000 | xargs kill -9; npm run dev</code></li>
                    <li>Buka <a href="/locations" className="underline" style={{ color: "#0057FF" }}>/locations</a> → Connect Google → Allow → Load Locations → toko asli muncul!</li>
                  </ol>
                  <div className="flex gap-2">
                    <Link href="/locations" className="px-3 py-1.5 rounded-full text-xs font-black text-white" style={{ background: C.navy }}>Pergi ke Locations →</Link>
                    <Link href="/settings" className="px-3 py-1.5 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>Lihat di Settings lengkap</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((m) => (
                  <motion.div key={m.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                    <Link href={m.href} className="text-left rounded-[20px] p-4 flex gap-3 items-center border-[3px] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all group w-full flex" style={{ background: C.cream, borderColor: "#000000", color: C.navy }}>
                      <div className="w-[72px] h-[72px] rounded-xl border-2 flex items-center justify-center text-2xl shrink-0" style={{ background: m.accent, borderColor: C.navy }}>{m.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black tracking-tight leading-none text-[15px]" style={{ letterSpacing: "-0.02em", color: C.navy }}>{m.title}</div>
                        <div className="text-xs leading-tight mt-1 line-clamp-1" style={{ color: C.navy, opacity: 0.6 }}>{m.desc}</div>
                        <div className="mt-2 inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border-2 text-white" style={{ background: C.navy, borderColor: C.navy }}>BUKA →</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
            {filtered.length === 0 && <div className="text-center py-8 text-sm font-bold" style={{ color: C.navy }}>Tidak ada menu cocok.</div>}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-black tracking-wide" style={{ color: C.navy }}>
              <span className="px-2 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy }}>© 2026</span>
              <span>Semua card sekarang link real — ada tabel & input di halaman tujuan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
