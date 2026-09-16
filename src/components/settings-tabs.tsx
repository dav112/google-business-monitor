"use client";
import { useState, useEffect } from "react";
import { ProfileEditor } from "./profile-editor";
import { ThemeSelector } from "./theme-selector";
import { AvatarPositionEditor } from "./avatar-position-editor";
import { UserGoogleConfig } from "./user-google-config";
import { useTheme } from "./theme-provider";

const TABS = [
  { id: "profil", label: "Profil", icon: "👤", desc: "Nama, email, foto, password" },
  { id: "tampilan", label: "Tampilan", icon: "🎨", desc: "Tema & posisi foto" },
  { id: "google", label: "Google", icon: "🔧", desc: "Client ID & Secret per-user" },
] as const;

export function SettingsTabs({ isMock }: { isMock: boolean }) {
  const { colors: C } = useTheme();
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && active) setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div className="rounded-[20px] border-[3px] overflow-hidden flex flex-col md:flex-row min-h-[480px]" style={{ borderColor: C.navy, background: "#FFFFFF" }}>
      {/* Kiri: list vertikal kayak menu */}
      <div className="w-full md:w-[300px] shrink-0 flex flex-col border-b-[3px] md:border-b-0 md:border-r-[3px]" style={{ background: C.header, borderColor: C.navy }}>
        <div className="px-4 py-3 border-b-[3px] flex items-center justify-between" style={{ background: C.cream, borderColor: C.navy }}>
          <span className="text-xs font-black tracking-widest" style={{ color: C.navy }}>KATEGORI</span>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>{TABS.length} pilihan</span>
        </div>
        <div className="p-3 space-y-2 flex-1">
          {TABS.map(t => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="w-full text-left rounded-xl p-3 flex gap-3 items-center border-[3px] transition-all"
                style={{ background: isActive ? C.navy : C.cream, borderColor: C.navy, color: isActive ? C.cream : C.navy }}
              >
                <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg shrink-0 bg-white" style={{ borderColor: C.navy }}>{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xs leading-none">{t.label.toUpperCase()}</div>
                  <div className="text-[11px] leading-tight opacity-70 truncate">{t.desc}</div>
                </div>
                <span className="text-xs font-black">{isActive ? "●" : "→"}</span>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t-[3px] hidden md:block" style={{ borderColor: C.navy, background: C.cream }}>
          <div className="text-[11px] font-bold" style={{ color: C.navy }}>Pilih kategori kiri → konten muncul di kanan. Belum klik = halaman kosong.</div>
        </div>
      </div>

      {/* Kanan: detail */}
      <div className="flex-1 min-w-0 p-4 md:p-6 overflow-auto" style={{ background: C.yellow }}>
        {!active ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 rounded-[16px] border-[3px] border-dashed bg-white" style={{ borderColor: C.navy }}>
            <div className="w-14 h-14 rounded-2xl border-[3px] flex items-center justify-center text-2xl bg-white" style={{ borderColor: C.navy }}>⚙️</div>
            <div className="font-black mt-3" style={{ color: C.navy }}>Pilih kategori di kiri</div>
            <div className="text-sm mt-1 max-w-[320px]" style={{ color: C.navy, opacity: 0.6 }}>Belum ada yang dipilih — klik salah satu dari 3 kartu vertikal di samping untuk membuka page dalamnya (Profil / Tampilan / Google).</div>
            <div className="mt-4 flex gap-2">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActive(t.id)} className="px-3 py-1.5 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>{TABS.find(t=>t.id===active)?.icon}</span>
              <span className="font-black text-sm px-3 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>{TABS.find(t=>t.id===active)?.label.toUpperCase()} — {TABS.find(t=>t.id===active)?.desc}</span>
              <button onClick={()=>setActive(null)} className="ml-auto text-xs font-black px-3 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>✕ Tutup</button>
            </div>

            {active === "profil" && <ProfileEditor />}
            {active === "tampilan" && (
              <div className="space-y-6">
                <ThemeSelector />
                <AvatarPositionEditor />
              </div>
            )}
            {active === "google" && (
              <div className="space-y-4">
                <UserGoogleConfig />
                <div className="rounded-[20px] border-[3px] p-5" style={{ background: isMock ? C.yellowLight : "#C8F7C5", borderColor: C.navy }}>
                  <div className="font-black text-sm" style={{ color: C.navy }}>Mode Global: {isMock ? "🟡 .env kosong (pakai config per-user)" : "🟢 Live (.env ada)"}</div>
                  <p className="text-sm mt-1" style={{ color: C.navy }}>{isMock ? "Isi config Google di atas — tanpa akses server." : "Config per-user diprioritaskan."}</p>
                </div>
                <div className="text-xs text-center" style={{ color: C.navy, opacity: 0.6 }}>Butuh panduan? Buka <a href="/help" className="underline" style={{ color: "#0057FF" }}>Help Center →</a></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
