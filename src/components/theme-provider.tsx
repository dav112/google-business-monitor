"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { THEMES, getTheme, type ThemeId } from "@/lib/theme-config";

type Ctx = { theme: ThemeId; colors: typeof THEMES.colorful; setTheme: (id: ThemeId) => void };
const ThemeCtx = createContext<Ctx>({ theme: "colorful", colors: THEMES.colorful, setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("colorful");

  useEffect(() => {
    const local = (localStorage.getItem("gbm-theme") as ThemeId) || "colorful";
    setThemeState(local);
    document.documentElement.setAttribute("data-theme", local);
    // fetch DB theme (priority)
    fetch("/api/user/theme").then(r=>r.json()).then(d=>{
      if (d.theme && THEMES[d.theme as ThemeId]) {
        setThemeState(d.theme);
        localStorage.setItem("gbm-theme", d.theme);
        document.documentElement.setAttribute("data-theme", d.theme);
      }
    }).catch(()=>{});
    const onStorage = (e: StorageEvent) => {
      if (e.key === "gbm-theme" && e.newValue) setThemeState(e.newValue as ThemeId);
    };
    const onCustom = (e: Event) => {
      const id = (e as CustomEvent).detail as ThemeId;
      if (id) setThemeState(id);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("gbm-theme-change" as any, onCustom);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("gbm-theme-change" as any, onCustom); };
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem("gbm-theme", id);
    document.documentElement.setAttribute("data-theme", id);
    window.dispatchEvent(new CustomEvent("gbm-theme-change", { detail: id }));
    fetch("/api/user/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: id }) }).catch(()=>{});
  };

  const colors = getTheme(theme);
  return <ThemeCtx.Provider value={{ theme, colors, setTheme }}>{children}</ThemeCtx.Provider>;
}
