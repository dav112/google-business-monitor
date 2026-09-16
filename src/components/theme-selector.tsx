"use client";
import { useTheme } from "./theme-provider";

const THEMES = [
  { id: "colorful", name: "Colorful", desc: "Pale blue + orange + yellow", colors: ["#E6F0FF", "#FF6A00", "#FFD600"] },
  { id: "premium", name: "Premium", desc: "Putih editorial + accent hemat", colors: ["#FFFFFF", "#0F172A", "#FF6A00"] },
  { id: "dark", name: "Dark", desc: "Navy gelap + orange", colors: ["#0F172A", "#1E293B", "#FF6A00"] },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  function select(id: any) { setTheme(id); }

  return (
    <div className="rounded-[20px] border-[3px] overflow-hidden" style={{ borderColor: "#0F1E3A", background: "#FFFBEB" }}>
      <div className="px-5 py-3 border-b-[3px] flex items-center gap-2" style={{ background: "#0F1E3A", borderColor: "#0F1E3A" }}>
        <span className="w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: "#FFFFFF" }}>🎨</span>
        <span className="font-black text-sm text-white">Tema Tampilan</span>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-white border-2" style={{ borderColor: "#FFFFFF", color: "#0F1E3A" }}>{theme}</span>
      </div>
      <div className="p-4 grid md:grid-cols-3 gap-3" style={{ background: "#FFD600" }}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => select(t.id)}
            className={`text-left rounded-xl border-[3px] p-3 transition-all ${theme === t.id ? "shadow-[4px_4px_0px_rgba(15,30,58,1)]" : "hover:shadow-sm"}`}
            style={{ background: theme === t.id ? "#0F1E3A" : "#FFFFFF", borderColor: theme === t.id ? "#0F1E3A" : "#0F1E3A", color: theme === t.id ? "#FFFFFF" : "#0F1E3A" }}
          >
            <div className="flex gap-1.5 mb-2">
              {t.colors.map((c) => (
                <span key={c} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: "#0F1E3A" }} />
              ))}
            </div>
            <div className="font-black text-sm">{t.name}</div>
            <div className="text-xs opacity-70">{t.desc}</div>
            {theme === t.id && <div className="mt-2 text-xs font-black px-2 py-1 rounded-full bg-white inline-block" style={{ color: "#0F1E3A" }}>✓ Aktif</div>}
          </button>
        ))}
      </div>
      <div className="px-4 py-2 text-xs font-bold bg-white border-t-[3px] text-center" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>
        Pilih tema → langsung berubah di Menu & Dashboard. Disimpan per-akun.
      </div>
    </div>
  );
}
